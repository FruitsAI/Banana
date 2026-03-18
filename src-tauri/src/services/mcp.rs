use crate::db::{Database, McpServer};
use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

pub type McpCommandResult<T> = std::result::Result<T, String>;

#[derive(Default)]
pub struct McpState {
    pub processes: Mutex<HashMap<String, McpServerProcess>>,
}

pub struct McpServerProcess {
    pub child: Child,
    pub stdin: std::process::ChildStdin,
    pub stdout: BufReader<std::process::ChildStdout>,
    pub initialized: bool,
    pub command: String,
    pub args: Vec<String>,
    pub env_vars: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcRequest {
    jsonrpc: String,
    method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    params: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    result: Option<serde_json::Value>,
    error: Option<serde_json::Value>,
    id: Option<serde_json::Value>,
}

pub async fn get_mcp_servers(db: &Database) -> Result<Vec<McpServer>> {
    db.get_mcp_servers().await
}

pub async fn upsert_mcp_server(db: &Database, state: &McpState, server: &McpServer) -> Result<()> {
    remove_server_process(state, &server.id).map_err(AppError::ConnectionFailed)?;
    db.upsert_mcp_server(server).await
}

pub async fn delete_mcp_server(db: &Database, state: &McpState, server_id: &str) -> Result<()> {
    remove_server_process(state, server_id).map_err(AppError::ConnectionFailed)?;
    db.delete_mcp_server(server_id).await
}

pub fn remove_server_process(state: &McpState, server_id: &str) -> McpCommandResult<()> {
    let mut processes = state.processes.lock().map_err(|e| e.to_string())?;
    if let Some(mut process) = processes.remove(server_id) {
        stop_process_instance(&mut process);
    }
    Ok(())
}

pub fn list_tools(
    state: &McpState,
    server_id: &str,
    command: &str,
    args: &[String],
    env_vars: Option<&str>,
) -> McpCommandResult<serde_json::Value> {
    let mut processes = state.processes.lock().map_err(|e| e.to_string())?;
    let normalized_env_vars = normalize_env_vars(env_vars);

    let need_spawn = if let Some(mut existing_process) = processes.remove(server_id) {
        let config_changed = existing_process.command != command
            || existing_process.args.as_slice() != args
            || existing_process.env_vars != normalized_env_vars;
        let process_exited = match existing_process.child.try_wait() {
            Ok(status) => status.is_some(),
            Err(_) => true,
        };

        if process_exited || config_changed {
            stop_process_instance(&mut existing_process);
            true
        } else {
            processes.insert(server_id.to_string(), existing_process);
            false
        }
    } else {
        true
    };

    if need_spawn {
        let mut cmd = Command::new(command);
        cmd.args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit());

        if let Some(env_text) = normalized_env_vars.as_deref() {
            for pair in env_text.split('\n') {
                let parts: Vec<&str> = pair.splitn(2, '=').collect();
                if parts.len() == 2 {
                    cmd.env(parts[0].trim(), parts[1].trim());
                }
            }
        }

        let mut child = cmd.spawn().map_err(|e| format!("启动 MCP 失败: {e}"))?;
        let stdin = child.stdin.take().ok_or_else(|| "无法获取 stdin".to_string())?;
        let stdout = child.stdout.take().ok_or_else(|| "无法获取 stdout".to_string())?;
        let reader = BufReader::new(stdout);

        processes.insert(
            server_id.to_string(),
            McpServerProcess {
                child,
                stdin,
                stdout: reader,
                initialized: false,
                command: command.to_string(),
                args: args.to_vec(),
                env_vars: normalized_env_vars,
            },
        );
    }

    let proc = processes
        .get_mut(server_id)
        .ok_or_else(|| "MCP 进程未运行".to_string())?;

    if !proc.initialized {
        let init_req = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: "initialize".to_string(),
            params: Some(serde_json::json!({
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": { "name": "Banana", "version": "1.0.0" }
            })),
            id: Some(serde_json::json!(1)),
        };
        send_rpc(&mut proc.stdin, &init_req)?;
        let _ = read_rpc(&mut proc.child, &mut proc.stdout)?;

        let initialized_notify = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: "notifications/initialized".to_string(),
            params: Some(serde_json::json!({})),
            id: None,
        };
        send_rpc(&mut proc.stdin, &initialized_notify)?;
        proc.initialized = true;
    }

    let list_req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        method: "tools/list".to_string(),
        params: Some(serde_json::json!({})),
        id: Some(serde_json::json!("list_tools_id")),
    };
    send_rpc(&mut proc.stdin, &list_req)?;
    let list_res = read_rpc(&mut proc.child, &mut proc.stdout)?;

    Ok(list_res.result.unwrap_or(serde_json::json!({ "tools": [] })))
}

pub fn call_tool(
    state: &McpState,
    server_id: &str,
    tool_name: &str,
    arguments: serde_json::Value,
) -> McpCommandResult<serde_json::Value> {
    let mut processes = state.processes.lock().map_err(|e| e.to_string())?;
    let proc = processes
        .get_mut(server_id)
        .ok_or_else(|| "MCP 进程未运行".to_string())?;

    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        method: "tools/call".to_string(),
        params: Some(serde_json::json!({
            "name": tool_name,
            "arguments": arguments
        })),
        id: Some(serde_json::json!(uuid::Uuid::new_v4().to_string())),
    };

    send_rpc(&mut proc.stdin, &req)?;
    let res = read_rpc(&mut proc.child, &mut proc.stdout)?;

    if let Some(error) = res.error {
        return Err(error.to_string());
    }

    Ok(res.result.unwrap_or(serde_json::json!({})))
}

pub fn start_server() -> McpCommandResult<()> {
    Err("start_mcp_server is deprecated; use mcp_list_tools/mcp_call_tool flow".to_string())
}

pub fn send_message() -> McpCommandResult<()> {
    Err("send_mcp_message is deprecated; use mcp_call_tool flow".to_string())
}

fn send_rpc(stdin: &mut std::process::ChildStdin, req: &JsonRpcRequest) -> McpCommandResult<()> {
    let json = serde_json::to_string(req).map_err(|e| e.to_string())?;
    writeln!(stdin, "{json}").map_err(|e| format!("发送消息失败: {e}"))?;
    stdin.flush().map_err(|e| e.to_string())?;
    Ok(())
}

fn read_rpc(
    proc_child: &mut std::process::Child,
    reader: &mut BufReader<std::process::ChildStdout>,
) -> McpCommandResult<JsonRpcResponse> {
    loop {
        let mut line = String::new();
        let bytes_read = reader.read_line(&mut line).map_err(|e| e.to_string())?;
        if bytes_read == 0 {
            if let Ok(Some(status)) = proc_child.try_wait() {
                return Err(format!("NEW_EOF_EXITED: MCP进程已退出，代码 {status}"));
            }
            return Err("NEW_EOF_STILL_RUNNING: MCP已关闭输出流，但进程仍在运行".to_string());
        }

        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with('{') {
            if let Ok(res) = serde_json::from_str::<JsonRpcResponse>(&line) {
                return Ok(res);
            }
        }
    }
}

fn normalize_env_vars(env_vars: Option<&str>) -> Option<String> {
    env_vars
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(str::to_owned)
}

fn stop_process_instance(process: &mut McpServerProcess) {
    let is_running = process.child.try_wait().ok().flatten().is_none();

    if is_running {
        let _ = process.child.kill();
        let _ = process.child.wait();
    }
}
