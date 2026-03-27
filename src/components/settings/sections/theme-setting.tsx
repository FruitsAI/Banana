"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiComputerIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";

import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { SettingsPageFrame } from "@/components/settings/settings-page-frame";
import { SettingsSectionGroup, SettingsSectionShell } from "@/components/settings/settings-section-shell";
import { SelectionCard } from "@/components/ui/selection-card";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { useHydrated } from "@/hooks/use-hydrated";
import type { AnimationIntensity } from "@/lib/animation-intensity";

const THEME_OPTIONS = [
  { id: "light", label: "浅色", icon: Sun03Icon },
  { id: "dark", label: "深色", icon: Moon02Icon },
  { id: "system", label: "跟随系统", icon: AiComputerIcon },
] as const;

const INTENSITY_OPTIONS: Array<{
  id: AnimationIntensity;
  label: string;
}> = [
  { id: "low", label: "轻量" },
  { id: "medium", label: "标准" },
  { id: "high", label: "增强" },
];

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();
  const { intensity, setIntensity } = useAnimationIntensity();
  const mounted = useHydrated();
  const [savingIntensity, setSavingIntensity] = useState<AnimationIntensity | null>(null);

  const handleIntensityChange = async (next: AnimationIntensity) => {
    if (next === intensity) return;
    setSavingIntensity(next);
    await setIntensity(next);
    setSavingIntensity(null);
  };

  if (!mounted) {
    return (
      <SettingsPageFrame>
        <SettingsSectionShell
          sectionId="theme"
          eyebrow="Appearance"
          title="外观设置"
        >
            <SettingsSectionGroup>
              <div className="mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  主题
                </h3>
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
      </SettingsPageFrame>
    );
  }

  return (
    <SettingsPageFrame>
      <SettingsSectionShell
        sectionId="theme"
        eyebrow="Appearance"
        title="外观设置"
      >
          <SettingsSectionGroup>
            <div className="mb-5">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                主题
              </h3>
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
                          background: isActive
                            ? "var(--selection-active-chip-fill)"
                            : "var(--material-content-background)",
                          border: isActive
                            ? "1px solid var(--selection-active-chip-border)"
                            : "1px solid var(--material-content-border)",
                          boxShadow: isActive
                            ? "var(--selection-active-chip-shadow)"
                            : "inset 0 1px 0 rgba(255,255,255,0.12)",
                        }}
                      >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={20}
                        style={{
                          color: isActive
                            ? "var(--selection-active-foreground, var(--brand-primary))"
                            : "var(--icon-muted)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: isActive
                          ? "var(--selection-active-foreground, var(--brand-primary))"
                          : "var(--text-primary)",
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
                        style={{
                          color: isActive
                            ? "var(--selection-active-foreground, var(--brand-primary))"
                            : "var(--text-primary)",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    {isSaving ? (
                      <span className="mt-2 inline-block text-[11px]" style={{ color: "var(--selection-active-foreground)" }}>
                        正在保存...
                      </span>
                    ) : null}
                  </SelectionCard>
                );
              })}
            </div>
          </SettingsSectionGroup>
      </SettingsSectionShell>
    </SettingsPageFrame>
  );
}
