"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface"

/**
 * Dialog 相关组件 (模态对话框)
 * @description 
 *   基于 `@radix-ui/react-dialog` 构建，具有原生级别的无障碍访问能力 (a11y)。
 *   提供了覆盖层 (Overlay)、内容区 (Content) 和各种布局子模块。
 *   包含出入场动画，强制焦点锁定。
 * @example
 * <Dialog>
 *   <DialogTrigger>打开</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>标题</DialogTitle>
 *     </DialogHeader>
 *   </DialogContent>
 * </Dialog>
 */

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      data-backdrop-style="frosted-atmosphere"
      data-testid="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[rgba(6,10,18,0.26)] backdrop-blur-[18px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-250 data-[state=closed]:duration-200",
        className
      )}
      style={{
        background:
          "radial-gradient(circle at top, rgba(59,130,246,0.1), transparent 26%), radial-gradient(circle at bottom, rgba(255,255,255,0.08), transparent 34%), rgba(6,10,18,0.22)",
      }}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-surface-tone="liquid-modal"
        data-testid="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-1.5rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-hidden rounded-[32px] border p-6 shadow-[0_36px_90px_rgba(15,23,42,0.22)] outline-none sm:max-w-lg motion-safe:will-change-transform data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-3 data-[state=open]:duration-300 data-[state=closed]:duration-200",
          className
        )}
        style={{
          ...getMaterialSurfaceStyle("floating", "lg"),
          ["--liquid-surface-fill" as string]:
            "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 100%), var(--liquid-material-base-background)",
        }}
        data-material-role="floating"
        data-surface-clarity="high"
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-95"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(255,255,255,0.3), transparent 28%), radial-gradient(circle at bottom right, rgba(59,130,246,0.14), transparent 34%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px opacity-90"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.82) 16%, rgba(255,255,255,0.18) 84%, transparent 100%)",
          }}
        />
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 z-10 rounded-full border p-2 text-[var(--text-tertiary)] opacity-90 transition-[transform,opacity,background-color,color,border-color] duration-200 ease-out hover:opacity-100 motion-safe:hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-light)]"
            style={{
              background: "rgba(255,255,255,0.12)",
              borderColor: "rgba(255,255,255,0.16)",
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("relative z-10 flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "relative z-10 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[1.35rem] leading-tight font-semibold tracking-[-0.02em]", className)}
      style={{ color: "var(--text-primary)" }}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm leading-6", className)}
      style={{ color: "var(--text-secondary)" }}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
