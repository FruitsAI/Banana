# FruitsAI Banana 开发计划（2026-03-18）

> 范围：基于当前分支已落地实现刷新 roadmap；用于 Task 6 之后的执行对齐。

## 1. 当前阶段总览

### 阶段 A：架构重构（Task 1-6）
状态：基本完成

- Task 1：前后端模块脚手架完成（`domain/services/stores`、Rust `services` 模块）。
- Task 2：Chat 域迁移完成（前端 service/store + 后端 `services/chat.rs`）。
- Task 3：Models/Providers 域迁移完成（前端 service/store + 后端 `services/models.rs`）。
- Task 4：MCP 域迁移完成（前端 service/store + 后端 `services/mcp.rs` 路由）。
- Task 5：共享错误归一完成（`src/shared/errors.ts` + 三域 service 对齐）。
- Task 6：文档刷新（本次提交）。

### 阶段 B：质量与发布准备（Task 7+）
状态：待执行

- 冒烟检查结果固化（`cargo build`、`npm run lint`）。
- 建立最小自动化校验链路（lint/build/test）。
- 发布前回归清单与失败分级策略。

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
1. 执行 Task 7 冒烟验证并记录结果。  
2. 补齐关键路径测试与 CI。  
3. 对 MCP 运行时稳定性做专项回归（进程重建、错误传播、资源回收）。
4. 结合真实使用流程优化会话与设置交互。

## 4. 风险与关注点
- 自动化测试覆盖仍不足，当前主要依赖手工验证与构建检查。
- MCP 进程管理属于高风险路径，后续改动需优先做回归验证。
- 历史模块仍可能存在旧调用入口，需在 Task 7+ 持续收敛。
