# Banana

Banana 是一个本地优先（local-first）的桌面 AI 助手，基于 `Next.js + Tauri + SQLite` 构建。

## 产品概述
- 本地持久化：会话、模型配置、MCP 服务器配置存储在本地 SQLite。
- 多模型接入：支持 Provider/Model 的配置、启停与默认选择。
- MCP 工具扩展：支持 MCP Server 配置管理、工具发现与调用。
- 分层架构：前端按 `domain/services/stores` 分层，后端按 `commands/services/db` 分层。

## 开发启动

### 前置依赖
- Node.js 22.12.0（见 `.node-version`）
- pnpm 10.30.3（推荐通过 Corepack）
- Rust 1.93.1（见 `rust-toolchain.toml`）
- Tauri 2 运行环境依赖

### 安装依赖
```bash
corepack enable
pnpm install --frozen-lockfile
```

### 启动前端开发
```bash
pnpm dev
```

### 启动桌面应用开发（Tauri）
```bash
pnpm tauri dev
```

### 构建桌面应用
```bash
pnpm desktop:build
```

### 仓库自检
```bash
pnpm changelog:check
pnpm version:check
pnpm lint
pnpm test
pnpm build
pnpm check:rust
```

### 统一管理版本号
```bash
pnpm release:prepare
pnpm release:prepare minor
pnpm release:prepare major
pnpm release:prepare 0.2.0
pnpm release:tag:print
pnpm release:tag
```

- 每次提交前都要同步更新 [`CHANGELOG.md`](CHANGELOG.md)，并保持每条记录中英双语。
- `package.json` 是唯一可编辑版本源。
- `src-tauri/tauri.conf.json` 已直接跟随 `package.json`。
- `src-tauri/Cargo.toml` 与 `src-tauri/Cargo.lock` 通过版本脚本自动同步。
- `pnpm changelog:check` 会检查当前变更是否已同步更新 `CHANGELOG.md`。
- `pnpm release:prepare` 会先校验 changelog，再默认执行 `patch` bump，最后确认下一条 release tag 可用。
- 如果不是 patch release，可以改用 `pnpm release:prepare minor`、`pnpm release:prepare major` 或 `pnpm release:prepare 0.2.0`。
- 提交前跑一次 `pnpm version:check`，发布时让 Git tag 与 `package.json.version` 保持一致。
- `pnpm release:tag` 会基于当前版本创建本地 annotated tag。
- `pnpm release:tag:push` 会创建并推送 tag 到 `origin`，从而触发 GitHub Release workflow。
- macOS 稳定版应用内更新依赖 `BANANA_UPDATER_PUBLIC_KEY`、`TAURI_SIGNING_PRIVATE_KEY` 与 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 这组 GitHub Actions secrets；本地开发环境没有这些值时，关于页会明确提示更新通道未配置。

### CHANGELOG 规范
- 使用 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) 结构，保留 `Unreleased`。
- 段落标题保持英文兼容性：`Added`、`Changed`、`Deprecated`、`Removed`、`Fixed`、`Security`。
- 每条记录写成一句英文加一句中文，尽量描述用户影响或工程影响，不直接粘贴 git commit 列表。
- 发版时把 `Unreleased` 中已确认的内容移动到 `## [x.y.z] - YYYY-MM-DD`，并保持版本号、tag、release note 一致。
- 项目级发版提交流程 skill 位于 [`.codex/skills/release-commit/SKILL.md`](.codex/skills/release-commit/SKILL.md)，不依赖全局 skill 目录。

## GitHub 流程
- `CI`：对 `push` / `pull_request` 自动执行 `lint`、`vitest`、`next build`、`cargo check`、`cargo clippy`。
- `Release`：支持手动触发和 `v*` tag，发布 GitHub stable Release；macOS 产物会额外生成 updater 元数据与签名，供应用内检查更新使用。
- 发布与协作说明见：
  - [`CHANGELOG.md`](CHANGELOG.md)
  - [`CONTRIBUTING.md`](CONTRIBUTING.md)
  - [`RELEASE.md`](RELEASE.md)
  - [`LICENSE`](LICENSE)

## 分发说明
- 当前仓库默认产出 GitHub 分发构建物，macOS stable Release 支持应用内检查、下载与安装准备，完成后通过重启生效。
- macOS 未做 notarization，Windows 未做 code signing。
- 应用内更新只识别 GitHub 上“已发布”的稳定版 Release，不读取 draft，也不读取 prerelease。
- Windows / Linux 当前仍适合 GitHub 内部分发、测试或手动下载，尚未启用应用内安装。

## 关键目录结构
```text
src/
  app/                     # Next.js 路由与页面
  components/              # UI 组件与设置页
  domain/                  # 纯领域类型（chat/models/mcp/config）
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
- `domain/*/types.ts`：定义 Chat/Models/MCP/Config 领域类型。
- `services/*`：封装数据库调用和错误归一（`AppError + normalizeError`）。
- `stores/*`：组合服务能力并向组件暴露稳定接口。
- `components/hooks`：核心业务与全局配置均通过 store/service 访问，不直接直连 `lib/db`。

### 后端边界
- `commands.rs`：仅做参数接收与转发。
- `src-tauri/src/services/*.rs`：承载 Chat/Models/MCP 业务逻辑。
- `db/`：集中数据读写。
- MCP 相关命令通过 `services/mcp.rs` 管理进程生命周期与工具调用。

### 端到端调用链
`UI -> store -> service -> lib/* (db/mcp) -> tauri command -> rust service -> db/sqlite`

## 迁移现状（截至 2026-03-18）
- Chat 域：已迁移到 `domain/services/stores` 与后端 `services/chat.rs`。
- Models/Providers 域：已迁移到 `domain/services/stores` 与后端 `services/models.rs`。
- MCP 域：已迁移到 `domain/services/stores` 与后端 `services/mcp.rs`，命令层已路由至服务层。
- Config 域：全局配置（如动画强度）已迁移到 `domain/services/stores`。
- 错误处理：前端 service 统一使用 `src/shared/errors.ts` 做归一。

## 相关文档
- [产品需求文档](docs/PRD.md)
- [开发计划](docs/PLAN.md)
- [全栈架构重构实施计划](docs/plans/2026-03-17-fullstack-architecture-refactor.md)
