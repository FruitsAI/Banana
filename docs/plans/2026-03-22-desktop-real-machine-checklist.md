# 2026-03-22 Desktop Real-Machine Checklist

## Scope

本轮只检查桌面实机容易暴露的问题，不重复做已有的页面级视觉验收。

重点区域：

- 标题栏与窗口控制
- 会话侧边栏与右键菜单
- `/` 到 `/settings` 的切换感受
- macOS / Windows 平台差异

## Smoke Pass

1. 启动桌面调试包或 debug app。
2. 首屏确认没有双标题栏、顶部高度跳变或内容闪动。
3. 在浅色与深色模式各走一遍首页和设置页。

## Titlebar

1. 在 macOS 上确认标题栏视觉与系统 overlay 不冲突。
2. 在 Windows 上确认自定义标题栏不显示，内容区不会保留 44px 顶部空白。
3. 点击关闭、最小化、缩放按钮，确认都触发真实窗口行为。
4. 在标题栏空白区域拖拽窗口，确认 drag region 正常。
5. 在交通灯区域与品牌胶囊区域反复点击，确认没有误拖拽。

## Threads Sidebar

1. 用鼠标点击不同会话，确认选中条与内容切换稳定。
2. 用 `Tab` 聚焦会话项，确认有清晰 focus ring。
3. 用键盘聚焦后按 `Enter` / `Space`，确认可进入对应会话。
4. 在窗口四角附近打开右键菜单，确认菜单不会出界。
5. 右键菜单打开后按 `Escape`，确认菜单关闭且焦点回到原会话项。
6. 删除当前会话后，确认路由返回 `/` 且侧边栏状态刷新正常。

## Settings Transition

1. 从首页进入设置，再返回首页，确认层级与节奏连续。
2. 在设置页切换 `Models / MCP / Theme / About`，确认 atmosphere 与 panel 没有脱节感。
3. 在 reduced motion 或低动效设置下，确认切换依然稳定，没有残影与突兀位移。

## Platform Notes

### macOS

- 留意标题栏材质是否过厚，避免压住系统 chrome。
- 检查交通灯 hover glyph 是否只作为细节，不抢系统控件视觉。

### Windows

- 重点看首帧是否出现自定义标题栏闪现。
- 检查窗口最大化、还原、拖动到屏幕边缘后的布局是否稳定。

## Non-Blockers

以下情况不作为本轮桌面 polish 阻塞项：

- 静态预览里因缺少 Tauri bridge 产生的 `invoke` / store 初始化报错
- Next.js 多 lockfile root 推断警告
