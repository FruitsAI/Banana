"use client";

import { useState } from "react";
import { SettingsSidebar } from "./settings-sidebar";
import { SettingsContent } from "./settings-content";

export type SettingsTab = "models" | "mcp" | "about";

/**
 * 全局设置容器 (SettingsContainer)
 * @description 管理全局设置板块内的选项卡切换流转状态，它是 `SettingsSidebar` (左侧应用导航) 与 `SettingsContent` (右侧对应详细设置表单) 的顶层包裹组件。
 */
export default function SettingsContainer() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("models");

  return (
    <div className="flex h-full w-full max-w-6xl mx-auto p-4 gap-6 relative">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
        <SettingsContent activeTab={activeTab} />
      </div>
    </div>
  );
}
