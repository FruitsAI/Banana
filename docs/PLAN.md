# FruitsAI Banana 开发计划（现状版）

> 更新时间：2026-03-09
> 说明：本计划以当前仓库代码为准，不再沿用早期“全部已完成”的勾选状态。

---

## 阶段 A：基础底座与 UI 骨架

### 状态：已完成

1. 前端/桌面工程搭建
- Next.js + TypeScript + Tailwind + Tauri 2 已集成。

2. 核心布局
- RootLayout、Titlebar、Rail、Stage、Settings 路由已落地。

3. 本地数据库底座
- Rust 侧 SQLite 初始化与核心表创建已实现。

---

## 阶段 B：模型与对话主链路

### 状态：部分完成

1. 已完成
- Provider/Model 配置页面可读写数据库。
- 聊天流式响应已接通（Vercel AI SDK）。
- 消息可写入本地 `messages` 表。

2. 待完善
- 聊天模型选择仍硬编码，未使用 `active_model_id`。
- 线程管理尚未形成完整闭环（sidebar 仍是 mock）。

---

## 阶段 C：MCP 能力

### 状态：基础能力完成，管理能力未闭环

1. 已完成
- MCP 子进程启动、stdin 写入、stdout/stderr 事件转发。
- 前端 MCP Transport + MCP Client 工具发现与调用。

2. 待完善
- 设置页对 `mcp_servers` 的完整 CRUD。
- 多 MCP 实例并存、日志可视化与生命周期管理增强。

---

## 阶段 D：质量保障与发布准备

### 状态：未完成

1. 需要补齐
- 前端测试、Rust 单测、端到端冒烟。
- CI 流程（lint/build/check/test）统一。
- 发布前回归检查清单。

---

## 近期优先级（建议顺序）

1. 打通 threads/messages 在 UI 层的真实读取与切换。
2. 聊天调用切到配置中的默认模型。
3. 完成 MCP 服务器管理页与 `mcp_servers` 数据闭环。
4. 建立最小自动化验证链路。
