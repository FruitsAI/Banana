use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

#[derive(Default)]
pub struct McpState {
    pub processes: Mutex<HashMap<String, McpServerProcess>>,
}

pub struct McpServerProcess {
    pub child: Child,
    pub stdin: std::process::ChildStdin,
    pub stdout: BufReader<std::process::ChildStdout>,
    pub initialized: bool,
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

#[tauri::command]
pub fn mcp_list_tools(
    state: State<'_, McpState>,
    server_id: String,
    command: String,
    args: Vec<String>,
    env_vars: Option<String>,
) -> Result<serde_json::Value, String> {
    eprintln!("\n========== [MCP DEBUG] ENTERING mcp_list_tools for server: {} ==========", server_id);
    let mut processes = state.processes.lock().unwrap();
    
    // 检查进程是否存在且存活
    let need_spawn = if let Some(proc) = processes.get_mut(&server_id) {
        match proc.child.try_wait() {
            Ok(None) => {
                eprintln!("[MCP DEBUG] Process {} is already running.", server_id);
                false
            },
            Ok(Some(status)) => {
                eprintln!("[MCP DEBUG] Process {} has exited with status: {}. Respawning...", server_id, status);
                true
            },
            Err(e) => {
                eprintln!("[MCP DEBUG] Error checking process {} status: {}. Respawning...", server_id, e);
                true
            }
        }
    } else {
        eprintln!("[MCP DEBUG] Process {} not found. Spawning...", server_id);
        true
    };

    if need_spawn {
        let mut cmd = Command::new(&command);
        cmd.args(&args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit());

        if let Some(env) = env_vars {
            for pair in env.split('\n') {
                let parts: Vec<&str> = pair.splitn(2, '=').collect();
                if parts.len() == 2 {
                    cmd.env(parts[0].trim(), parts[1].trim());
                }
            }
        }

        eprintln!("[MCP DEBUG] Executing command: {} {:?}", command, args);
        let mut child = cmd.spawn().map_err(|e| format!("启动 MCP 失败: {}", e))?;
        let stdin = child.stdin.take().ok_or("无法获取 stdin")?;
        let stdout = child.stdout.take().ok_or("无法获取 stdout")?;
        let reader = BufReader::new(stdout);
        
        processes.insert(server_id.clone(), McpServerProcess { 
            child, 
            stdin,
            stdout: reader,
            initialized: false 
        });
    }

    let proc = processes.get_mut(&server_id).unwrap();
    
    // 1. 只有在未初始化时才进行握手
    if !proc.initialized {
        eprintln!("[MCP DEBUG] Process {} is not initialized. Starting handshake...", server_id);
        let id = 1;

        // 发送 initialize
        let init_req = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: "initialize".to_string(),
            params: Some(serde_json::json!({
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": { "name": "Banana", "version": "1.0.0" }
            })),
            id: Some(serde_json::json!(id)),
        };
        eprintln!("[MCP DEBUG] Sending initialize request...");
        send_rpc(&mut proc.stdin, &init_req)?;
        let _init_res = read_rpc(&mut proc.child, &mut proc.stdout)?;
        eprintln!("[MCP DEBUG] Received initialize response.");

        // 发送 initialized 通知
        let initialized_notify = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: "notifications/initialized".to_string(),
            params: Some(serde_json::json!({})),
            id: None,
        };
        eprintln!("[MCP DEBUG] Sending initialized notification...");
        send_rpc(&mut proc.stdin, &initialized_notify)?;
        
        proc.initialized = true;
        eprintln!("[MCP DEBUG] Handshake complete.");
    }

    // 2. 请求 tools/list
    eprintln!("[MCP DEBUG] Sending tools/list request...");
    let list_req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        method: "tools/list".to_string(),
        params: Some(serde_json::json!({})),
        id: Some(serde_json::json!("list_tools_id")),
    };
    send_rpc(&mut proc.stdin, &list_req)?;
    let list_res = read_rpc(&mut proc.child, &mut proc.stdout)?;
    eprintln!("[MCP DEBUG] Received tools/list response.");

    Ok(list_res.result.unwrap_or(serde_json::json!({ "tools": [] })))
}

#[tauri::command]
pub fn mcp_call_tool(
    state: State<'_, McpState>,
    server_id: String,
    tool_name: String,
    arguments: serde_json::Value,
) -> Result<serde_json::Value, String> {
    eprintln!("\n========== [MCP DEBUG] ENTERING mcp_call_tool for server: {}, tool: {} ==========", server_id, tool_name);
    let mut processes = state.processes.lock().unwrap();
    let proc = processes.get_mut(&server_id).ok_or("MCP 进程未运行")?;

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
        eprintln!("[MCP DEBUG] Tool call returned error: {:?}", error);
        return Err(error.to_string());
    }

    eprintln!("[MCP DEBUG] Tool call successful.");
    Ok(res.result.unwrap_or(serde_json::json!({})))
}

fn send_rpc(stdin: &mut std::process::ChildStdin, req: &JsonRpcRequest) -> Result<(), String> {
    let json = serde_json::to_string(req).map_err(|e| e.to_string())?;
    writeln!(stdin, "{}", json).map_err(|e| format!("发送消息失败: {}", e))?;
    stdin.flush().map_err(|e| e.to_string())?;
    Ok(())
}

fn read_rpc(proc_child: &mut std::process::Child, reader: &mut BufReader<std::process::ChildStdout>) -> Result<JsonRpcResponse, String> {
    loop {
        let mut line = String::new();
        let bytes_read = reader.read_line(&mut line).map_err(|e| e.to_string())?;
        if bytes_read == 0 {
            // EOF, check if process exited
            if let Ok(Some(status)) = proc_child.try_wait() {
                eprintln!("[MCP DEBUG] READ EOF: Process exited with status: {}", status);
                return Err(format!("NEW_EOF_EXITED: MCP进程已退出，代码 {}", status));
            }
            eprintln!("[MCP DEBUG] READ EOF: Process STILL RUNNING, but stdout hit EOF.");
            return Err("NEW_EOF_STILL_RUNNING: MCP已关闭输出流，但进程仍在运行".to_string());
        }
        
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        eprintln!("[MCP DEBUG] Read Line: {}", trimmed);

        if trimmed.starts_with('{') {
            match serde_json::from_str::<JsonRpcResponse>(&line) {
                Ok(res) => {
                    eprintln!("[MCP DEBUG] Valid JSON-RPC response parsed.");
                    return Ok(res)
                },
                Err(e) => {
                    eprintln!("[MCP DEBUG] JSON parse error: {}, line: {}", e, trimmed);
                    // 解析失败则继续尝试，可能是部分输出
                    continue;
                }
            }
        }
    }
}

// 保留原有兼容接口（可选）
#[tauri::command]
pub fn start_mcp_server(
    _app: AppHandle,
    _state: State<'_, McpState>,
    _command: String,
    _args: Vec<String>,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn send_mcp_message(_state: State<'_, McpState>, _message: String) -> Result<(), String> {
    Ok(())
}
