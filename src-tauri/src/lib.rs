use tauri_plugin_sql::{Migration, MigrationKind};

mod mcp;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: "
                CREATE TABLE IF NOT EXISTS config (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS threads (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    thread_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(thread_id) REFERENCES threads(id) ON DELETE CASCADE
                );
            ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .manage(mcp::McpState::default())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:banana.db", migrations)
                .build(),
        )
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
            mcp::start_mcp_server,
            mcp::send_mcp_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
