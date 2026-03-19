use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Config {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub is_enabled: bool,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub provider_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Model {
    pub id: String,
    pub provider_id: String,
    pub name: String,
    pub is_enabled: bool,
    pub group_name: Option<String>,
    pub capabilities: Option<String>,
    pub capabilities_source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct McpServer {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub r#type: String,
    pub command: String,
    pub args: Option<String>,
    pub env_vars: Option<String>,
    pub is_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Thread {
    pub id: String,
    pub title: String,
    pub model_id: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: String,
    pub thread_id: String,
    pub role: String,
    pub content: String,
    pub model_id: Option<String>,
    pub ui_message_json: Option<String>,
    pub created_at: String,
}
