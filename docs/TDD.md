# Banana 技术架构与设计文档（TDD，现行实现）

> 更新日期：2026-03-09
> 范围：描述仓库“当前已实现”的技术架构与关键数据流。

---

## 1. 技术栈

### 1.1 前端
- Next.js 16（App Router）
- React 19
- TypeScript（strict）
- Tailwind CSS v4 + shadcn/ui + Radix primitives
- Framer Motion

### 1.2 AI 与协议
- Vercel AI SDK（`streamText`）
- `@ai-sdk/openai`（OpenAI 兼容接口）
- `@modelcontextprotocol/sdk`（MCP client）

### 1.3 桌面与后端
- Tauri 2（Rust）
- sqlx + SQLite（`banana.db`）

---

## 2. 工程结构

```text
src/
  app/
    layout.tsx              # 根布局与全局 Provider 装配
    page.tsx                # 主聊天页
    settings/page.tsx       # 设置页入口
  components/
    layout/                 # 标题栏、Rail、ThreadsSidebar、Stage
    settings/               # 模型/MCP/主题/关于
    feedback/               # Toast / Confirm
    ui/                     # Button/Input/Dialog/Switch/Label
  hooks/
    useBananaChat.ts        # 聊天主流程
  lib/
    db.ts                   # 前端 -> Tauri command 桥
    mcp.ts                  # MCP transport
    model-settings.ts       # Provider/Model 业务辅助

src-tauri/src/
  lib.rs                    # 应用入口，注册 commands/state
  commands.rs               # Tauri 命令层
  db/                       # 数据模型与数据库访问
  mcp.rs                    # MCP 子进程管理
  error.rs                  # AppError 定义
```

---

## 3. 运行与构建链路

1. 前端开发
- `pnpm dev`

2. 桌面开发
- `pnpm tauri dev`
- Tauri 会读取 `tauri.conf.json` 的 `beforeDevCommand` 启动前端。

3. 生产构建
- `pnpm build` 生成 `out/`
- `pnpm tauri build` 打包桌面应用

---

## 4. 关键数据流

### 4.1 对话流（当前实现）

1. Stage 调用 `useBananaChat("default-thread")`。
2. 用户发送消息后：
- 先写入本地前端状态。
- 调 `appendMessage` 通过 Tauri command 写入 SQLite。
3. `useBananaChat` 读取 config（API Key/Base URL/MCP command/args）。
4. 若 MCP 配置存在：
- 建立 `TauriMcpTransport`。
- `Client.listTools()` 动态注入 AI tools。
5. 调 `streamText` 获取流式文本。
6. assistant 文本增量渲染并最终落库。

### 4.2 设置流

1. 模型设置页
- 通过 `ensureProvidersReady` / `ensureProviderModelsReady` 做默认种子补齐。
- `active_provider_id` / `active_model_id` 保存在 `config` 表。

2. MCP 设置页
- 当前主要保存 `mcp_command` 和 `mcp_args` 到 `config`。

3. 外观设置
- 主题由 `next-themes` 管理。
- 动画强度写入 `config.animation_intensity`，并映射到 `data-motion-level`。

---

## 5. 数据库设计（当前）

表：`config`, `providers`, `models`, `mcp_servers`, `threads`, `messages`

关系：
- `models.provider_id -> providers.id`
- `messages.thread_id -> threads.id`

说明：表结构由 Rust 启动时执行 `CREATE TABLE IF NOT EXISTS` 自动创建。

---

## 6. Tauri 命令面

### 6.1 数据命令
- `db_get_config` / `db_set_config`
- `db_get_providers` / `db_upsert_provider`
- `db_get_models_by_provider` / `db_upsert_model`
- `db_get_mcp_servers` / `db_upsert_mcp_server`
- `db_get_threads` / `db_create_thread`
- `db_get_messages` / `db_append_message`

### 6.2 MCP 命令
- `start_mcp_server`
- `send_mcp_message`

事件：
- `mcp-stdout`
- `mcp-stderr`

---

## 7. 当前技术债（需要关注）

1. 线程 UI 仍是 mock，数据库线程数据未驱动 sidebar。
2. 聊天模型调用与 `active_model_id` 未联动。
3. MCP 管理页未完整操作 `mcp_servers` 表。
4. 自动化测试未建立。
