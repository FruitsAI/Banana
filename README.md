# Banana

Banana 是一个本地优先（local-first）的桌面 AI 助手，基于 `Next.js + Tauri + SQLite` 构建。

## 产品概述
- 本地持久化：会话、模型配置、MCP 服务器配置存储在本地 SQLite。
- 多模型接入：支持 Provider/Model 的配置、启停与默认选择。
- MCP 工具扩展：支持 MCP Server 配置管理、工具发现与调用。
- 分层架构：前端按 `domain/services/stores` 分层，后端按 `commands/services/db` 分层。

## 开发启动

### 前置依赖
- Node.js 18+
- npm（或 pnpm/yarn）
- Rust stable toolchain（`cargo`）
- Tauri 2 运行环境依赖

### 安装依赖
```bash
npm install
```

### 启动前端开发
```bash
npm run dev
```

### 启动桌面应用开发（Tauri）
```bash
npm run tauri dev
```

### 构建桌面应用
```bash
npm run tauri build
```

## 关键目录结构
```text
src/
  app/                     # Next.js 路由与页面
  components/              # UI 组件与设置页
  domain/                  # 纯领域类型（chat/models/mcp）
  services/                # 前端副作用层（调用 db/invoke、错误归一）
  stores/                  # 状态编排层（面向组件消费）
  lib/                     # 底层适配（Tauri invoke、MCP transport 等）
  shared/                  # 跨域共享能力（如统一错误）

src-tauri/src/
  commands.rs              # Tauri 命令入口（薄层转发）
  services/                # 后端业务服务层（chat/models/mcp）
  db/                      # SQLite 访问与持久化模块
  mcp.rs                   # MCP tauri command 入口与状态接入

docs/
  PRD.md                   # 当前产品需求文档
  PLAN.md                  # 当前 roadmap / 阶段计划
  plans/                   # 历史与专项实施计划
```

## 当前架构摘要

### 前端边界
- `domain/*/types.ts`：定义 Chat/Models/MCP 领域类型。
- `services/*`：封装数据库调用和错误归一（`AppError + normalizeError`）。
- `stores/*`：组合服务能力并向组件暴露稳定接口。
- `components/hooks`：只消费 store/service，不直接直连底层 DB invoke。

### 后端边界
- `commands.rs`：仅做参数接收与转发。
- `src-tauri/src/services/*.rs`：承载 Chat/Models/MCP 业务逻辑。
- `db/`：集中数据读写。
- MCP 相关命令通过 `services/mcp.rs` 管理进程生命周期与工具调用。

### 端到端调用链
`UI -> store -> service -> lib/db(invoke) -> tauri command -> rust service -> db/sqlite`

## 迁移现状（截至 2026-03-18）
- Chat 域：已迁移到 `domain/services/stores` 与后端 `services/chat.rs`。
- Models/Providers 域：已迁移到 `domain/services/stores` 与后端 `services/models.rs`。
- MCP 域：已迁移到 `domain/services/stores` 与后端 `services/mcp.rs`，命令层已路由至服务层。
- 错误处理：前端 service 统一使用 `src/shared/errors.ts` 做归一。

## 相关文档
- [产品需求文档](docs/PRD.md)
- [开发计划](docs/PLAN.md)
- [全栈架构重构实施计划](docs/plans/2026-03-17-fullstack-architecture-refactor.md)
