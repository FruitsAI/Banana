"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiComputerIcon,
  Moon02Icon,
  Sun03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { useAnimationIntensity } from "@/components/animation-intensity-provider";
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
  const shouldReduceMotion = useReducedMotion();

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
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
          外观设置
        </h2>
        <div className="flex gap-3">
          {THEME_OPTIONS.map((item) => (
            <div
              key={item.id}
              className="flex-1 min-h-[100px] rounded-xl border"
              style={{
                background: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
          外观设置
        </h2>

        <div className="flex gap-3">
          {THEME_OPTIONS.map((item) => {
            const isActive = theme === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 relative min-h-[100px]"
                style={{
                  background: isActive ? "var(--brand-primary-lighter)" : "var(--glass-surface)",
                  borderColor: isActive ? "var(--brand-primary-border)" : "var(--glass-border)",
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        background: isActive ? "var(--brand-primary-light)" : "var(--glass-hover)",
                        borderColor: isActive
                          ? "var(--brand-primary-border-strong)"
                          : "var(--glass-border-strong)",
                        y: -2,
                      }
                }
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {isActive && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--brand-primary)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <HugeiconsIcon icon={Tick02Icon} size={10} color="#ffffff" />
                  </motion.div>
                )}

                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
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
              </motion.button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          动画强度
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
          影响全局过渡、交互动效和动态反馈。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INTENSITY_OPTIONS.map((item) => {
            const isActive = intensity === item.id;
            const isSaving = savingIntensity === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => void handleIntensityChange(item.id)}
                className="relative rounded-xl border p-4 text-left transition-all duration-200 min-h-[100px]"
                style={{
                  background: isActive ? "var(--brand-primary-lighter)" : "var(--glass-surface)",
                  borderColor: isActive ? "var(--brand-primary-border)" : "var(--glass-border)",
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -2,
                        background: isActive ? "var(--brand-primary-light)" : "var(--glass-hover)",
                        borderColor: isActive
                          ? "var(--brand-primary-border-strong)"
                          : "var(--glass-border-strong)",
                      }
                }
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {isActive && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--brand-primary)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <HugeiconsIcon icon={Tick02Icon} size={10} color="#ffffff" />
                  </motion.div>
                )}

                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {item.description}
                </p>
                {isSaving && (
                  <span className="mt-2 inline-block text-[11px]" style={{ color: "var(--brand-primary)" }}>
                    正在保存...
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
