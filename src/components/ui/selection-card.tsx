"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { getLiquidSelectionState } from "@/components/ui/liquid-selection";

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
        "material-interactive relative w-full overflow-hidden rounded-[24px] border p-4 text-left transition-all duration-200",
        className
      )}
      data-hover-surface={isActive ? "accent" : "content"}
      data-material-role="content"
      data-selection-style={getLiquidSelectionState(isActive)}
      data-surface-tone="liquid-selection-card"
      style={{
        ...getMaterialSurfaceStyle(isActive ? "accent" : "content", "sm"),
        background: isActive
          ? "linear-gradient(180deg, rgba(59,130,246,0.16) 0%, rgba(255,255,255,0.08) 100%), var(--material-accent-background)"
          : "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 100%), var(--material-content-background)",
        borderColor: isActive ? "var(--material-accent-border)" : "var(--material-content-border)",
      }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -2,
            }
      }
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <span
        className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-75"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 18%, rgba(255,255,255,0.16) 82%, transparent 100%)",
        }}
      />
      {/* 右上角勾选标记，激活时以 scale 动画入场 */}
      {isActive && (
        <motion.div
          initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute right-3 top-3 flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{
            background: "linear-gradient(180deg, #8bb9ff 0%, #5c9cff 52%, #3c82f6 100%)",
            boxShadow:
              "0 8px 18px rgba(59,130,246,0.2), inset 0 0.5px 0 rgba(255,255,255,0.14)",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <HugeiconsIcon icon={Tick02Icon} size={10} color="#ffffff" />
        </motion.div>
      )}

      {children}
    </motion.button>
  );
}
