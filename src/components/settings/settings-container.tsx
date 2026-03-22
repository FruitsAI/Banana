"use client";

import { useState } from "react";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
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
    <div className="flex h-full w-full min-h-0 relative p-3 sm:p-4 lg:p-5" data-testid="settings-scene" data-material-role="chrome">
      <div
        className="pointer-events-none absolute inset-x-6 top-4 h-24 rounded-[36px] blur-3xl"
        style={{
          background:
            "linear-gradient(90deg, rgba(59,130,246,0.12) 0%, rgba(255,255,255,0) 38%, rgba(255,204,0,0.1) 100%)",
          opacity: 0.7,
        }}
      />
      <div
        className="settings-shell relative flex h-full w-full min-h-0 rounded-[32px] border overflow-hidden"
        data-testid="settings-shell"
        data-material-role="chrome"
        data-settings-shell-tone="desktop-pane"
        style={{ ...getMaterialSurfaceStyle("chrome", "lg") }}
      >
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div
          className="flex-1 min-w-0 flex flex-col overflow-hidden relative"
          data-testid="settings-content-frame"
          data-material-role="content"
          data-settings-active-tab={activeTab}
          style={{ borderLeft: "1px solid var(--divider)" }}
        >
          <div
            className="pointer-events-none absolute inset-x-10 top-0 z-0 h-28 rounded-b-[36px] blur-3xl"
            data-testid="settings-content-atmosphere"
            data-settings-atmosphere={activeTab}
            style={{
              background: SETTINGS_TAB_ATMOSPHERE[activeTab],
              opacity: 0.9,
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--brand-primary) 22%, var(--divider)) 18%, color-mix(in srgb, var(--brand-primary) 26%, var(--divider)) 82%, transparent 100%)",
            }}
          />
          <SettingsContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
