"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon, AiComputerIcon, Tick02Icon } from "@hugeicons/core-free-icons";

/**
 * ThemeSetting 组件 (外观设置)
 * @description 
 *   控制全局应用主题（浅色、深色、跟随系统）的设置面板。
 *   采用横向卡片阵列布局，配合 framer-motion 实现悬浮物理缩放动画效果。
 */
export function ThemeSetting() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 延迟一帧渲染挂载状态，以绕过 React 18 对同步 cascaded render 的严格校验
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const themes = [
    { id: "light", label: "浅色", icon: Sun03Icon },
    { id: "dark", label: "深色", icon: Moon02Icon },
    { id: "system", label: "跟随系统", icon: AiComputerIcon },
  ];

  // 客户端挂载前渲染无状态的备用 UI
  // 为什么：next-themes 的主题信息在 SSR 时不可知，若直接渲染含 active 状态的卡片，
  // 可能会因服务端和客户端生成 HTML 不一致而导致 Hydration Mismatch 报错。
  if (!mounted) {
    return (
      <div className="p-6">
        <div>
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            外观设置
          </h2>
          <div className="flex gap-3">
            {themes.map((t) => (
              <div
                key={t.id}
                className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border relative min-h-[100px]"
                style={{
                  background: 'var(--glass-surface)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--glass-subtle)' }}>
                  <HugeiconsIcon icon={t.icon} size={20} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div>
        {/* Header */}
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
          外观设置
        </h2>

        {/* Theme Cards - Horizontal Layout */}
        <div className="flex gap-3">
          {themes.map((t) => {
            const isActive = theme === t.id;
            return (
              <motion.button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 relative min-h-[100px]"
                style={{
                  background: isActive ? 'var(--brand-primary-lighter)' : 'var(--glass-surface)',
                  borderColor: isActive ? 'var(--brand-primary-border)' : 'var(--glass-border)',
                }}
                whileHover={{
                  background: isActive ? 'var(--brand-primary-light)' : 'var(--glass-hover)',
                  borderColor: isActive ? 'var(--brand-primary-border-strong)' : 'var(--glass-border-strong)',
                  y: -2,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {/* Checkmark - Top Right */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--brand-primary)' }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <HugeiconsIcon icon={Tick02Icon} size={10} color="#ffffff" />
                  </motion.div>
                )}

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: isActive ? 'var(--brand-primary-light)' : 'var(--glass-subtle)',
                  }}
                >
                  <HugeiconsIcon
                    icon={t.icon}
                    size={20}
                    style={{
                      color: isActive ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                    }}
                  />
                </div>

                {/* Label */}
                <span
                  className="text-xs font-medium"
                  style={{
                    color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)',
                  }}
                >
                  {t.label}
                </span>
              </motion.button>
            );
          })}
        </div>


      </div>
    </div>
  );
}
