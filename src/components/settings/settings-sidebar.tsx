"use client";

import { CloudIcon, McpServerIcon, BadgeInfoIcon, PaintBoardIcon } from "@hugeicons/core-free-icons";
import { SidebarUtilityDock } from "@/components/layout/sidebar-utility-dock";
import { WorkspaceSidebarShell } from "@/components/layout/workspace-sidebar-shell";
import { NavItem } from "@/components/ui/nav-item";
import type { SettingsTab } from "./settings-container";

interface SettingsSidebarProps {  
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

/**
 * SettingsSidebar 组件 (设置导航侧边栏)
 * @description 
 *   采用类似 macOS 系统偏好设置风格的左侧边栏，排版维持与首页的一致性。
 *   包含各种细分设置页面入口。通过 NavItem 组件实现平滑的焦点转移指示器动画。
 * @param {SettingsTab} activeTab - 当前激活的选项卡
 * @param {(tab: SettingsTab) => void} onTabChange - 切换选项卡的回调函数
 * @example
 * <SettingsSidebar activeTab="mcp" onTabChange={setActiveTab} />
 */
export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  const tabs = [
    {
      id: "models" as SettingsTab,
      icon: CloudIcon,
      label: "模型设置",
    },
    {
      id: "mcp" as SettingsTab,
      icon: McpServerIcon,
      label: "MCP 设置",
    },
    {
      id: "theme" as SettingsTab,
      icon: PaintBoardIcon,
      label: "外观设置",
    },
    {
      id: "about" as SettingsTab,
      icon: BadgeInfoIcon,
      label: "关于我们",
    },
  ];

  return (
    <WorkspaceSidebarShell
      testId="settings-sidebar-shell"
      style={{ boxShadow: "var(--liquid-material-rest-shadow)" }}
    >
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-3 sm:pb-4">
        <div
          className="text-[11px] font-medium uppercase tracking-[0.18em] mb-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Preferences
        </div>
        <h1
          className="text-base sm:text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          设置
        </h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-1.5 sm:px-2 py-2">
        <div className="space-y-1" role="tablist" aria-label="设置分组">
          {tabs.map((tab) => (
            <NavItem
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              layoutId="settingsNav"
              semanticProps={{
                "aria-selected": activeTab === tab.id,
                "aria-controls": `settings-panel-${tab.id}`,
                id: `settings-tab-${tab.id}`,
                role: "tab",
                type: "button",
              }}
            />
          ))}
        </div>
      </div>

      <SidebarUtilityDock activeView="settings" />
    </WorkspaceSidebarShell>
  );
}
