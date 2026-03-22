"use client";

import type { JSX } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { createMotionPresets } from "@/lib/motion-presets";
import type { SettingsTab } from "./settings-container";
import { ModelsSetting } from "./sections/models-setting";
import { McpSetting } from "./sections/mcp-setting";
import { AboutSetting } from "./sections/about-setting";
import { ThemeSetting } from "./sections/theme-setting";

interface SettingsContentProps {
  activeTab: SettingsTab;
}

const SETTINGS_TAB_COMPONENTS = {
  models: ModelsSetting,
  mcp: McpSetting,
  theme: ThemeSetting,
  about: AboutSetting,
} satisfies Record<SettingsTab, () => JSX.Element>;

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
  const ActivePanel = SETTINGS_TAB_COMPONENTS[activeTab];
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();
  const motionReduced = shouldReduceMotion || intensity === "low";
  const motionDuration = (value: number) => Number((value * factors.duration).toFixed(3));
  const motionDistance = (value: number) => Number((value * factors.distance).toFixed(3));
  const motionScale = (value: number) =>
    Number((1 - (1 - value) * factors.scale).toFixed(3));
  const motionPresets = createMotionPresets({
    reduced: motionReduced,
    duration: motionDuration,
    distance: motionDistance,
    scale: motionScale,
    scaleFactor: factors.scale,
  });

  return (
    <div
      className="relative flex-1 h-full w-full overflow-hidden"
      data-testid="settings-content-scroll"
      data-settings-active-tab={activeTab}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--material-content-background) 88%, transparent) 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12"
        style={{
          background:
            "linear-gradient(0deg, color-mix(in srgb, var(--material-content-background) 90%, transparent) 0%, transparent 100%)",
        }}
      />

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={activeTab}
          className="h-full"
          aria-labelledby={`settings-tab-${activeTab}`}
          data-testid="settings-content-panel"
          data-material-role="content"
          data-motion-preset="panel"
          data-settings-active-tab={activeTab}
          id={`settings-panel-${activeTab}`}
          role="tabpanel"
          initial={motionPresets.panel.initial}
          animate={motionPresets.panel.animate}
          exit={
            motionReduced
              ? { opacity: 0.999, y: 0, scale: 1 }
              : { opacity: 0, y: motionDistance(-8), scale: motionScale(0.992) }
          }
          transition={motionPresets.panel.transition}
        >
          <ActivePanel />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
