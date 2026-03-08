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
    // 强制声明网格的横跨范围 (gridColumn: '2 / -1')。
    // 因为在应用的整体 Grid 系统中，第 1 列被最左侧的 Rail（轨道栏）占据了；
    // 这里的设置是要让此页面完全占满从第 2 列开始到右侧末尾的空间，替代默认的双栏（侧边栏+主舞台）分布。
    <div className="flex h-full w-full overflow-hidden relative" style={{ gridColumn: '2 / -1' }}>
      {/* 内部加载完整的设置状态管理与交互控制模块 */}
      <SettingsContainer />
    </div>
  );
}
