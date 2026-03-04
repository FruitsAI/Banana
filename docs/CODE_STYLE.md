# FruitsAI Banana - 综合代码规范指南 (Code Style Guide)

为了保证项目的长期可维护性、代码质量以及团队协作效率，我们参考了业界一线大厂（如 Google、字节跳动、Vercel 等）的最佳实践，并结合本项目（Tauri + Next.js + Rust）的实际情况，制定了以下代码规范。

---

## Ⅰ. 基本原则 (Core Principles)

1. **统一语言**：所有代码注释、文档、Git 提交描述默认使用**简体中文**（专有名词、API 属名除外）。
2. **职责单一 (Single Responsibility)**：不管是函数、组件还是模块，都应该尽可能只做一件事。
3. **DRY 且克制**：Don't Repeat Yourself。但如果是为了过早的抽象，允许适度重复代码（KISS 原则）。
4. **格式化即正义**：完全信任并依赖自动化格式化工具（Prettier, ESLint, `cargo fmt`, `cargo clippy`），不要在 Code Review 中争论代码格式。

---

## Ⅱ. 前端规范 (Frontend - Next.js / React / TypeScript)

我们的前端采用了 Next.js (App Router)、React 18+ 以及 Tailwind CSS。

### 1. 文件与目录命名规范

- **组件文件**：必须使用**短横线命名法 (kebab-case)**。例如 `settings-sidebar.tsx`，**严禁**使用 `SettingsSidebar.tsx`。
- **页面/路由文件**：遵循 Next.js App Router 约定，如 `page.tsx`, `layout.tsx`, `loading.tsx`。
- **工具类与 Hook 文件**：一律使用小驼峰 (camelCase) 命名。例如 `useBananaChat.ts`, `formatUtils.ts`。

### 2. 组件开发规范

- **目录解耦**：业务层组件请一律移至 `src/components/`，**绝对不要**将业务组件放置在 `src/app/` 的路由页面目录下。
- **导出方式**：优先使用 `export function ComponentName() {}` 而非箭头函数加匿名导出的形式，以便在 DevTools 中保持更清晰的组件树名称。
- **Props 定义**：Props 必须显式定义 Interface，且命名为 `[组件名]Props`。例如：
  ```tsx
  interface UserAvatarProps {
    src: string;
    alt?: string;
  }
  export function UserAvatar({ src, alt }: UserAvatarProps) { ... }
  ```

### 3. JSDoc 注释规范

所有导出的公共函数、核心状态组件以及底层接口必须配备**标准的中文 JSDoc 注释**。

```tsx
/**
 * 设置主导航侧栏 (SettingsSidebar)
 * @description 列印配置系统的左侧静态选项卡目录，支持选项的激活变色以及点击事件的向上传递。
 * @param {SettingsSidebarProps} props - 包含激活的标签页和切换函数
 */
export function SettingsSidebar(props: SettingsSidebarProps) { ... }
```

### 4. 样式 (CSS / Tailwind) 规范

- **优先使用 Tailwind**：尽量使用 Tailwind utility class 进行排版，避免零碎的外部 CSS。
- **复用聚合**：如果一段 className 重复度极高，可以提取至 `@layer components`（如 globals.css 中的 `rail-btn`）或使用 `cva` (class-variance-authority) 进行组件化封装。
- **避免内联样式**：除依赖 JS 动态计算的 `style={{ ... }}` 变量外，禁止硬编码写固定属性的 `style`。

---

## Ⅲ. 后端规范 (Backend - Rust / Tauri)

### 1. 命名规范

完全遵循 Rust 官方标准：

- **Types / Structs / Traits / Enums**：使用大驼峰命名 `PascalCase`（如 `McpServerConfig`）。
- **函数的变量、模块 (Modules)**：使用蛇形命名 `snake_case`（如 `get_database_connection`）。
- **常量 / 静态变量**：使用全大写加下划线 `SCREAMING_SNAKE_CASE`（如 `MAX_RETRY_COUNT`）。

### 2. 代码质量检查

- 提交代码前，**必须执行**且消除警告：
  ```bash
  cargo fmt      # 格式化
  cargo clippy   # 静态检查，捕获不良实践
  ```

### 3. 错误处理规范

禁止滥用 `unwrap()` 或 `expect()`。

- 业务层请统一将错误转化并向上返回 `Result<T, E>`。
- 可以使用 `anyhow` 控制应用程序的顶级 Error 传递，或使用 `thiserror` 为专属模块定义高度语义化的库级 Error 枚举。
- Tauri Command 需要将 Error 转录为 `String` 送给前端时，可以利用 `Result<T, String>`:
  ```rust
  #[tauri::command]
  pub fn get_user_info() -> Result<UserInfo, String> {
      db::fetch_user().map_err(|e| e.to_string())
  }
  ```

---

## Ⅳ. Git 及协作工作流规范

遵循约定式提交 (Conventional Commits) 规范，清晰追踪代码演进历史。

### 1. 分支命名

- 功能特性：`feat/login-module`
- 问题修复：`bugfix/rail-overflow`
- 重构优化：`refactor/mcp-settings`
- 文档更新：`docs/api-readme`

### 2. 提交信息 (Commit Message) 格式

```text
<type>(<scope>): <subject>

<body> (可选)
```

**Type 示例：**

- `feat`: 增加新功能
- `fix`: 修复 bug
- `docs`: 文档修改
- `style`: 代码格式修改（不影响运行逻辑）
- `refactor`: 重构（非新增功能也非修复 bug 的代码变动）
- `perf`: 性能优化
- `test`: 增加/修改测试用例
- `chore`: 构建过程或辅助工具变动

**有效示例：**
`feat(settings): 新增 MCP 服务的双栏配置界面`
`fix(stage): 修复消息气泡渲染时的抖动问题`
`docs: 增加全局代码规范文档`
