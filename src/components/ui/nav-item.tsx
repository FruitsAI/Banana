"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import {
  getLiquidSelectionState,
  getLiquidSelectionStyle,
} from "@/components/ui/liquid-selection";

interface NavItemProps {
  /** HugeIcons 图标组件 */
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  /** 显示文本 */
  label: string;
  /** 辅助说明文本 */
  description?: string;
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
  /** 右侧补充内容 */
  accessory?: ReactNode;
  /** 透传给底层 button 的附加语义属性 */
  semanticProps?: {
    "aria-controls"?: string;
    "aria-selected"?: boolean;
    id?: string;
    role?: string;
    type?: "button" | "submit" | "reset";
  };
}

/**
 * NavItem — 侧边栏导航项
 * 封装激活态样式（背景、边框、左侧指示条）和 Framer Motion 平滑位移动画。
 * 替换 SettingsSidebar 和 McpSetting 中重复的 motion.button 导航项代码。
 */
export function NavItem({
  icon,
  label,
  description,
  isActive,
  onClick,
  layoutId = "navActiveIndicator",
  className,
  accessory,
  semanticProps,
}: NavItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      {...semanticProps}
      className={cn(
        "material-interactive relative w-full overflow-hidden border text-sm transition-all duration-200",
        description
          ? "flex items-start gap-3 rounded-[24px] px-3.5 py-3.5 text-left"
          : "flex items-center gap-3 rounded-[20px] px-3.5 py-3",
        className,
      )}
      data-active={isActive ? "true" : "false"}
      data-hover-surface={isActive ? "accent" : "content"}
      data-material-role="content"
      data-selection-style={getLiquidSelectionState(isActive)}
      data-surface-tone="liquid-nav-item"
      style={getLiquidSelectionStyle({
        active: isActive,
        inactiveRole: "content",
        inactiveTextColor: "var(--text-secondary)",
      })}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
    >
      {/* 激活态边框动画 */}
      {isActive && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] border"
          style={{ borderColor: "var(--selection-active-border)" }}
          layoutId={`${layoutId}Border`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      <span
        className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-75"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 18%, rgba(255,255,255,0.14) 82%, transparent 100%)",
        }}
      />

      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl border",
          description ? "mt-0.5 h-9 w-9" : "h-8 w-8",
        )}
        style={{
          ...getMaterialSurfaceStyle(isActive ? "accent" : "floating", "sm"),
          background: isActive ? "var(--selection-active-chip-fill)" : "var(--material-floating-background)",
          borderColor: isActive ? "var(--selection-active-chip-border)" : "var(--material-floating-border)",
          boxShadow: isActive
            ? "var(--selection-active-chip-shadow)"
            : "var(--liquid-material-rest-shadow)",
        }}
      >
        <HugeiconsIcon
          icon={icon}
          size={description ? 18 : 17}
          style={{
            color: isActive
              ? "var(--selection-active-foreground, var(--brand-primary))"
              : "var(--icon-muted)",
          }}
        />
      </div>

      {description ? (
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span
              className="font-medium"
              style={{
                color: isActive
                  ? "var(--selection-active-foreground, var(--brand-primary))"
                  : "var(--text-primary)",
              }}
            >
              {label}
            </span>
            {accessory}
          </div>
          <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>
            {description}
          </p>
        </div>
      ) : (
        <>
          <span className="font-medium">{label}</span>
          {accessory}
        </>
      )}

      {isActive && (
        <motion.div
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
          style={{ background: "var(--selection-active-indicator)" }}
          layoutId={`${layoutId}Indicator`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

    </motion.button>
  );
}
