pub mod commands;
pub mod db;
pub(crate) mod domain;
pub(crate) mod services;
pub mod error;
mod mcp;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化全局数据库状态 (从 AppHandle 中获取路径以挂载 sqlite 文件)
    let db_path = "sqlite:banana.db";

    // block_on 同步执行异步的 pool 初始化
    let db_instance = tauri::async_runtime::block_on(async { db::Database::new(db_path).await })
        .expect("Failed to initialize database pool");

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(mcp::McpState::default())
        .manage(commands::AppState { db: db_instance })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            mcp::mcp_list_tools,
            mcp::mcp_call_tool,
            commands::db_get_config,
            commands::db_set_config,
            commands::db_get_providers,
            commands::db_upsert_provider,
            commands::db_delete_provider,
            commands::db_get_models_by_provider,
            commands::db_upsert_model,
            commands::db_delete_model,
            commands::db_get_mcp_servers,
            commands::db_upsert_mcp_server,
            commands::db_delete_mcp_server,
            commands::db_get_threads,
            commands::db_create_thread,
            commands::db_update_thread_title,
            commands::db_delete_thread,
            commands::db_append_message,
            commands::db_get_messages,
            commands::db_delete_messages_after,
            commands::app_check_update,
            commands::app_install_update,
            commands::app_restart_to_apply_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
