"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Switch 组件 (滑动开关)
 * @description 
 *   基于 `@radix-ui/react-switch` 构建的拨动开关组件。
 *   支持原生的键盘聚焦、两种尺寸配置以及深浅色模式下的独立状态着色。
 * @example
 * <Switch defaultChecked={true} />
 * <Switch size="sm" />
 */

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent outline-none transition-[transform,background-color,box-shadow,border-color] duration-250 ease-out focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary-light)] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_0_4px_var(--brand-primary-light)] data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-[transform,box-shadow,background-color] duration-250 ease-out group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=checked]:shadow-[0_4px_10px_rgba(0,0,0,0.22)] data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
