use crate::db::{Database, McpServer, Message, Model, Provider, Thread};
use crate::error::Result;
use tauri::State;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
}

/// ---- Config ----
#[tauri::command]
pub async fn db_get_config(state: State<'_, AppState>, key: String) -> Result<Option<String>> {
    state.db.get_config(&key).await
}

#[tauri::command]
pub async fn db_set_config(state: State<'_, AppState>, key: String, value: String) -> Result<()> {
    state.db.set_config(&key, &value).await
}

/// ---- Providers ----
#[tauri::command]
pub async fn db_get_providers(state: State<'_, AppState>) -> Result<Vec<Provider>> {
    state.db.get_providers().await
}

#[tauri::command]
pub async fn db_upsert_provider(state: State<'_, AppState>, provider: Provider) -> Result<()> {
    state.db.upsert_provider(&provider).await
}

/// ---- Models ----
#[tauri::command]
pub async fn db_get_models_by_provider(
    state: State<'_, AppState>,
    provider_id: String,
) -> Result<Vec<Model>> {
    state.db.get_models_by_provider(&provider_id).await
}

#[tauri::command]
pub async fn db_upsert_model(state: State<'_, AppState>, model: Model) -> Result<()> {
    state.db.upsert_model(&model).await
}

#[tauri::command]
pub async fn db_delete_model(state: State<'_, AppState>, model_id: String) -> Result<()> {
    state.db.delete_model(&model_id).await
}

/// ---- McpServers ----
#[tauri::command]
pub async fn db_get_mcp_servers(state: State<'_, AppState>) -> Result<Vec<McpServer>> {
    state.db.get_mcp_servers().await
}

#[tauri::command]
pub async fn db_upsert_mcp_server(state: State<'_, AppState>, server: McpServer) -> Result<()> {
    state.db.upsert_mcp_server(&server).await
}

#[tauri::command]
pub async fn db_delete_mcp_server(state: State<'_, AppState>, server_id: String) -> Result<()> {
    state.db.delete_mcp_server(&server_id).await
}

/// ---- Threads ----
#[tauri::command]
pub async fn db_get_threads(state: State<'_, AppState>) -> Result<Vec<Thread>> {
    state.db.get_threads().await
}

#[tauri::command]
pub async fn db_create_thread(
    state: State<'_, AppState>,
    id: String,
    title: String,
    model_id: Option<String>,
) -> Result<()> {
    state
        .db
        .create_thread(&id, &title, model_id.as_deref())
        .await
}

#[tauri::command]
pub async fn db_update_thread_title(
    state: State<'_, AppState>,
    id: String,
    title: String,
) -> Result<()> {
    state.db.update_thread_title(&id, &title).await
}

#[tauri::command]
pub async fn db_delete_thread(state: State<'_, AppState>, id: String) -> Result<()> {
    state.db.delete_thread(&id).await
}

/// ---- Messages ----
#[tauri::command]
pub async fn db_get_messages(
    state: State<'_, AppState>,
    thread_id: String,
) -> Result<Vec<Message>> {
    state.db.get_messages(&thread_id).await
}

#[tauri::command]
pub async fn db_append_message(state: State<'_, AppState>, msg: Message) -> Result<()> {
    state.db.append_message(&msg).await
}

#[tauri::command]
pub async fn db_delete_messages_after(
    state: State<'_, AppState>,
    thread_id: String,
    message_id: String,
) -> Result<()> {
    state.db.delete_messages_after(&thread_id, &message_id).await
}

#[tauri::command]
pub async fn db_update_message(
    state: State<'_, AppState>,
    id: String,
    content: String,
) -> Result<()> {
    state.db.update_message(&id, &content).await
}

// 统一注册 Commands
pub fn register_commands(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    builder.invoke_handler(tauri::generate_handler![
        db_get_config,
        db_set_config,
        db_get_providers,
        db_upsert_provider,
        db_get_models_by_provider,
        db_upsert_model,
        db_delete_model,
        db_get_mcp_servers,
        db_upsert_mcp_server,
        db_delete_mcp_server,
        db_get_threads,
        db_create_thread,
        db_update_thread_title,
        db_delete_thread,
        db_get_messages,
        db_append_message,
        db_delete_messages_after,
        db_update_message,
    ])
}
