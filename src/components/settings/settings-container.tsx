"use client";

import { useState } from "react";
import { SettingsSidebar } from "./settings-sidebar";
import { SettingsContent } from "./settings-content";

export type SettingsTab = "models" | "mcp" | "theme" | "about";

/**
 * SettingsContainer 组件 (全局设置容器)
 * @description 
 *   管理全局设置板块内的选项卡 (Tab) 切换流转状态。
 *   作为顶层包裹组件，它组合了 `SettingsSidebar` (左侧导航侧边栏) 
 *   与 `SettingsContent` (右侧对应详细设置表单)，构成了完整的设置视窗。
 * @example
 * <SettingsContainer />
 */
export default function SettingsContainer() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("models");

  return (
    <div className="flex h-full w-full relative">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
        <SettingsContent activeTab={activeTab} />
      </div>
    </div>
  );
}
