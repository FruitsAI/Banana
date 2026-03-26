"use client";

import { useState } from "react";
import { SettingsSidebar } from "./settings-sidebar";
import { SettingsContent } from "./settings-content";

export type SettingsTab = "models" | "mcp" | "theme" | "about";

const SETTINGS_TAB_ATMOSPHERE: Record<SettingsTab, string> = {
  models:
    "linear-gradient(120deg, rgba(59,130,246,0.18) 0%, rgba(255,255,255,0) 42%, rgba(255,204,0,0.1) 100%)",
  mcp: "linear-gradient(120deg, rgba(16,185,129,0.16) 0%, rgba(255,255,255,0) 45%, rgba(59,130,246,0.1) 100%)",
  theme:
    "linear-gradient(120deg, rgba(251,191,36,0.18) 0%, rgba(255,255,255,0) 42%, rgba(99,102,241,0.12) 100%)",
  about:
    "linear-gradient(120deg, rgba(148,163,184,0.16) 0%, rgba(255,255,255,0) 42%, rgba(96,165,250,0.1) 100%)",
};

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
    <div className="flex h-full w-full min-h-0 relative overflow-hidden" data-testid="settings-scene" data-material-role="chrome">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div
        className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden relative"
        data-testid="settings-content-frame"
        data-settings-active-tab={activeTab}
        data-settings-stage="inline"
      >
        <div
          className="pointer-events-none absolute inset-x-8 top-0 z-0 h-24 blur-3xl"
          data-testid="settings-content-atmosphere"
          data-settings-atmosphere={activeTab}
          style={{
            background: SETTINGS_TAB_ATMOSPHERE[activeTab],
            opacity: 0.72,
          }}
        />
        <div className="relative z-10 flex-1 min-h-0">
          <SettingsContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
