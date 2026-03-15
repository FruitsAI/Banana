"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat02Icon,
  Settings01Icon,
  Sun03Icon,
  Moon02Icon,
} from "@hugeicons/core-free-icons";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const navItems = [
  { id: "chats", icon: AiChat02Icon, label: "会话", path: "/" },
];

// ─── RailButton ───────────────────────────────────────────────────────────────
// 内部共享的图标导航按钮，复用 motion.button 结构。
// 通过 layoutId="activeIndicator" 在所有按钮间共享指示条动画（Magic Move）。

interface RailButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  children?: React.ReactNode; // 用于自定义图标内容（如主题切换按钮）
}

function RailButton({ icon, label, isActive = false, onClick, children }: RailButtonProps) {
  return (
    <motion.button
      className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl relative overflow-hidden"
      style={{
        background: isActive
          ? "var(--brand-primary-light)"
          : "transparent",
        color: isActive ? "var(--brand-primary)" : "var(--text-tertiary)",
        boxShadow: isActive
          ? "0 0 0 1px var(--brand-primary-border), 0 4px 12px var(--brand-primary-glow)"
          : "none",
      }}
      whileHover={{
        background: isActive ? "var(--brand-primary-light)" : "var(--glass-subtle)",
        color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
        boxShadow: isActive
          ? "0 0 0 1px var(--brand-primary-border-strong), 0 6px 18px var(--brand-primary-glow)"
          : "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
      whileTap={{ scale: 0.93 }}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {/* 悬停光晕 */}
      <motion.span
        className="absolute inset-0 rounded-xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.18) 0%, transparent 70%)",
        }}
      />

      {children ?? (icon && <HugeiconsIcon icon={icon} size={20} />)}

      {/* 激活指示条：通过 layoutId 在多个按钮间共享平滑位移动画 */}
      {isActive && (
        <motion.div
          className="absolute left-0 w-0.5 sm:w-1 h-4 sm:h-5 rounded-r-full"
          style={{
            background: "var(--brand-primary)",
            boxShadow: "0 0 6px var(--brand-primary-glow)",
          }}
          layoutId="activeIndicator"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

// ─── Rail ─────────────────────────────────────────────────────────────────────

/**
 * @function Rail
 * @description 应用最左侧的极简图标导航轨道 (Rail)。
 * 采用苹果液态玻璃风格设计，主要用于在全局不同的一级功能模块间切换。
 */
export function Rail() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isSettingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <aside
      className="w-14 sm:w-16 flex-shrink-0 flex flex-col items-center py-4 gap-2 relative"
      style={{
        background: "var(--glass-surface)",
        backdropFilter: "blur(40px) saturate(200%) brightness(1.02)",
        WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.02)",
        borderRight: "1px solid var(--divider)",
        boxShadow: "2px 0 12px rgba(0,0,0,0.05)",
      }}
      aria-label="主导航"
    >
      {/* 主导航项 */}
      <div className="flex flex-col gap-1 w-full items-center">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path || (item.path === "/" && pathname === "");
          return (
            <RailButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              onClick={() => router.push(item.path)}
            />
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      <div className="flex flex-col gap-2 w-full items-center">
        {/* 主题切换按钮 */}
        {mounted && (
          <RailButton
            label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              {theme === "dark" ? (
                <HugeiconsIcon icon={Sun03Icon} size={20} />
              ) : (
                <HugeiconsIcon icon={Moon02Icon} size={20} />
              )}
            </motion.div>
          </RailButton>
        )}

        {/* 设置入口 */}
        <RailButton
          icon={Settings01Icon}
          label="设置"
          isActive={isSettingsActive}
          onClick={() => router.push("/settings")}
        />
      </div>
    </aside>
  );
}
