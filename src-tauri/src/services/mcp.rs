use crate::db::{Database, McpServer};
use crate::domain::mcp::{
    build_call_tool_request, build_initialize_request, build_initialized_notification,
    build_list_tools_request, JsonRpcRequest, JsonRpcResponse, McpServerConfig,
};
use crate::error::{AppError, Result};
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
    let requested_config = McpServerConfig::new(command, args, env_vars)?;

    let need_spawn = if let Some(mut existing_process) = processes.remove(server_id) {
        let config_changed = existing_process.command != requested_config.command
            || existing_process.args != requested_config.args
            || existing_process.env_vars != requested_config.env_vars;
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
        let mut cmd = Command::new(&requested_config.command);
        cmd.args(&requested_config.args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit());

        if let Some(env_text) = requested_config.env_vars.as_deref() {
            for pair in env_text.split('\n') {
                let parts: Vec<&str> = pair.splitn(2, '=').collect();
                if parts.len() == 2 {
                    cmd.env(parts[0].trim(), parts[1].trim());
                }
            }
        }

        let mut child = cmd.spawn().map_err(|e| format!("启动 MCP 失败: {e}"))?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "无法获取 stdin".to_string())?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "无法获取 stdout".to_string())?;
        let reader = BufReader::new(stdout);

        processes.insert(
            server_id.to_string(),
            McpServerProcess {
                child,
                stdin,
                stdout: reader,
                initialized: false,
                command: requested_config.command.clone(),
                args: requested_config.args.clone(),
                env_vars: requested_config.env_vars.clone(),
            },
        );
    }

    let proc = processes
        .get_mut(server_id)
        .ok_or_else(|| "MCP 进程未运行".to_string())?;

    if !proc.initialized {
        let init_req = build_initialize_request();
        send_rpc(&mut proc.stdin, &init_req)?;
        let _ = read_rpc(&mut proc.child, &mut proc.stdout)?;

        let initialized_notify = build_initialized_notification();
        send_rpc(&mut proc.stdin, &initialized_notify)?;
        proc.initialized = true;
    }

    let list_req = build_list_tools_request();
    send_rpc(&mut proc.stdin, &list_req)?;
    let list_res = read_rpc(&mut proc.child, &mut proc.stdout)?;

    Ok(list_res
        .result
        .unwrap_or(serde_json::json!({ "tools": [] })))
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

    let req = build_call_tool_request(tool_name, arguments);

    send_rpc(&mut proc.stdin, &req)?;
    let res = read_rpc(&mut proc.child, &mut proc.stdout)?;

    if let Some(error) = res.error {
        return Err(error.to_string());
    }

    Ok(res.result.unwrap_or(serde_json::json!({})))
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

fn stop_process_instance(process: &mut McpServerProcess) {
    let is_running = process.child.try_wait().ok().flatten().is_none();

    if is_running {
        let _ = process.child.kill();
        let _ = process.child.wait();
    }
}
