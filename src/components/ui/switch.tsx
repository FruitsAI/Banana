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
      data-surface-tone="liquid-switch"
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full border outline-none transition-[transform,background-color,box-shadow,border-color] duration-250 ease-out focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary-light)] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-4 data-[size=sm]:w-7",
        className
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%), var(--material-content-background)",
        borderColor: "var(--material-content-border)",
        boxShadow:
          props.checked || props.defaultChecked
            ? "0 0 0 4px var(--brand-primary-light), inset 0 1px 0 rgba(255,255,255,0.24)"
            : "inset 0 1px 0 rgba(255,255,255,0.24)",
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full ring-0 transition-[transform,box-shadow,background-color] duration-250 ease-out group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-3.5 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=checked]:shadow-[0_6px_14px_rgba(15,23,42,0.18)] data-[state=unchecked]:translate-x-0"
        )}
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.82) 100%)",
          marginLeft: size === "sm" ? "1px" : "2px",
        }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
