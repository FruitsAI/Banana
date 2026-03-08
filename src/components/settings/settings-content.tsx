"use client";

import type { SettingsTab } from "./settings-container";
import { ModelsSetting } from "./sections/models-setting";
import { McpSetting } from "./sections/mcp-setting";
import { AboutSetting } from "./sections/about-setting";
import { ThemeSetting } from "./sections/theme-setting";

interface SettingsContentProps {
  activeTab: SettingsTab;
}

/**
 * SettingsContent 组件 (设置详情内容区)
 * @description 
 *   右侧的主内容展示区。根据外部传入的 `activeTab` 状态，动态挂载不同的功能性配置面板
 *   （如模型配置 ModelsSetting，MCP 服务器控制 McpSetting，或主题/关于界面）。
 * @param {SettingsTab} activeTab - 当前激活的选项卡标识符
 * @example
 * <SettingsContent activeTab="theme" />
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
        <>
          {activeTab === "theme" && <ThemeSetting />}
          {activeTab === "about" && <AboutSetting />}
        </>
      )}
    </div>
  );
}
