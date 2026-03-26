"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface"

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
        data-surface-tone="liquid-popover"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-[26px] border p-4 text-popover-foreground shadow-[0_28px_72px_rgba(15,23,42,0.18)] outline-hidden backdrop-blur-xl motion-safe:will-change-transform data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        style={{
          ...getMaterialSurfaceStyle("floating", "md"),
          ["--liquid-surface-fill" as string]:
            "linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 100%), var(--liquid-material-base-background)",
        }}
        data-material-role="floating"
        data-surface-clarity="high"
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(255,255,255,0.26), transparent 28%), radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 34%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-4 top-0 h-px opacity-85"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.78) 20%, rgba(255,255,255,0.16) 80%, transparent 100%)",
          }}
        />
        <div className="relative z-10">{props.children}</div>
      </PopoverPrimitive.Content>
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
      className={cn("flex flex-col gap-1.5 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("font-semibold tracking-[-0.01em]", className)}
      style={{ color: "var(--text-primary)" }}
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
      className={cn("text-sm leading-5", className)}
      style={{ color: "var(--text-secondary)" }}
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
