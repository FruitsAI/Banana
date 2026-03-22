"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiComputerIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";

import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { SettingsSectionGroup, SettingsSectionShell } from "@/components/settings/settings-section-shell";
import { SelectionCard } from "@/components/ui/selection-card";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import type { AnimationIntensity } from "@/lib/animation-intensity";

const THEME_OPTIONS = [
  { id: "light", label: "浅色", icon: Sun03Icon },
  { id: "dark", label: "深色", icon: Moon02Icon },
  { id: "system", label: "跟随系统", icon: AiComputerIcon },
] as const;

const INTENSITY_OPTIONS: Array<{
  id: AnimationIntensity;
  label: string;
  description: string;
}> = [
  { id: "low", label: "轻量", description: "更少位移和缩放，低干扰" },
  { id: "medium", label: "标准", description: "平衡观感与效率，推荐" },
  { id: "high", label: "增强", description: "更明显动效，更强反馈" },
];

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();
  const { intensity, setIntensity } = useAnimationIntensity();

  const [mounted, setMounted] = useState(false);
  const [savingIntensity, setSavingIntensity] = useState<AnimationIntensity | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleIntensityChange = async (next: AnimationIntensity) => {
    if (next === intensity) return;
    setSavingIntensity(next);
    await setIntensity(next);
    setSavingIntensity(null);
  };

  if (!mounted) {
    return (
      <div className="h-full overflow-y-auto custom-scroll">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <SettingsSectionShell
            sectionId="theme"
            eyebrow="Appearance"
            title="外观设置"
            description="根据当前环境切换主题与动效密度，让界面层级、亮度和反馈节奏更贴近系统。"
          >
            <SettingsSectionGroup>
              <div className="mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  主题
                </h3>
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                  选择浅色、深色或跟随系统。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {THEME_OPTIONS.map((item) => (
                  <div
                    key={item.id}
                    className="min-h-[116px] rounded-2xl border"
                    style={{ ...getMaterialSurfaceStyle("floating", "sm") }}
                  />
                ))}
              </div>
            </SettingsSectionGroup>

            <SettingsSectionGroup>
              <div className="mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  动画强度
                </h3>
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                  控制位移、缩放和持续反馈的整体强度。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {INTENSITY_OPTIONS.map((item) => (
                  <div
                    key={item.id}
                    className="min-h-[112px] rounded-2xl border"
                    style={{ ...getMaterialSurfaceStyle("floating", "sm") }}
                  />
                ))}
              </div>
            </SettingsSectionGroup>
          </SettingsSectionShell>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <SettingsSectionShell
          sectionId="theme"
          eyebrow="Appearance"
          title="外观设置"
          description="选择更适合当前环境的界面主题，让 Banana 的层级、亮度与材质反馈和系统节奏保持一致。"
        >
          <SettingsSectionGroup>
            <div className="mb-5">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                主题
              </h3>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                在浅色、深色和系统外观之间切换，让窗口材质与桌面环境自然融合。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {THEME_OPTIONS.map((item) => {
                const isActive = theme === item.id;
                return (
                  <SelectionCard
                    key={item.id}
                    isActive={isActive}
                    onClick={() => setTheme(item.id)}
                    className="flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-2xl"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        background: isActive ? "var(--brand-primary-light)" : "var(--glass-subtle)",
                      }}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={20}
                        style={{
                          color: isActive ? "var(--brand-primary)" : "var(--text-tertiary)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: isActive ? "var(--brand-primary)" : "var(--text-primary)",
                      }}
                    >
                      {item.label}
                    </span>
                  </SelectionCard>
                );
              })}
            </div>
          </SettingsSectionGroup>

          <SettingsSectionGroup>
            <div className="mb-5">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                动画强度
              </h3>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                影响全局过渡、交互动效和动态反馈。较低强度会减少位移与持续装饰动画，更适合长时间专注。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {INTENSITY_OPTIONS.map((item) => {
                const isActive = intensity === item.id;
                const isSaving = savingIntensity === item.id;

                return (
                  <SelectionCard
                    key={item.id}
                    isActive={isActive}
                    onClick={() => void handleIntensityChange(item.id)}
                    className="min-h-[112px] rounded-2xl text-left"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>
                      {item.description}
                    </p>
                    {isSaving ? (
                      <span className="mt-2 inline-block text-[11px]" style={{ color: "var(--brand-primary)" }}>
                        正在保存...
                      </span>
                    ) : null}
                  </SelectionCard>
                );
              })}
            </div>
          </SettingsSectionGroup>
        </SettingsSectionShell>
      </div>
    </div>
  );
}
