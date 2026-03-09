# Banana 产品需求文档（当前实现对齐版）

> 更新日期：2026-03-09
> 目标：让需求文档与当前仓库实现保持一致，减少“文档说有、代码里没有”的偏差。

---

## 1. 产品定位

Banana 是一个基于 Tauri 的桌面 AI 助手，核心价值是：

1. 本地优先：配置与会话数据落地 SQLite。
2. 流式对话：通过 Vercel AI SDK 提供实时回复体验。
3. 可扩展工具：通过 MCP（Model Context Protocol）桥接本地/外部工具。
4. 统一视觉：采用 Liquid Glass 风格的桌面 UI。

---

## 2. 目标用户与场景

- 需要桌面端 AI 对话工具的开发者或重度知识工作者。
- 需要自定义 API 服务商（OpenAI 兼容）和模型的人群。
- 需要把 AI 与外部工具链（MCP）联动的人群。

---

## 3. 功能范围

### 3.1 已实现（当前代码已具备）

1. 桌面应用壳
- Tauri 2 + Next.js 前端集成。
- macOS Overlay 标题栏与透明窗口样式。

2. 主界面骨架
- 左侧 Rail 导航。
- 会话区 + 对话舞台（Stage）布局。
- 设置中心路由与分区。

3. 对话体验
- 输入框发送与流式渲染。
- `react-markdown` 渲染 assistant 内容。
- 用户与助手消息写入本地 `messages` 表。

4. 模型配置
- Provider 列表初始化（OpenAI/Anthropic/Gemini/OpenRouter/Ollama）。
- Provider API Key / Base URL 保存。
- Model 列表初始化、启用开关、默认模型选择保存。

5. MCP 基础能力
- 可保存 `mcp_command` 与 `mcp_args` 配置。
- 通过 Rust 启动 MCP 子进程，监听 stdout/stderr。
- 前端通过自定义 Transport 与 MCP SDK 客户端通信。

6. 外观与交互
- 主题切换（light/dark/system）。
- 动画强度切换（low/medium/high）并持久化。
- 全局 Toast 与 Confirm 反馈层。

### 3.2 进行中 / 未闭环

1. 会话管理闭环不足
- `ThreadsSidebar` 仍为静态 mock 数据。
- 新建/重命名/删除线程的完整交互尚未打通。

2. 模型选择未完全生效
- 聊天请求中模型仍是硬编码 `gpt-4o-mini`，未读取“当前默认模型”。

3. MCP 管理页未完全接入数据库实体
- `mcp_servers` 表有后端接口，但设置页仍以演示形态为主。

4. 自动化测试缺失
- 当前仓库没有系统化前端/后端测试用例。

### 3.3 当前版本不纳入（明确非目标）

- 云端账号系统与多端同步。
- 团队协作会话共享。
- 插件市场与远程分发能力。

---

## 4. 非功能要求（当前约束）

1. 数据安全
- API Key 仅保存在本地 SQLite。
- 前端不直接写 SQL，仅通过 Tauri Command。

2. 交互性能
- 动效可降级（动画强度 + prefers-reduced-motion）。
- 大量视觉效果基于 CSS 变量统一控制。

3. 跨平台
- 目标平台为 macOS / Windows / Linux。
- 已有平台差异化样式入口（如 Windows 标题栏处理）。

---

## 5. 下一版本目标（建议）

1. 打通真实线程列表（替换 sidebar mock）。
2. 聊天请求接入“用户选择的默认模型”。
3. MCP 设置页接入 `mcp_servers` 完整 CRUD。
4. 补最小验证链路（lint/build/check + 冒烟测试）。
