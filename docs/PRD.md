# Banana 产品需求文档（当前实现对齐）

> 更新日期：2026-03-18  
> 文档目标：与当前代码实现保持一致，描述已交付能力、核心边界与下一阶段需求。

## 1. 产品定位
Banana 是一个面向开发者与知识工作者的桌面 AI 助手，强调：
- 本地优先的数据控制（SQLite 本地持久化）。
- 多模型可配置能力（Provider/Model 管理与选择）。
- 通过 MCP 连接外部工具，形成可扩展的工具调用链路。

## 2. 目标用户与典型场景
- 需要在桌面端进行日常 AI 问答与内容生成的用户。
- 需要按供应商管理 API Key、Base URL、模型列表的用户。
- 需要把 AI 与本地/外部工具（MCP）联动的用户。

## 3. 当前已交付范围

### 3.1 对话（Chat）
- 会话与消息读写已接入数据库（`threads/messages`）。
- 流式回复与消息持久化已打通。
- 前端调用链已迁移为 `store -> service`，不在组件层直调 DB。
- 后端命令已通过 `services/chat.rs` 承载业务。

### 3.2 模型与供应商（Models/Providers）
- Provider CRUD、Model CRUD、默认选择读写已实现。
- Provider/Model 领域类型集中到 `src/domain/models/types.ts`。
- 前端设置与选择器走 `useModelsStore` + `services/models`。
- 后端命令已通过 `services/models.rs` 路由。

### 3.3 MCP
- MCP Server 配置 CRUD 已接入数据库。
- 工具发现与调用通过服务层封装，前端设置页走 `useMcpStore` + `services/mcp`。
- 后端命令与 `src-tauri/src/mcp.rs` 已通过 `services/mcp.rs` 组织核心流程。
- MCP 进程按 server_id 维护，并在配置变化或进程退出时重建。

### 3.4 统一错误处理
- 前端服务层统一使用 `AppError` 与 `normalizeError`（`src/shared/errors.ts`）。
- toast 消费对齐到 message 语义，避免多套错误结构并存。

### 3.5 全局配置（Config）
- 全局配置读写已通过 `domain/config -> services/config -> stores/config` 路径统一封装。
- 动效强度（animation intensity）已迁移至配置 store/service，不再在组件层直连 `lib/db`。

## 4. 架构与边界要求（当前执行标准）

### 4.1 前端分层
- `domain`：纯类型与领域定义。
- `services`：副作用和外部调用边界。
- `stores`：状态编排与 UI 消费接口。
- `components/hooks`：核心业务与全局配置均不直接承载持久化调用细节，统一通过 store/service 访问。

### 4.2 后端分层
- `commands.rs`：命令入口与参数转发。
- `services/*.rs`：业务逻辑与领域流程。
- `db/`：数据访问实现。

### 4.3 非目标（当前阶段）
- 云端账号体系与多端同步。
- 团队协作与权限系统。
- MCP 市场分发能力（当前仅保留基础入口与结构）。

## 5. 下一阶段需求（Roadmap 输入）
- 补齐自动化测试（前端、Rust、关键 E2E 路径）。
- 继续收敛 MCP 生命周期与可观测性（日志、异常追踪、重试策略）。
- 优化会话创建与历史管理体验（围绕真实用户流程而非模板交互）。
