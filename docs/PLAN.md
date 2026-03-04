# FruitsAI Banana MVP 开发计划

为了快速验证核心体验与功能，我们将整个开发过程划分为若干阶段。MVP (Minimum Viable Product) 版本的目标是跑通最基础的核心闭环。

## 阶段 1：基础集成与视觉骨架 (MVP 核心)

**目标：** 构建 macOS 26 液态玻璃风格基础界面框架，并集成核心基础库。

1. **环境与组件库搭建**
   - [x] 初始化 Radix UI / shadcn/ui。
   - [x] 提取 `design/tokens.css` 的视觉变量至 Tailwind 配置中，搭建基础颜色与 Glassmorphism (毛玻璃) 语义支持。
   - [x] 集成 Remixicon 图标库与 Framer Motion 动画引擎。
2. **应用骨架开发**
   - [x] 实现顶栏 (Titlebar) / macOS 交通灯适配区域。
   - [x] 实现侧边栏 (Rail) 基础导航与会话列表 (Threads) 面板结构。
   - [x] 实现主界面 (Stage) 区与输入框 (Composer) 的静态布局。
3. **本地数据库集成 (SQLite3)**
   - [x] 在 Tauri Rust 侧集成 SQLite，设计基础 Schema (配置表、会话表、消息表)。
   - [x] 实现前端与 Rust 层的轻量级 IPC (进程间通信) 桥接查询。

## 阶段 2：模型驱动与对话交互 (MVP 核心)

**目标：** 实现 Vercel AI SDK 的基础对话及流式输出。

1. **本地配置与状态管理**
   - [x] 开发配置页面：允许用户填入自定义的大模型 Provider (例如 OpenAI 兼容格式) 接口地址和 API Key。
   - [x] 将配置落盘至本地数据库。
2. **对话流式响应系统**
   - [x] 整合 Vercel AI SDK 构建标准的 Message 处理模型。
   - [x] 前端解析流式响应，并在对话区域显示 (兼顾 Markdown 渲染)。
   - [x] 使用 Framer Motion 添加消息泡泡弹出的微交互动画。

## 阶段 3：MCP (Model Context Protocol) 最小可用集成

**目标：** 实现基础的扩展工具调用机制。

1. **MCP 服务器管理UI**
   - [x] 允许在设置界面配置一条本地执行命令作为 MCP Server。
2. **AI 工具链 (Tool Calling) 适配**
   - [x] 结合 Vercel AI SDK 的 tool system，捕获 AI 发出的操作意图。
   - [x] Tauri Rust 层编写子进程管理，对接执行配置的 MCP Server。

---

> MVP 阶段重点跑通 **Phase 1** (视觉基础 + 骨架) 与 **Phase 2** (单主线的 OpenAI 兼容流式对话)。Phase 3 (MCP) 可在此基础上验证扩展能力。
