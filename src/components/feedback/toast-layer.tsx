"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ToastMessage, ToastVariant } from "@/components/feedback/types";

interface ToastLayerProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
}

const TOAST_VARIANT_STYLE: Record<ToastVariant, string> = {
  default: "border-[var(--glass-border)]",
  success: "border-[var(--success)]/35",
  error: "border-[var(--danger)]/35",
  warning: "border-[var(--warning)]/35",
  info: "border-[var(--info)]/35",
};

const TOAST_ACCENT_STYLE: Record<ToastVariant, string> = {
  default: "bg-[var(--brand-primary)]/35",
  success: "bg-[var(--success)]",
  error: "bg-[var(--danger)]",
  warning: "bg-[var(--warning)]",
  info: "bg-[var(--info)]",
};

/**
 * ToastLayer 组件
 * @description 全局 Toast 渲染层，通过 Portal 挂载到 body。
 */
export function ToastLayer({ messages, onDismiss, onAction }: ToastLayerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed right-4 bottom-4 z-[120] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const variant = message.variant ?? "default";
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto relative overflow-hidden rounded-2xl border p-3 shadow-xl",
                TOAST_VARIANT_STYLE[variant]
              )}
              style={{
                background: "var(--glass-elevated)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
            >
              <span
                className={cn("absolute inset-y-0 left-0 w-1", TOAST_ACCENT_STYLE[variant])}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3 pl-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{message.title}</p>
                  {message.description ? (
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      {message.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {message.actionLabel ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg px-2 text-xs"
                      onClick={() => onAction(message.id)}
                    >
                      {message.actionLabel}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-lg px-2 text-xs"
                    onClick={() => onDismiss(message.id)}
                  >
                    关闭
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
