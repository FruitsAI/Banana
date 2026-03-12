"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Switch 组件 (黏土风格滑动开关)
 * @description
 *   黏土形态的拨动开关，轨道和滑块都采用蓬松的黏土质感。
 *   开启时滑块带有柔和的品牌色光晕，动画使用弹性曲线。
 * @example
 * <Switch defaultChecked={true} />
 * <Switch size="sm" />
 */

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default" | "lg"
}) {
  const sizeStyles = {
    sm: "h-6 w-11 data-[state=checked]:shadow-[var(--shadow-clay-sm)]",
    default: "h-7 w-14 data-[state=checked]:shadow-[var(--shadow-clay-md)]",
    lg: "h-9 w-[4.5rem] data-[state=checked]:shadow-[var(--shadow-clay-lg)]",
  }

  const thumbSizes = {
    sm: "size-5 data-[state=checked]:translate-x-5",
    default: "size-6 data-[state=checked]:translate-x-7",
    lg: "size-7 data-[state=checked]:translate-x-9",
  }

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full outline-none transition-all duration-250 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] focus-visible:ring-[4px] focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        "bg-[var(--clay-surface-dark)] shadow-[var(--shadow-clay-inset)]",
        "data-[state=checked]:bg-[var(--brand-primary)]",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-[var(--shadow-clay-sm)] ring-0 transition-all duration-250 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
          "data-[state=unchecked]:translate-x-0.5",
          thumbSizes[size]
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
