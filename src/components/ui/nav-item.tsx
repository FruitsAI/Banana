"use client";

import type { ComponentProps } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  /** HugeIcons 图标组件 */
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  /** 显示文本 */
  label: string;
  /** 是否处于激活状态 */
  isActive: boolean;
  /** 点击回调 */
  onClick: () => void;
  /**
   * Framer Motion layoutId 前缀，用于跨组件共享动画上下文。
   * 同一页面有多个 NavItem 组时必须传入不同值，避免动画冲突。
   * 默认 "navActiveIndicator"
   */
  layoutId?: string;
  /** 额外 className */
  className?: string;
}

/**
 * NavItem — 侧边栏导航项
 * 封装激活态样式（背景、边框、左侧指示条）和 Framer Motion 平滑位移动画。
 * 替换 SettingsSidebar 和 McpSetting 中重复的 motion.button 导航项代码。
 */
export function NavItem({
  icon,
  label,
  isActive,
  onClick,
  layoutId = "navActiveIndicator",
  className,
}: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
        className
      )}
      style={{
        background: isActive ? "var(--brand-primary-lighter)" : "transparent",
        color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
      }}
      whileHover={{
        background: isActive ? "var(--brand-primary-light)" : "var(--glass-subtle)",
      }}
      whileTap={{ scale: 0.99 }}
    >
      {/* 激活态边框动画 */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border pointer-events-none"
          style={{ borderColor: "var(--brand-primary-border)" }}
          layoutId={`${layoutId}Border`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      <HugeiconsIcon
        icon={icon}
        size={18}
        style={{ color: isActive ? "var(--brand-primary)" : "var(--text-tertiary)" }}
      />

      <span className="font-medium">{label}</span>

      {/* 左侧激活指示条动画 */}
      {isActive && (
        <motion.div
          className="absolute left-0 w-1 h-5 rounded-r-full"
          style={{ background: "var(--brand-primary)" }}
          layoutId={`${layoutId}Indicator`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}
