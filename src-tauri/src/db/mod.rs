pub mod models;

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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(thread_id) REFERENCES threads(id) ON DELETE CASCADE
            );
        ",
        )
        .execute(&pool)
        .await?;

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

    /// ---- Providers ----
    pub async fn get_providers(&self) -> Result<Vec<Provider>> {
        let records = sqlx::query_as::<_, Provider>(
            r#"SELECT id, name, icon, is_enabled, api_key, base_url FROM providers ORDER BY is_enabled DESC, name ASC"#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|r| Provider {
                id: r.id,
                name: r.name,
                icon: r.icon,
                is_enabled: r.is_enabled,
                api_key: r.api_key,
                base_url: r.base_url,
            })
            .collect())
    }

    pub async fn upsert_provider(&self, p: &Provider) -> Result<()> {
        let is_enabled_int = if p.is_enabled { 1 } else { 0 };
        sqlx::query(r#"INSERT OR REPLACE INTO providers (id, name, icon, is_enabled, api_key, base_url) VALUES (?, ?, ?, ?, ?, ?)"#)
            .bind(&p.id)
            .bind(&p.name)
            .bind(&p.icon)
            .bind(is_enabled_int)
            .bind(&p.api_key)
            .bind(&p.base_url)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    /// ---- Models ----
    pub async fn get_models_by_provider(&self, provider_id: &str) -> Result<Vec<Model>> {
        let records = sqlx::query_as::<_, Model>(r#"SELECT id, provider_id, name, is_enabled FROM models WHERE provider_id = ? ORDER BY name ASC"#)
            .bind(provider_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(records
            .into_iter()
            .map(|r| Model {
                id: r.id,
                provider_id: r.provider_id,
                name: r.name,
                is_enabled: r.is_enabled,
            })
            .collect())
    }

    pub async fn upsert_model(&self, m: &Model) -> Result<()> {
        let is_enabled_int = if m.is_enabled { 1 } else { 0 };
        sqlx::query(r#"INSERT OR REPLACE INTO models (id, provider_id, name, is_enabled) VALUES (?, ?, ?, ?)"#)
            .bind(&m.id)
            .bind(&m.provider_id)
            .bind(&m.name)
            .bind(is_enabled_int)
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

    pub async fn update_thread_time(&self, id: &str) -> Result<()> {
        sqlx::query(r#"UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"#)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// ---- Messages ----
    pub async fn get_messages(&self, thread_id: &str) -> Result<Vec<Message>> {
        let records = sqlx::query_as::<_, Message>(r#"SELECT id, thread_id, role, content, created_at FROM messages WHERE thread_id = ? ORDER BY created_at ASC"#)
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
                created_at: r.created_at,
            })
            .collect())
    }

    pub async fn append_message(&self, msg: &Message) -> Result<()> {
        sqlx::query(r#"INSERT INTO messages (id, thread_id, role, content) VALUES (?, ?, ?, ?)"#)
            .bind(&msg.id)
            .bind(&msg.thread_id)
            .bind(&msg.role)
            .bind(&msg.content)
            .execute(&self.pool)
            .await?;

        self.update_thread_time(&msg.thread_id).await?;
        Ok(())
    }
}
