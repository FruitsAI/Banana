use crate::services::mcp as mcp_service;
use tauri::State;

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
