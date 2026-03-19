mod model_store;
pub mod models;
mod provider_store;

use crate::error::Result;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Pool, Row, Sqlite};
use std::str::FromStr;
use std::time::Duration;

pub use models::*;

#[derive(Clone)]
pub struct Database {
    pub pool: Pool<Sqlite>,
}

fn is_duplicate_column_error(error: &sqlx::Error, column_name: &str) -> bool {
    match error {
        sqlx::Error::Database(db_error) => {
            let message = db_error.message().to_ascii_lowercase();
            message.contains("duplicate column name")
                && message.contains(&column_name.to_ascii_lowercase())
        }
        _ => false,
    }
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let options = SqliteConnectOptions::from_str(database_url)
            .unwrap_or_else(|_| SqliteConnectOptions::new().filename("banana.db"))
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(10)
            .min_connections(1)
            .acquire_timeout(Duration::from_secs(5))
            .idle_timeout(Duration::from_secs(300))
            .connect_with(options)
            .await?;

        // 自动初始化及迁移表结构，保证在新创建库时能够运行
        sqlx::query(
            "
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS providers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT NOT NULL,
                is_enabled INTEGER NOT NULL DEFAULT 1,
                api_key TEXT,
                base_url TEXT
            );
            CREATE TABLE IF NOT EXISTS models (
                id TEXT PRIMARY KEY,
                provider_id TEXT NOT NULL,
                name TEXT NOT NULL,
                is_enabled INTEGER NOT NULL DEFAULT 1,
                group_name TEXT,
                capabilities TEXT,
                capabilities_source TEXT,
                FOREIGN KEY(provider_id) REFERENCES providers(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS mcp_servers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT NOT NULL,
                command TEXT NOT NULL,
                args TEXT,
                env_vars TEXT,
                is_enabled INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS threads (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                model_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                thread_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                model_id TEXT,
                ui_message_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(thread_id) REFERENCES threads(id) ON DELETE CASCADE
            );
        ",
        )
        .execute(&pool)
        .await?;

        // 兼容旧版本：尝试在存在 models 表的情况下为其添加 group_name（如果已有则忽略错误）
        let _ = sqlx::query("ALTER TABLE models ADD COLUMN group_name TEXT")
            .execute(&pool)
            .await;
        let _ = sqlx::query("ALTER TABLE models ADD COLUMN capabilities TEXT")
            .execute(&pool)
            .await;
        let _ = sqlx::query("ALTER TABLE models ADD COLUMN capabilities_source TEXT")
            .execute(&pool)
            .await;

        // 兼容旧版本：尝试在存在 providers 表的情况下为其添加 provider_type（如果已有则忽略错误）
        let _ = sqlx::query("ALTER TABLE providers ADD COLUMN provider_type TEXT")
            .execute(&pool)
            .await;

        // 兼容旧版本：尝试在存在 messages 表的情况下为其添加 model_id
        let _ = sqlx::query("ALTER TABLE messages ADD COLUMN model_id TEXT")
            .execute(&pool)
            .await;
        if let Err(error) = sqlx::query("ALTER TABLE messages ADD COLUMN ui_message_json TEXT")
            .execute(&pool)
            .await
        {
            if !is_duplicate_column_error(&error, "ui_message_json") {
                return Err(error.into());
            }
        }

        Ok(Self { pool })
    }

    /// ---- Config ----
    pub async fn get_config(&self, key: &str) -> Result<Option<String>> {
        let row = sqlx::query(r#"SELECT value FROM config WHERE key = ?"#)
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(|r| r.get::<String, _>("value")))
    }

    pub async fn set_config(&self, key: &str, value: &str) -> Result<()> {
        sqlx::query(r#"INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)"#)
            .bind(key)
            .bind(value)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// ---- McpServers ----
    pub async fn get_mcp_servers(&self) -> Result<Vec<McpServer>> {
        let records = sqlx::query_as::<_, McpServer>(
            r#"SELECT id, name, description, type, command, args, env_vars, is_enabled FROM mcp_servers ORDER BY is_enabled DESC, name ASC"#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|r| McpServer {
                id: r.id,
                name: r.name,
                description: r.description,
                r#type: r.r#type,
                command: r.command,
                args: r.args,
                env_vars: r.env_vars,
                is_enabled: r.is_enabled,
            })
            .collect())
    }

    pub async fn upsert_mcp_server(&self, s: &McpServer) -> Result<()> {
        let is_enabled_int = if s.is_enabled { 1 } else { 0 };
        sqlx::query(r#"INSERT OR REPLACE INTO mcp_servers (id, name, description, type, command, args, env_vars, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#)
            .bind(&s.id)
            .bind(&s.name)
            .bind(&s.description)
            .bind(&s.r#type)
            .bind(&s.command)
            .bind(&s.args)
            .bind(&s.env_vars)
            .bind(is_enabled_int)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn delete_mcp_server(&self, id: &str) -> Result<()> {
        sqlx::query(r#"DELETE FROM mcp_servers WHERE id = ?"#)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// ---- Threads ----
    pub async fn get_threads(&self) -> Result<Vec<Thread>> {
        let records = sqlx::query_as::<_, Thread>(
            r#"SELECT id, title, model_id, created_at, updated_at FROM threads ORDER BY updated_at DESC, created_at DESC"#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|r| Thread {
                id: r.id,
                title: r.title,
                model_id: r.model_id,
                // sqlite 时间可以直接存取为 String
                created_at: r.created_at,
                updated_at: r.updated_at,
            })
            .collect())
    }

    pub async fn create_thread(&self, id: &str, title: &str, model_id: Option<&str>) -> Result<()> {
        if let Some(m_id) = model_id {
            sqlx::query(r#"INSERT INTO threads (id, title, model_id) VALUES (?, ?, ?)"#)
                .bind(id)
                .bind(title)
                .bind(m_id)
                .execute(&self.pool)
                .await?;
        } else {
            sqlx::query(r#"INSERT INTO threads (id, title) VALUES (?, ?)"#)
                .bind(id)
                .bind(title)
                .execute(&self.pool)
                .await?;
        }
        Ok(())
    }

    pub async fn update_thread_title(&self, id: &str, title: &str) -> Result<()> {
        sqlx::query(r#"UPDATE threads SET title = ? WHERE id = ?"#)
            .bind(title)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete_thread(&self, id: &str) -> Result<()> {
        sqlx::query(r#"DELETE FROM threads WHERE id = ?"#)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_thread_time(&self, id: &str) -> Result<()> {
        sqlx::query(r#"UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"#)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// ---- Messages ----
    pub async fn get_messages(&self, thread_id: &str) -> Result<Vec<Message>> {
        let records = sqlx::query_as::<_, Message>(r#"SELECT id, thread_id, role, content, model_id, ui_message_json, created_at FROM messages WHERE thread_id = ? ORDER BY created_at ASC"#)
            .bind(thread_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|r| Message {
                id: r.id,
                thread_id: r.thread_id,
                role: r.role,
                content: r.content,
                model_id: r.model_id,
                ui_message_json: r.ui_message_json,
                created_at: r.created_at,
            })
            .collect())
    }

    pub async fn append_message(&self, msg: &Message) -> Result<()> {
        sqlx::query(r#"INSERT INTO messages (id, thread_id, role, content, model_id, ui_message_json) VALUES (?, ?, ?, ?, ?, ?)"#)
            .bind(&msg.id)
            .bind(&msg.thread_id)
            .bind(&msg.role)
            .bind(&msg.content)
            .bind(&msg.model_id)
            .bind(&msg.ui_message_json)
            .execute(&self.pool)
            .await?;

        self.update_thread_time(&msg.thread_id).await?;
        Ok(())
    }

    pub async fn delete_messages_after(&self, thread_id: &str, message_id: &str) -> Result<()> {
        // 先查出目标消息的时间戳
        let row = sqlx::query("SELECT created_at FROM messages WHERE id = ?")
            .bind(message_id)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(r) = row {
            let timestamp: String = r.get("created_at");
            // 删除该会话中，创建时间大于等于该时间戳的所有消息
            sqlx::query("DELETE FROM messages WHERE thread_id = ? AND created_at >= ?")
                .bind(thread_id)
                .bind(timestamp)
                .execute(&self.pool)
                .await?;
        }
        Ok(())
    }

    pub async fn update_message(&self, id: &str, content: &str) -> Result<()> {
        sqlx::query("UPDATE messages SET content = ? WHERE id = ?")
            .bind(content)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::Database;
    use super::Message;
    use crate::error::Result;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[tokio::test]
    async fn message_ui_payload_round_trips_through_db_layer() -> Result<()> {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after unix epoch")
            .as_nanos();
        let db_file_name = format!("banana-roundtrip-{unique}.db");
        let db_url = format!("sqlite:{db_file_name}");

        let _ = std::fs::remove_file(&db_file_name);

        let db = Database::new(&db_url).await?;
        db.create_thread("thread-roundtrip", "Roundtrip", None).await?;

        let inserted = Message {
            id: "msg-roundtrip".to_string(),
            thread_id: "thread-roundtrip".to_string(),
            role: "assistant".to_string(),
            content: "summary".to_string(),
            model_id: Some("gpt-4o-mini".to_string()),
            ui_message_json: Some(r#"{"id":"msg-roundtrip","parts":[{"type":"text","text":"full payload"}]}"#.to_string()),
            created_at: "".to_string(),
        };

        db.append_message(&inserted).await?;
        let loaded = db.get_messages("thread-roundtrip").await?;
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].ui_message_json, inserted.ui_message_json);

        drop(db);
        let _ = std::fs::remove_file(&db_file_name);

        Ok(())
    }
}
