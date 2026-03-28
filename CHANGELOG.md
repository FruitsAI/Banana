# Changelog

All notable changes to this project will be documented in this file. 本项目所有值得记录的变更都会记录在这个文件中。

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/). 本文件遵循 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) 的格式规范，项目版本遵循 [Semantic Versioning](https://semver.org/)。

Repository rule: every commit must update `CHANGELOG.md` with concise bilingual entries. 仓库规则：每次提交都必须同步更新 `CHANGELOG.md`，并使用简洁的中英文双语条目记录变更。

## [Unreleased]

### Added

- Add reusable platform detection helpers, pre-hydration runtime marking, and targeted desktop QA tests for titlebar and thread-sidebar behavior. 新增可复用的平台检测工具、预水合运行时标记，以及覆盖标题栏与线程侧边栏行为的桌面 QA 定向测试。
- Add a shared liquid-glass runtime model, provider, and regression coverage so ambient light, adaptive clarity, and pointer optics can be driven as one system instead of isolated component styling. 新增共享的液态玻璃运行时模型、provider 与回归测试，使环境光、自适应清晰度和指针光学反馈可以作为统一系统驱动，而不再只是零散组件样式。
- Add a `pnpm release:prepare` entrypoint that validates the changelog, defaults release-facing bumps to `patch`, and preflights the next tag before tagging. 新增 `pnpm release:prepare` 入口，在发版前先校验 changelog、默认执行 `patch` 升级，并在打 tag 前预检下一个版本标签是否可用。

### Changed

- Collapse the app shell into a bolder single-sidebar workspace by removing the top status bar and far-left rail, then docking the global conversation/settings/theme controls at the bottom of the main sidebars. 将应用壳层收敛为更大胆的单侧边栏工作区：移除顶部状态栏与最左侧 rail，并把会话 / 设置 / 主题三组全局控制收纳到主侧边栏底部的 dock 中。
- Remove the retired titlebar and rail modules, their dedicated CSS blocks, and obsolete test coverage so the codebase only keeps the new single-sidebar shell path. 删除已经退役的 titlebar / rail 模块、对应 CSS 区块与过时测试覆盖，让代码库只保留新的单侧边栏壳层路径。
- Reshape the settings workspace so its left sidebar reuses the same shell width and dock contract as the home conversation sidebar, while the right settings stage stands on its own instead of nesting both sides inside an extra panel. 重组设置工作区：让左侧栏复用首页会话侧栏同一套 shell 宽度与 dock 契约，同时让右侧设置舞台独立承载内容，不再把左右两栏一起包进额外的大面板。
- Align the settings sidebar padding rhythm with the home sidebar so the bottom dock now matches the home screen's width, inset, and visual weight exactly. 让设置侧栏的内边距节奏与首页侧栏对齐，使底部 dock 的宽度、留白和视觉重量与首页完全一致。
- Remove the extra current-section glass card above the settings dock so the dock sits directly on the shared sidebar rhythm without a secondary background layer. 移除设置页 dock 上方那张额外的当前分组玻璃卡，让 dock 直接落在共享侧栏节奏上，不再叠一层次级背景。
- Strip the remaining static subtitle and helper-copy paragraphs from the settings workspace, leaving a cleaner title-first layout across sidebar, models, MCP, theme, and about sections. 去掉设置工作区剩余的静态副标题与说明文案段落，让侧栏、模型、MCP、主题和关于分区统一回到更克制的标题优先布局。
- Flatten the settings workspace one step further by removing the sidebar's extra “导航” substrate card and letting the right content stage sit directly on the shared workspace instead of inside an additional base panel. 进一步压平设置工作区：移除左侧栏多余的“导航”底层卡片，并让右侧内容舞台直接落在共享工作区中，不再套一层额外基底面板。
- Unify all four settings scenes around a shared right-side frame width and let the base liquid card stretch to the stage height, so short pages like theme and about no longer look narrower or float with exposed empty workspace underneath. 统一四个设置场景的右侧共享 frame 宽度，并让底层液态卡片自动拉伸到舞台高度，避免主题、关于这类短内容页面显得更窄、下方露出空白工作区。
- Make the settings stage truly fluid at larger desktop sizes, reduce wasted side gutters, stack model connection cards vertically, and normalize selected model rows so long names truncate cleanly without the extra “默认模型” text badge. 让设置页在更大的桌面窗口里真正随舞台流体放大，减少左右空白，将模型连接卡片改为纵向堆叠，并统一选中模型行的宽度与截断行为，去掉多余的“默认模型”文字徽标。
- Refine the liquid-glass desktop titlebar with real Tauri window controls, hover glyph micro-interactions, and platform-aware chrome handling for macOS and Windows. 打磨液态玻璃桌面标题栏：接入真实 Tauri 窗口控制、补充 hover 字形微交互，并为 macOS 与 Windows 做平台感知的窗口 chrome 处理。
- Refactor custom feedback and overlay primitives so toast banners move to the top center and dialogs/popovers share the same liquid-glass material rhythm. 重构自定义反馈与浮层 primitive：将 toast 改为顶部居中的横幅通知，并让 dialog / popover 共享一致的液态玻璃材质与节奏。
- Sweep the remaining custom components into the same liquid-glass system, unifying model, MCP, settings, selector, and message surfaces around shared material tokens and calmer Apple-like interaction details. 将剩余自定义组件统一收口到同一套液态玻璃系统中，让模型、MCP、设置、选择器与消息表面共享材质 token 与更克制的苹果式交互细节。
- Replace the last native provider-type dropdown with a reusable liquid-glass Select component so floating lists, selected states, and trigger chrome match the rest of the desktop UI. 用可复用的液态玻璃 Select 组件替换最后一个原生 provider 类型下拉，让浮层列表、选中态与触发器边框统一到桌面界面的同一套语言。
- Upgrade the shared glass surfaces with runtime-aware layered fills, ambient background response, and press ripple hooks so dialogs, popovers, buttons, fields, selects, and top banners feel closer to Apple-style liquid material behavior. 将共享玻璃表面升级为可感知运行时的 layered fill、环境光响应与按压涟漪钩子，让 dialogs、popovers、按钮、输入框、下拉选择器与顶部通知更接近苹果式液态材质的行为表现。
- Strip the bottom sidebar dock down to its three core controls and promote the model-settings accent selection treatment into a shared liquid-selection primitive used by dock buttons, sidebar navigation, thread rows, provider lists, select menus, and model defaults. 将底部侧栏 dock 收敛为仅保留三个核心按钮，并把“模型设置”那套高亮选中语言上提为共享的 liquid-selection primitive，统一复用到 dock 按钮、侧栏导航、会话行、Provider 列表、下拉菜单与默认模型选择中。
- Normalize idle-vs-active list elevation across shared tabs, sidebars, thread rows, provider/model lists, and select menus so only selected items keep a resting floating shadow while idle rows stay flatter until hover or keyboard focus. 统一共享 tab、侧边栏导航、会话行、Provider / 模型列表与下拉菜单的静止态与激活态抬升逻辑：只有选中项保留常驻浮层阴影，未选中项默认更平，直到 hover 或键盘聚焦时才临时抬起。
- Restore subtle glass borders on idle provider/model rows and extend the same hover-lift selection language into the model-market dialog so list surfaces stay consistent across settings and overlays. 为未选中的平台 / 模型行恢复细腻的玻璃边框，并把同一套 hover 抬升选中语言扩展到模型市场弹窗，让设置页与浮层列表表面保持一致。
- Rebuild the custom control system around shared `FieldShell` and `TextareaField` primitives, then migrate input, search, textarea, select, switch, button, composer, message editing, and toast banner surfaces onto one unified liquid-glass interaction model. 围绕共享的 `FieldShell` 与 `TextareaField` primitive 重建自定义控件系统，并将 input、search、textarea、select、switch、button、聊天输入器、消息编辑态与 toast 横幅统一迁移到同一套液态玻璃交互模型上。

### Fixed

- Make thread rows keyboard-focusable and desktop-native, clamp the context menu to the viewport, support Escape dismissal, and restore focus after closing the menu. 将线程列表项改为可键盘聚焦的桌面化交互，限制右键菜单在视口内显示，支持 Escape 关闭，并在菜单收起后恢复焦点。
- Prevent the liquid-glass runtime from mutating server-rendered surfaces before hydration finishes, fixing the sidebar/search hydration mismatch on first paint. 避免液态玻璃运行时在 hydration 完成前提前改写服务端渲染的表面节点，修复侧边栏与搜索区域首帧的 hydration mismatch。
- Restore the deeper blue liquid accent layer for active selections and bring provider rows plus default-model rows back into the same selection treatment as the settings navigation. 恢复激活选中态更深一层的蓝色液态染色，并让 Provider 列表与默认模型行重新对齐到与设置导航一致的选中视觉语言。
- Add back a dedicated top drag strip for the frameless desktop window and remove the leftover “当前” status badges from the settings sidebar and MCP stage navigation. 为无标题栏桌面窗口补回专用顶部拖拽条，并移除设置侧栏与 MCP 分组导航里残留的“当前”状态徽标。
- Add a macOS-specific traffic-light safe area to the shared workspace sidebar shell so the left sidebar content sits slightly lower and no longer crowds the window controls. 为共享工作区侧栏壳层增加 macOS 专属的交通灯安全留白，让左侧边栏内容整体下移一点，不再挤占窗口控制按钮区域。
- Align the home sidebar header card to the same horizontal width rhythm as the thread list and remove the old blue left-edge marker from selected thread rows. 让首页左侧顶部“会话流”卡片与下方会话列表回到同一套横向宽度节奏，并移除会话选中态左侧旧的蓝色边缘指示条。
### Fixed

- Pin the GitHub Release workflow to `tauri-apps/tauri-action@action-v0.6.2` because the upstream `v1` ref is no longer resolvable. 将 GitHub Release 工作流固定到 `tauri-apps/tauri-action@action-v0.6.2`，因为上游 `v1` 引用已无法解析。
- Switch the Intel macOS release runner from `macos-13` to `macos-15-intel` because GitHub no longer supports the old hosted runner label for this repository. 将 Intel macOS 发版 runner 从 `macos-13` 切换到 `macos-15-intel`，因为 GitHub 已不再为当前仓库支持旧的托管 runner 标签。
- Upgrade GitHub Actions JavaScript runtimes by moving `actions/setup-node` to `v6` and `pnpm/action-setup` to `v5`, both of which run on Node 24. 通过将 `actions/setup-node` 升级到 `v6`、`pnpm/action-setup` 升级到 `v5`，把 GitHub Actions 的 JavaScript 运行时统一提升到 Node 24。

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
