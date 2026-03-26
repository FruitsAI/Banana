import SettingsContainer from "@/components/settings/settings-container";

/**
 * @function SettingsPage
 * @description 设置页面的路由入口组件 (`/settings`)。
 * 提供承载所有应用设置的核心容器页，并通过特定的网格定位占据正确的布局空间。
 * 
 * @returns {JSX.Element} 包含设置面板容器的视图区域
 */
export default function SettingsPage() {
  return (
    // 设置页现在直接占满整个工作区，再由内部的桌面双栏容器来组织导航与内容。
    <div className="flex h-full w-full overflow-hidden relative">
      {/* 内部加载完整的设置状态管理与交互控制模块 */}
      <SettingsContainer />
    </div>
  );
}
