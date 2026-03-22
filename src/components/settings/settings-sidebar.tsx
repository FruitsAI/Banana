"use client";

import { CloudIcon, McpServerIcon, BadgeInfoIcon, PaintBoardIcon } from "@hugeicons/core-free-icons";
import { NavItem } from "@/components/ui/nav-item";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
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
      description: "管理模型平台、默认选择和连接凭据",
      accent: "Models",
    },
    {
      id: "mcp" as SettingsTab,
      icon: McpServerIcon,
      label: "MCP 设置",
      description: "整理工具服务器、模板和运行方式",
      accent: "MCP",
    },
    {
      id: "theme" as SettingsTab,
      icon: PaintBoardIcon,
      label: "外观设置",
      description: "调整主题、动效和显示强度",
      accent: "Appearance",
    },
    {
      id: "about" as SettingsTab,
      icon: BadgeInfoIcon,
      label: "关于我们",
      description: "查看版本、技术栈和项目入口",
      accent: "About",
    },
  ];
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div
      className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full px-3 py-4 sm:px-4 sm:py-5"
      data-testid="settings-sidebar-shell"
      data-material-role="chrome"
      style={{
        background: "transparent",
      }}
    >
      <div className="px-2 pt-1 pb-5">
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
        <p className="text-xs leading-6 mt-1.5 max-w-[15rem]" style={{ color: "var(--text-secondary)" }}>
          管理模型、工具与外观偏好，让 Banana 更贴合你的桌面工作流。
        </p>
      </div>

      <div
        className="rounded-[28px] border p-2"
        data-testid="settings-sidebar-nav-group"
        data-material-role="content"
        style={{ ...getMaterialSurfaceStyle("content", "sm") }}
      >
        <div
          className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          导航
        </div>
        <div className="space-y-1" role="tablist" aria-label="设置分组">
          {tabs.map((tab) => (
            <NavItem
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              description={tab.description}
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
              accessory={
                activeTab === tab.id ? (
                  <span
                    className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]"
                    style={{
                      background: "var(--brand-primary-lightest)",
                      borderColor: "var(--brand-primary-border)",
                      color: "var(--brand-primary)",
                    }}
                  >
                    当前
                  </span>
                ) : null
              }
            />
          ))}
        </div>
      </div>

      <div
        className="mt-4 rounded-[26px] border px-4 py-4"
        data-testid="settings-sidebar-current-card"
        data-material-role="content"
        style={{ ...getMaterialSurfaceStyle("content", "sm") }}
      >
        <div
          className="text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          当前分组
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {activeTabMeta.label}
            </div>
            <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
              {activeTabMeta.description}
            </p>
          </div>
          <span
            className="rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em]"
            style={{
              background: "var(--glass-subtle)",
              borderColor: "var(--glass-border)",
              color: "var(--text-tertiary)",
            }}
          >
            {activeTabMeta.accent}
          </span>
        </div>
        <div className="mt-3 border-t pt-3 text-[11px] leading-5" style={{ borderColor: "var(--divider)", color: "var(--text-tertiary)" }}>
          右侧内容会延续相同的分组节奏与材质层级，减少设置切换时的跳变感。
        </div>
      </div>
    </div>
  );
}
