"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CloudIcon, McpServerIcon, BadgeInfoIcon, PaintBoardIcon } from "@hugeicons/core-free-icons";
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
    { id: "models" as SettingsTab, icon: CloudIcon, label: "模型设置" },
    { id: "mcp" as SettingsTab, icon: McpServerIcon, label: "MCP 设置" },
    { id: "theme" as SettingsTab, icon: PaintBoardIcon, label: "外观设置" },
    { id: "about" as SettingsTab, icon: BadgeInfoIcon, label: "关于我们" },
  ];

  return (
    <div
      className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full border-r"
      style={{
        background: 'var(--bg-sidebar)',
        borderColor: 'var(--divider)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1
          className="text-base font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          设置
        </h1>
      </div>

      {/* Navigation */}
      <div className="px-3 py-2 space-y-0.5">
        {tabs.map((tab) => (
          <NavItem
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            layoutId="settingsNav"
          />
        ))}
      </div>
    </div>
  );
}
