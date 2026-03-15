"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
  /** 是否处于选中状态 */
  isActive: boolean;
  /** 点击回调 */
  onClick: () => void;
  /** 卡片内容 */
  children: React.ReactNode;
  /** 额外 className */
  className?: string;
}

/**
 * SelectionCard — 可选中的卡片组件
 * 封装激活态样式（背景、边框）和右上角勾选标记动画。
 * 替换 ThemeSetting 中主题选项和动画强度选项两处重复的 motion.button 卡片代码。
 */
export function SelectionCard({ isActive, onClick, children, className }: SelectionCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative rounded-xl border p-4 text-left transition-all duration-200",
        className
      )}
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
      {/* 右上角勾选标记，激活时以 scale 动画入场 */}
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

      {children}
    </motion.button>
  );
}
