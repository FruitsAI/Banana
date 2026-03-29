use serde::{Deserialize, Serialize};

pub type McpDomainResult<T> = std::result::Result<T, String>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct McpServerConfig {
    pub command: String,
    pub args: Vec<String>,
    pub env_vars: Option<String>,
}

impl McpServerConfig {
    pub fn new(command: &str, args: &[String], env_vars: Option<&str>) -> McpDomainResult<Self> {
        let normalized_command = command.trim();
        if normalized_command.is_empty() {
            return Err("MCP command cannot be empty".to_string());
        }

        Ok(Self {
            command: normalized_command.to_string(),
            args: args.to_vec(),
            env_vars: normalize_env_vars(env_vars),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub result: Option<serde_json::Value>,
    pub error: Option<serde_json::Value>,
    pub id: Option<serde_json::Value>,
}

pub fn normalize_env_vars(env_vars: Option<&str>) -> Option<String> {
    env_vars
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(str::to_owned)
}

pub fn build_initialize_request() -> JsonRpcRequest {
    JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        method: "initialize".to_string(),
        params: Some(serde_json::json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": env!("CARGO_PKG_NAME"),
                "version": env!("CARGO_PKG_VERSION")
            }
        })),
        id: Some(serde_json::json!(1)),
    }
}

pub fn build_initialized_notification() -> JsonRpcRequest {
    JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        method: "notifications/initialized".to_string(),
        params: Some(serde_json::json!({})),
        id: None,
    }
}

pub fn build_list_tools_request() -> JsonRpcRequest {
    JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        method: "tools/list".to_string(),
        params: Some(serde_json::json!({})),
        id: Some(serde_json::json!("list_tools_id")),
    }
}

pub fn build_call_tool_request(tool_name: &str, arguments: serde_json::Value) -> JsonRpcRequest {
    JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        method: "tools/call".to_string(),
        params: Some(serde_json::json!({
            "name": tool_name,
            "arguments": arguments
        })),
        id: Some(serde_json::json!(uuid::Uuid::new_v4().to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn config_normalizes_env_vars() {
        let config = McpServerConfig::new(
            " npx ",
            &[
                String::from("-y"),
                String::from("@modelcontextprotocol/server-filesystem"),
            ],
            Some("  KEY=value  "),
        )
        .expect("config should be valid");

        assert_eq!(config.command, "npx");
        assert_eq!(config.env_vars.as_deref(), Some("KEY=value"));
    }

    #[test]
    fn initialize_request_uses_expected_method() {
        let request = build_initialize_request();
        assert_eq!(request.method, "initialize");
        assert_eq!(request.id, Some(serde_json::json!(1)));
    }

    #[test]
    fn initialize_request_uses_package_version_for_client_info() {
        let request = build_initialize_request();
        let params = request
            .params
            .expect("initialize request should include params");

        assert_eq!(params["clientInfo"]["name"], serde_json::json!("Banana"));
        assert_eq!(
            params["clientInfo"]["version"],
            serde_json::json!(env!("CARGO_PKG_VERSION"))
        );
    }
}
