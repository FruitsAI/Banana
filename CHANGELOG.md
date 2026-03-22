# Changelog

All notable changes to this project will be documented in this file. 本项目所有值得记录的变更都会记录在这个文件中。

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/). 本文件遵循 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) 的格式规范，项目版本遵循 [Semantic Versioning](https://semver.org/)。

Repository rule: every commit must update `CHANGELOG.md` with concise bilingual entries. 仓库规则：每次提交都必须同步更新 `CHANGELOG.md`，并使用简洁的中英文双语条目记录变更。

## [Unreleased]

### Added

- Add reusable platform detection helpers, pre-hydration runtime marking, and targeted desktop QA tests for titlebar and thread-sidebar behavior. 新增可复用的平台检测工具、预水合运行时标记，以及覆盖标题栏与线程侧边栏行为的桌面 QA 定向测试。

### Changed

- Refine the liquid-glass desktop titlebar with real Tauri window controls, hover glyph micro-interactions, and platform-aware chrome handling for macOS and Windows. 打磨液态玻璃桌面标题栏：接入真实 Tauri 窗口控制、补充 hover 字形微交互，并为 macOS 与 Windows 做平台感知的窗口 chrome 处理。

### Fixed

- Make thread rows keyboard-focusable and desktop-native, clamp the context menu to the viewport, support Escape dismissal, and restore focus after closing the menu. 将线程列表项改为可键盘聚焦的桌面化交互，限制右键菜单在视口内显示，支持 Escape 关闭，并在菜单收起后恢复焦点。

## [0.1.0] - 2026-03-21

### Added

- Rename desktop application metadata and package naming from `app` to `Banana` across Tauri and Rust configuration. 将桌面应用元数据与包名从 `app` 统一改为 `Banana`，覆盖 Tauri 与 Rust 配置。
- Add GitHub CI and release workflows for unsigned desktop bundles and draft GitHub Releases. 新增 GitHub CI 与发版工作流，用于构建 unsigned 桌面产物并生成 draft GitHub Release。
- Add version management and release tag scripts to keep `package.json`, Tauri metadata, and Cargo metadata aligned. 新增版本管理与发版标签脚本，用于保持 `package.json`、Tauri 元数据与 Cargo 元数据一致。
- Add a reusable `release-commit` skill and repository release checklist for bilingual changelog maintenance. 新增可复用的 `release-commit` skill 与仓库级发版清单，用于维护双语 changelog。
- Add provider services, route tests, and modular settings panels for provider and model management flows. 新增 provider 服务层、路由测试以及模块化的设置面板，用于完善 provider 与模型管理流程。
- Add chat title generation, stage subcomponents, and regression coverage for runtime and transport behavior. 新增聊天标题生成、stage 子组件，以及运行时与传输链路的回归测试覆盖。

### Changed

- Standardize `package.json` as the single editable version source for release preparation. 统一以 `package.json` 作为发版准备阶段唯一可编辑的版本源。
- Document the current release strategy as GitHub-hosted internal distribution without signing or notarization. 明确当前发版策略为 GitHub 托管的内部或测试分发，不包含签名与 notarization。
- Require `CHANGELOG.md` updates in local repository checks and CI validation, instead of relying on contributor memory alone. 将 `CHANGELOG.md` 更新要求纳入本地仓库检查与 CI 校验，不再只依赖提交者手动记忆。
- Clarify release-note expectations, version alignment rules, and GitHub-only unsigned distribution limits in repository documentation. 在仓库文档中明确发版说明写法、版本对齐规则，以及仅限 GitHub unsigned 分发的边界。
- Move the `release-commit` skill into the repository-local `.codex/skills/` directory instead of `.iflow` or the global skill store. 将 `release-commit` skill 移入仓库本地的 `.codex/skills/` 目录，不再放在 `.iflow` 或全局 skill 目录中。
- Refactor the chat runtime, session store, model settings, and Rust service wiring to complete the capability-aware local-first migration. 重构聊天运行时、会话状态、模型设置与 Rust 服务接线，以完成面向能力控制的本地优先迁移收口。
- Ignore temporary Rust SQLite test databases generated during local verification. 忽略本地验证过程中生成的 Rust SQLite 临时测试数据库。

### Fixed

- Sync the About page version badge with the project version source, make external links actionable, and update the copyright year dynamically. 将关于页版本徽标同步到项目统一版本源，使外链真正可点击，并将版权年份改为动态显示。
- Align MCP `clientInfo.version` with the packaged application version instead of a stale hardcoded value. 将 MCP `clientInfo.version` 改为跟随打包应用版本，不再使用过期的硬编码值。

[Unreleased]: https://github.com/FruitsAI/Banana/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/FruitsAI/Banana/releases/tag/v0.1.0
