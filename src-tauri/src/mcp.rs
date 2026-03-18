use crate::services::mcp as mcp_service;
use tauri::{AppHandle, State};

pub use mcp_service::McpState;

#[tauri::command]
pub fn mcp_list_tools(
    state: State<'_, McpState>,
    server_id: String,
    command: String,
    args: Vec<String>,
    env_vars: Option<String>,
) -> Result<serde_json::Value, String> {
    mcp_service::list_tools(state.inner(), &server_id, &command, &args, env_vars.as_deref())
}

#[tauri::command]
pub fn mcp_call_tool(
    state: State<'_, McpState>,
    server_id: String,
    tool_name: String,
    arguments: serde_json::Value,
) -> Result<serde_json::Value, String> {
    mcp_service::call_tool(state.inner(), &server_id, &tool_name, arguments)
}

#[tauri::command]
pub fn start_mcp_server(
    _app: AppHandle,
    _state: State<'_, McpState>,
    _command: String,
    _args: Vec<String>,
) -> Result<(), String> {
    mcp_service::start_server()
}

#[tauri::command]
pub fn send_mcp_message(_state: State<'_, McpState>, _message: String) -> Result<(), String> {
    mcp_service::send_message()
}
