"use client";

import { Cloud, Wrench, Info } from "lucide-react";
import type { SettingsTab } from "./settings-container";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

/**
 * 设置主导航侧栏 (SettingsSidebar)
 * @description 列印配置系统的左侧静态选项卡目录，支持选项的激活变色以及点击事件的向上传递 (`onTabChange`)。
 */
export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  const tabs = [
    { id: "models" as SettingsTab, icon: Cloud, label: "模型服务" },
    { id: "mcp" as SettingsTab, icon: Wrench, label: "MCP 服务器" },
    { id: "about" as SettingsTab, icon: Info, label: "关于我们" },
  ];

  return (
    <div className="w-56 shrink-0 flex flex-col gap-1">
      <h2 className="text-xl font-bold px-3 py-4 mb-2">设置</h2>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 ${
            activeTab === tab.id
              ? "bg-pink-500/15 text-pink-700 dark:bg-pink-500/25 dark:text-pink-300 font-semibold shadow-sm border border-pink-500/20"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium border border-transparent"
          }`}
        >
          <tab.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
