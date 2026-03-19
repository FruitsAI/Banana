# FruitsAI Banana 开发计划（2026-03-18）

> 范围：基于当前分支已落地实现刷新 roadmap；用于 Task 6 之后的执行对齐。

## 1. 当前阶段总览

### 阶段 A：架构重构（Task 1-6）
状态：完成

- Task 1：前后端模块脚手架完成（`domain/services/stores`、Rust `services` 模块）。
- Task 2：Chat 域迁移完成（前端 service/store + 后端 `services/chat.rs`）。
- Task 3：Models/Providers 域迁移完成（前端 service/store + 后端 `services/models.rs`）。
- Task 4：MCP 域迁移完成（前端 service/store + 后端 `services/mcp.rs` 路由）。
- Task 5：共享错误归一完成（`src/shared/errors.ts` + 三域 service 对齐）。
- Task 6：文档刷新完成。

### 阶段 B：质量与发布准备（Task 7+）
状态：完成首轮收口

- Task 7 冒烟检查完成（`cargo build` / `npm run build` / `npm run lint`）。
- 剩余迁移收口完成：Config 域进入 `domain/services/stores`，组件层不再直连 `lib/db`。
- lint 错误已清零（当前仅保留 3 条 `no-img-element` 警告）。

## 2. 已落地架构基线

### 前端
- 分层：`domain -> services -> stores -> components/hooks`。
- 三个核心域（Chat/Models/MCP）均已按分层迁移。
- 错误处理已统一为共享 `AppError` 语义。

### 后端（Tauri/Rust）
- 分层：`commands -> services -> db`。
- `commands.rs` 已作为薄层，核心逻辑进入 `services/chat.rs`、`services/models.rs`、`services/mcp.rs`。
- MCP 命令入口（`src-tauri/src/mcp.rs`）已以服务层为主通路。

## 3. 下一步执行顺序
1. 补齐关键路径自动化测试与 CI 门禁。  
2. 对 MCP 运行时稳定性做专项回归（进程重建、错误传播、资源回收）。  
3. 评估并处理 UI 警告（`no-img-element`）以提升前端质量基线。  
4. 结合真实使用流程优化会话与设置交互。

## 4. 风险与关注点
- 自动化测试覆盖仍不足，当前仍以构建与手工验证为主。
- MCP 进程管理属于高风险路径，后续改动需优先做回归验证。
- API 供应商兼容路径存在类型断言，升级 SDK 时需重点回归。
