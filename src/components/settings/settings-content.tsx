"use client";

import type { SettingsTab } from "./settings-container";
import { ModelsSetting } from "./sections/models-setting";
import { McpSetting } from "./sections/mcp-setting";
import { AboutSetting } from "./sections/about-setting";

interface SettingsContentProps {
  activeTab: SettingsTab;
}

/**
 * 设置详情内容区 (SettingsContent)
 * @description 根据注入的 `activeTab` 渲染不同的功能面板（如模型配置，MCP 服务器控制，或是关于界面）。
 * 对于宽屏双列业务（如 `models` 和 `mcp`），自动清空父级保留内边距以使组件无缝贴合容器。
 */
export function SettingsContent({ activeTab }: SettingsContentProps) {
  return (
    <div className="flex-1 overflow-y-auto w-full h-full custom-scroll relative">
      {activeTab === "models" || activeTab === "mcp" ? (
        <>
          {activeTab === "models" && <ModelsSetting />}
          {activeTab === "mcp" && <McpSetting />}
        </>
      ) : (
        <div className="max-w-3xl mx-auto p-8 pt-10">
          {activeTab === "about" && <AboutSetting />}
        </div>
      )}
    </div>
  );
}
