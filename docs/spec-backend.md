# Banana AI 后端开发规范

> 本规范适用于 Tauri 后端 (Rust) 和数据库操作代码的开发。
> **架构核心定调：所有查库和核心业务逻辑统一归属后端 Rust**，前端仅负责视图渲染和 Tauri Command/Event 的调用。

---

## 目录

1. [通用原则](#通用原则)
2. [Rust 代码规范](#rust-代码规范)
3. [数据库操作规范 (逻辑下沉)](#数据库操作规范)
4. [错误处理规范](#错误处理规范)
5. [API 与事件通信规范](#api-设计规范)
6. [性能优化规范](#性能优化规范)
7. [测试规范](#测试规范)
8. [文档规范](#文档规范)

---

## 通用原则

### 1.1 代码组织

- **模块化设计**：按功能模块组织代码，避免单体文件。推荐划分诸如 `db.rs`, `mcp.rs`, `models.rs`。
- **业务逻辑后端化**：核心业务逻辑、数据库 CRUD、文件读写等全部交给 Rust 处理。前端不得直接拼装 SQL (废除前端经由 `tauri-plugin-sql` 直连的弱安全模式)。
- **依赖注入**：使用依赖注入管理状态结构 (通过 `tauri::State`)。
- **配置分离**：配置与代码分离，必要时由本地数据库 config 表承载全局偏好。

### 1.2 命名规范

| 类型      | 规范                 | 示例              |
| --------- | -------------------- | ----------------- |
| 模块/文件 | snake_case           | `mcp_service.rs`  |
| 结构体    | PascalCase           | `McpServer`       |
| 枚举      | PascalCase           | `ProviderType`    |
| 函数      | snake_case           | `get_mcp_servers` |
| 常量      | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 类型别名  | PascalCase           | `ServerId`        |

---

## Rust 代码规范

### 2.1 文件结构与实体映射

对应真实的数据库表架构 (`mcp_servers`, `providers`, `models`, `threads` 等)，在 Rust 中应预先定义强类型数据结构。

```rust
// 1. 模块文档注释
//! MCP 服务模块
//!
//! 提供 MCP (Model Context Protocol) 服务器的管理和守护进程生命周期功能

// 2. 导入语句（按顺序：标准库 -> 第三方 -> 内部）
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::error::Result;

// 3. 常量定义
const DEFAULT_TIMEOUT: u64 = 30;

// 4. 类型定义
pub type ServerId = String;

// 5. 结构体定义 (与重新设计的表结构对齐)
/// MCP 服务器配置实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServer {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub r#type: String, // "stdio" 或 "sse"
    pub command: String,
    pub args: Option<String>,
    pub env_vars: Option<String>,
    pub is_enabled: bool, // 映射数据库的 INTEGER 1/0
}

/// 模型供应商配置实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub is_enabled: bool,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
}

// 6. trait 定义
/// 存储接口规范
pub trait McpStore {
    async fn get(&self, id: &str) -> Result<Option<McpServer>>;
    async fn save(&self, server: &McpServer) -> Result<()>;
}
```

### 2.2 函数规范

```rust
/// 获取启用的 MCP 服务器列表
///
/// # Arguments
/// * `store` - 存储接口
///
/// # Returns
/// 返回符合条件的服务器列表
///
/// # Errors
/// 当存储操作查询失败时触发
pub async fn get_enabled_mcp_servers(
    store: &dyn McpStore,
) -> Result<Vec<McpServer>> {
    // 实现...
}
```

### 2.3 错误处理

```rust
use thiserror::Error;

/// 后端全局服务错误类型
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Entity not found: {0}")]
    NotFound(String),

    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error(transparent)]
    Database(#[from] sqlx::Error),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// 供内部调用
pub type Result<T> = std::result::Result<T, AppError>;
```

---

## 数据库操作规范 (逻辑下沉)

**安全要求**：所有针对本地 SQLite (`banana.db`) 的查询操作必须集中收口在 Rust 端，借助 `sqlx` 组件实现安全的占位符防护与映射，并随后封装为 Tauri Command 返回给前端。

### 3.1 数据库连接池管理

```rust
use sqlx::{Pool, Sqlite};

/// 数据库状态容器
#[derive(Clone)]
pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    /// 初始化 Sqlx 连接池，在应用冷启动验证并执行迁移
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = Pool::connect(database_url).await?;

        // 执行自动构建的数据库迁移(Migrations)
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await?;

        Ok(Self { pool })
    }
}
```

### 3.2 强类型与参数化查询

所有的 SQL 操作需经由编译期类型宏 (`sqlx::query!`) 或以防注入绑定机制（`.bind()`）。

```rust
/// 针对具体 MCP 实体获取
pub async fn get_mcp_server(&self, id: &str) -> Result<Option<McpServer>> {
    let row = sqlx::query_as!(
        McpServerRow, // 中间映射容器
        r#"
        SELECT id, name, description, type, command, args, env_vars, is_enabled
        FROM mcp_servers
        WHERE id = ?
        "#,
        id
    )
    .fetch_optional(&self.pool)
    .await?;

    Ok(row.map(|r| r.into()))
}

/// 涉及多条数据变更必须开启 Transaction 事务
pub async fn save_providers(&self, providers: &[Provider]) -> Result<()> {
    let mut tx = self.pool.begin().await?;

    for provider in providers {
        sqlx::query!(
            r#"
            INSERT INTO providers (id, name, icon, is_enabled, api_key, base_url)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                icon = excluded.icon,
                is_enabled = excluded.is_enabled,
                api_key = excluded.api_key,
                base_url = excluded.base_url
            "#,
            provider.id, provider.name, provider.icon, provider.is_enabled, provider.api_key, provider.base_url
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}
```

### 3.3 数据模型转换层

SQLite 不原生支持布尔类型，此层负责从 `INTEGER` 取值等底层机制中剥离前端所看到的 Boolean。

```rust
struct McpServerRow {
    id: String,
    name: String,
    description: Option<String>,
    r#type: String,
    command: String,
    args: Option<String>,
    env_vars: Option<String>,
    is_enabled: i64,
}

impl From<McpServerRow> for McpServer {
    fn from(row: McpServerRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            description: row.description,
            r#type: row.r#type,
            command: row.command,
            args: row.args,
            env_vars: row.env_vars,
            is_enabled: row.is_enabled != 0,
        }
    }
}
```

---

## 错误处理规范 (Tauri 抛掷)

### 4.1 安全呈现给前端的 Errors

所有经由 `#[tauri::command]` 向上返回给 Typescript 的 `Error` 都必须满足安全序列化。

```rust
/// 为 AppError 实现字符串序列化，使得前端 try/catch 能够捕获明确的信息文本
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
```

---

## API 与事件通信规范

### 5.1 Tauri Commands (RPC 同步请求)

前端主动要求获取/设置内容的主通道。

- **命名规范**：下划线分词形式如 `db_fetch_providers`, `system_restart_mcp`。
- **状态注入**：借助 `tauri::State` 获取全局数据库资源以完成底层指令。

```rust
#[tauri::command]
pub async fn db_fetch_mcp_servers(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<McpServer>, AppError> {
    state.db.get_mcp_servers().await
}

#[tauri::command]
pub async fn db_upsert_provider(
    state: tauri::State<'_, AppState>,
    provider: Provider,
) -> Result<(), AppError> {
    state.db.save_provider(&provider).await
}

pub fn register_commands(app: &mut tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    app.invoke_handler(tauri::generate_handler![
        db_fetch_mcp_servers,
        db_upsert_provider,
    ])
}
```

### 5.2 Tauri Events (后端监听/流推)

对于大模型逐字打字机推流、或 MCP 子系统的实时标准输出输出，应当坚决避免 HTTP 轮询，采用 Event 通信机制。

- **事件命名**：小写与断线 (`-`) 格式：`mcp-stdout`, `mcp-stderr`, `llm-token-chunk`。
- **强类型 Payload**：在 Rust 构造 Payload 结构并发放。

```rust
use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
struct McpLogPayload {
    pub server_id: String,
    pub log_line: String,
}

pub fn emit_mcp_log(app_handle: &tauri::AppHandle, server_id: &str, line: &str) {
    let _ = app_handle.emit("mcp-stdout", McpLogPayload {
        server_id: server_id.to_string(),
        log_line: line.to_string(),
    });
}
```

---

## 性能优化规范

### 6.1 连接池调优

```rust
use sqlx::pool::PoolOptions;

/// 防止句柄耗尽与资源闲置
pub async fn create_pool(database_url: &str) -> Result<Pool<Sqlite>> {
    PoolOptions::<Sqlite>::new()
        .max_connections(10)      // 防止 Sqlite 锁定
        .min_connections(2)       // 维持基础响应
        .acquire_timeout(std::time::Duration::from_secs(5))
        .idle_timeout(std::time::Duration::from_secs(300))
        .connect(database_url)
        .await
        .map_err(|e| e.into())
}
```

### 6.2 异步限流与缓存

```rust
use futures::stream::{self, StreamExt};

/// 长任务与大规模处理限流
pub async fn start_multiple_mcps(ids: &[String]) -> Result<()> {
    stream::iter(ids)
        .map(|id| async move { start_mcp_server(id).await })
        .buffer_unordered(3)  // 最高支持同时引导启动 3 个 MCP
        .collect::<Vec<_>>()
        .await;

    Ok(())
}
```

---

## 测试规范

### 7.1 测试隔离

借助 SQLite `:memory:` 进行 Mock 无损的隔离性测试。

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_model() {
        let provider = Provider {
            id: "openai".into(),
            name: "OpenAI".into(),
            icon: "O".into(),
            is_enabled: true,
            api_key: None,
            base_url: None,
        };
        assert_eq!(provider.id, "openai");
    }
}
```

### 7.2 核心查询 Mock

```rust
#[tokio::test]
async fn test_database_operations() {
    // 使用纯内存连接
    let db = Database::new(":memory:").await.unwrap();
    let provider = Provider { /*...*/ };

    // 测试执行
    db.save_providers(&[provider.clone()]).await.unwrap();
    let fetched = db.get_provider(&provider.id).await.unwrap();
    assert_eq!(fetched.unwrap().name, provider.name);
}
```

---

## 文档与强制检查清单

### 8.1 结构体注释体感

```rust
/// MCP 服务器配置实体
///
/// 包含连通本地或远程 MCP 守护进程所需的完整上下文。
///
/// # 字段
/// - `id`: 唯一标识符
/// - `is_enabled`: 是否在全局主动注入该 MCP 工具集
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServer {
    // ...
}
```

### 8.2 规范检查项

- [ ] **严禁架构越权**：所有 `db.ts` 不得拥有原生 SQL 调用能力。前端务必通过 `invoke('db_xxx')` 进行数据操作！
- [ ] 所有业务级抛错能够以明确信息跨域（Serialize）给前端捕获显示。
- [ ] 所有参数一律使用 `sqlx` 的占位符注入以规避 SQL 注入风险。

---

## 更新记录

| 版本  | 日期       | 更新内容                                                                                                                                                                                           |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2025-03-08 | 初始版本                                                                                                                                                                                           |
| 1.1.0 | 2026-03-08 | **架构修正**：全面确立由 Rust 掌管核心逻辑架构（取消前端利用插件直查）；修复了被混淆的业务名词（如 `McpProvider` 改正为 `McpServer` / `Provider`）；完善了 Tauri Command 和 Event 系统的通信契约。 |
