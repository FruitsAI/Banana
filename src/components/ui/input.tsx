import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input 组件 (黏土风格输入框)
 * @description
 *   黏土形态输入框，模拟从黏土表面挖出的凹槽效果。
 *   采用内阴影设计，聚焦时呈现被按压的视觉效果。
 *   所有过渡动画使用弹性曲线，营造 playful 的交互体验。
 * @example
 * <Input placeholder="请输入内容" />
 * <Input type="password" />
 * <Input variant="clay" />
 */

interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "clay" | "inset"
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  const baseStyles = "h-12 w-full min-w-0 px-5 py-3 text-base file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground selection:bg-[var(--brand-primary)] selection:text-white placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

  const variantStyles = {
    default: cn(
      "rounded-[var(--r-xl)] bg-[var(--clay-surface)]",
      "shadow-[var(--shadow-clay-sm)]",
      "transition-all duration-250",
      "hover:shadow-[var(--shadow-clay-md)] hover:-translate-y-0.5",
      "focus-visible:outline-none focus-visible:shadow-[var(--shadow-clay-inset)] focus-visible:translate-y-0.5 focus-visible:bg-[var(--clay-surface-light)]"
    ),
    clay: cn(
      "rounded-[var(--r-xl)] bg-[var(--clay-surface)]",
      "shadow-[var(--shadow-clay-sm)]",
      "transition-all duration-250",
      "hover:shadow-[var(--shadow-clay-md)] hover:-translate-y-0.5",
      "focus-visible:outline-none focus-visible:shadow-[var(--shadow-clay-inset)] focus-visible:translate-y-0.5"
    ),
    inset: cn(
      "rounded-[var(--r-xl)] bg-[var(--clay-surface-dark)]",
      "shadow-[var(--shadow-clay-inset)]",
      "transition-all duration-250",
      "focus-visible:outline-none focus-visible:shadow-[var(--shadow-clay-inset-deep)] focus-visible:bg-[var(--clay-surface-pressed)]"
    ),
  }

  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{
        transitionTimingFunction: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      }}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      {...props}
    />
  )
}

export { Input }
