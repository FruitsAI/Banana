# 技术架构与设计文档 (TDD)

## 1. 技术栈选型

基于现有环境配置与需求，采用以下核心栈：

- **桌面层：** Tauri 2 (Rust) -> 轻量化，提供底层 OS 能力与文件访问集成。
- **前端框架：** Next.js 15+ (App Router, `output: "export"`) -> 进行跨平台 UI 渲染。
- **开发语言：** TypeScript -> 严谨的全栈类型提示。
- **大模型集成：** **Vercel AI SDK** -> 提供标准的流式返回解析与 AI 工具链调用支持。
- **UI 组件库与样式：**
  - **Radix UI + shadcn/ui** -> 以极高的灵活性、高度无障碍标准构建严谨组件。
  - **Tailwind CSS** + 原生 `tokens.css` -> 实现标志性的 macOS 26 液态玻璃动态视觉特征。
- **动画引擎：** **Framer Motion** -> 构建符合真实物理规律与流畅过场的液态交互微动效。
- **数据库：** **SQLite3** -> 高效、健壮的本地关系型数据库，用于处理聊天记录和大容量记忆。
- **图标系统：** **Remixicon** -> 简约、整洁的线条图标，统一跨平台体验。
- **工程化基建：**
  - **测试方案：** **Playwright** -> 负责端到端 (E2E) 测试，保障各个平台渲染界面与交互逻辑的正确率。
  - **持续集成与部署 (CI/CD)：** **GitHub Actions** -> 负责自动化构建、代码检测以及全平台打包发布流程。

## 2. 目录骨架与分层

### 前端分层 (Next.js Layer)

由于采用了单页或静态导出体系，尽量减少路由刷新：

- `app/page.tsx`: 全局入口，容纳主应用的 `Layout` 与毛玻璃容器框架。
- `components/`
  - `layout/`: `Titlebar`, `Rail`, `ThreadsSidebar`, `Stage` 等。
  - `ui/`: `Button`, `Input`, `Dialog` 等具备液态玻璃封装的基础组件。
  - `chat/`: `MessageBubble`, `Composer`。
- `stores/`: 全局状态管理（如当前选中的 Provider、配置好的 MCP 服务器状态、历史对话持久化等）。

### 桌面层分层 (Tauri Rust Layer)

- `src-tauri/src/main.rs`: 注册各系统插件与自定义 Command。
- 采用库如 `@tauri-apps/plugin-store` 实现配置持久化，确保应用重启配置不丢。若需更强本地化，可引入基于 SQLite/RocksDB 的本地数据库。

## 3. 数据流与通信设计

### 3.1 跨平台配置文件 (Settings Store)

需存储结构：

```typescript
interface AppConfig {
  providers: {
    id: string; // openai, anthropic, ollama 等
    apiKey: string;
    baseUrl?: string;
    customModels?: string[];
  }[];
  activeProviderId: string;
  mcpServers: {
    id: string;
    name: string; // 例如: "Weather-MCP"
    command: string; // 例如 "npx"
    args: string[]; // ["-y", "@weather/mcp"]
    env: Record<string, string>;
    enabled: boolean;
  }[];
}
```

### 3.2 大模型集成与 MCP (Model Context Protocol)

- **对话流处理:** 前端直接使用标准化请求函数，通过 HTTP/SSE 建立流式解析链。
- **MCP 网关:** 模型吐出 Tool Call 时，解析协议；前端交由 Rust 侧的 Tauri Command 或 Node.js sidecar （如果适用，因为单纯前端无法轻易执行系统级别的 npx 进程，必须依托 Rust 衍生子进程）执行。
- _重点设计决策：_ **由于涉及到执行任意 MCP 命令行，必须将相关逻辑下沉到 Rust 端**，通过 `std::process::Command` 或者跨平台的 `tauri-plugin-shell`，维护常驻子进程（长链接 stdin/stdout 通信以符合 MCP 标准）。

## 4. 关键实现节点 (核心 UI Token)

应用 `preview.html` 提供的 macOS 液态玻璃视觉规则：

- 全局 CSS 映射到 Tailwind 主题或直接采用原生 CSS variables 驱动。
- 对 `Window` 设置 `backdrop-filter: blur(26px) saturate(1.2)` ，底层辅以 SVG noise 提升材质拟真度。
- 为防止 Next.js 切换页面破坏动效和背景光路，将聊天区到设置区等视为组件视图的条件渲染（而非完整页面路由切换）。

## 5. 扩展性预留

- 后续支持图片和文件读取（视网多模态）。
- 提供拖拽组件，便于未来实现多文档的 Reference 功能。
