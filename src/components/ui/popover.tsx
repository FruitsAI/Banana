"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Popover 相关组件 (黏土风格弹出层)
 * @description
 *   黏土形态的弹出层组件，带有蓬松的卡片样式和弹性动画。
 *   支持多种对齐方式和偏移量配置。
 * @example
 * <Popover>
 *   <PopoverTrigger>点击打开</PopoverTrigger>
 *   <PopoverContent>
 *     <PopoverHeader>
 *       <PopoverTitle>标题</PopoverTitle>
 *     </PopoverHeader>
 *   </PopoverContent>
 * </Popover>
 */

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-80 origin-(--radix-popover-content-transform-origin) rounded-[var(--r-xl)] p-5 outline-none",
          "bg-[var(--clay-surface-light)] shadow-[var(--shadow-clay-lg)]",
          "data-[side=bottom]:slide-in-from-top-3 data-[side=left]:slide-in-from-right-3",
          "data-[side=right]:slide-in-from-left-3 data-[side=top]:slide-in-from-bottom-3",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        style={{
          transitionTimingFunction: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-2 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("font-bold text-[var(--text-primary)]", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-[var(--text-secondary)] text-sm", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
}
