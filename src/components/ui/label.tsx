"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Label 组件 (黏土风格文本标签)
 * @description
 *   基于 `@radix-ui/react-label` 的黏土形态标签组件。
 *   支持禁用状态的样式级联传递，聚焦时带有柔和的品牌色高亮。
 * @example
 * <Label htmlFor="email">邮箱</Label>
 * <Label size="lg">大标签</Label>
 */

interface LabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  size?: "sm" | "default" | "lg"
}

function Label({
  className,
  size = "default",
  ...props
}: LabelProps) {
  const sizeStyles = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
  }

  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 leading-none font-semibold select-none",
        "text-[var(--text-primary)]",
        "transition-all duration-200 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
        "peer-focus-visible:text-[var(--brand-primary)] peer-focus-visible:translate-x-0.5",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}

export { Label }
