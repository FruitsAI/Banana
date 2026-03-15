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
        let records = sqlx::query_as::<_, Message>(r#"SELECT id, thread_id, role, content, model_id, created_at FROM messages WHERE thread_id = ? ORDER BY created_at ASC"#)
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
                created_at: r.created_at,
            })
            .collect())
    }

    pub async fn append_message(&self, msg: &Message) -> Result<()> {
        sqlx::query(r#"INSERT INTO messages (id, thread_id, role, content, model_id) VALUES (?, ?, ?, ?, ?)"#)
            .bind(&msg.id)
            .bind(&msg.thread_id)
            .bind(&msg.role)
            .bind(&msg.content)
            .bind(&msg.model_id)
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
