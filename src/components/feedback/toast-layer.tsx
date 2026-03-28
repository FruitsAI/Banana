"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { Button } from "@/components/ui/button";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { cn } from "@/lib/utils";
import type { ToastMessage, ToastVariant } from "@/components/feedback/types";

interface ToastLayerProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
}

const TOAST_BANNER_VARIANT_STYLE: Record<ToastVariant, string> = {
  default: "border-[var(--material-floating-border)]",
  success: "border-[var(--success)]/35",
  error: "border-[var(--danger)]/35",
  warning: "border-[var(--warning)]/35",
  info: "border-[var(--info)]/35",
};

const TOAST_ACCENT_STYLE: Record<ToastVariant, string> = {
  default: "bg-[var(--brand-primary)]/65",
  success: "bg-[var(--success)]",
  error: "bg-[var(--danger)]",
  warning: "bg-[var(--warning)]",
  info: "bg-[var(--info)]",
};

const TOAST_META_LABEL: Record<ToastVariant, string> = {
  default: "Notice",
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

function isCapsuleVariant(variant: ToastVariant): variant is "success" | "error" {
  return variant === "success" || variant === "error";
}

/**
 * ToastLayer 组件
 * @description 全局 Toast 渲染层，通过 Portal 挂载到 body。
 */
export function ToastLayer({ messages, onDismiss, onAction }: ToastLayerProps) {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();
  const motionReduced = shouldReduceMotion || intensity === "low";
  const motionDuration = (value: number) => Number((value * factors.duration).toFixed(3));
  const motionDistance = (value: number) => Number((value * factors.distance).toFixed(3));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed left-1/2 z-[140] flex w-[min(540px,calc(100vw-1.5rem))] -translate-x-1/2 flex-col gap-2"
      data-testid="toast-viewport"
      data-toast-placement="top-center"
      data-toast-style="liquid-banner"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + var(--desktop-toast-offset, 54px))",
      }}
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const variant = message.variant ?? "default";
          const capsuleVariant = isCapsuleVariant(variant);
          const surface = getMaterialSurfaceStyle("floating", "md");
          return (
            <motion.div
              key={message.id}
              initial={motionReduced ? false : { opacity: 0, y: motionDistance(-18), scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={motionReduced ? { opacity: 0.999, y: 0, scale: 1 } : { opacity: 0, y: motionDistance(-10), scale: 0.985 }}
              transition={{ duration: motionDuration(0.26), ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto relative",
                capsuleVariant
                  ? "toast-capsule max-w-full self-center"
                  : cn("rounded-[28px] px-4 py-3.5", TOAST_BANNER_VARIANT_STYLE[variant]),
              )}
              data-testid={`toast-item-${message.id}`}
              data-feedback-surface={capsuleVariant ? "liquid-capsule" : "liquid-banner"}
              data-toast-layout={capsuleVariant ? "system-capsule" : "system-banner"}
              data-toast-shell={capsuleVariant ? "capsule" : "banner"}
              data-toast-variant={variant}
              data-surface-clarity="high"
              style={
                capsuleVariant
                  ? undefined
                  : {
                      ...surface,
                      ["--liquid-surface-fill" as string]:
                        "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.1) 100%), var(--liquid-material-base-background)",
                    }
              }
            >
              {capsuleVariant ? (
                <>
                  <div
                    className="toast-capsule-shadow"
                    aria-hidden="true"
                    data-testid={`toast-shadow-${message.id}`}
                  />
                  <div
                    className="toast-capsule-surface rounded-[999px] px-3 py-2.5"
                    style={surface}
                  >
                    <div className="toast-capsule-liquid" aria-hidden="true">
                      <span className="toast-capsule-liquid-orb toast-capsule-liquid-orb-primary" />
                      <span className="toast-capsule-liquid-orb toast-capsule-liquid-orb-secondary" />
                    </div>
                    <div className="toast-capsule-caustic" aria-hidden="true" />
                    <div className="toast-capsule-depth" aria-hidden="true" />
                    <div className="toast-capsule-content relative z-10 grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2">
                      <div className="toast-capsule-icon-shell" aria-hidden="true">
                        <HugeiconsIcon
                          icon={variant === "success" ? CheckmarkCircle01Icon : Cancel01Icon}
                          size={16}
                        />
                      </div>
                      <div
                        className="toast-capsule-copy min-w-0 text-center whitespace-normal break-words"
                        data-testid={`toast-copy-${message.id}`}
                      >
                        <p
                          className="toast-capsule-text text-sm font-semibold leading-6 tracking-[0.01em] whitespace-normal break-words"
                          style={{ color: "var(--toast-capsule-text)" }}
                        >
                          {message.title}
                        </p>
                      </div>
                      <div className="toast-capsule-spacer" aria-hidden="true" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 opacity-90"
                    aria-hidden="true"
                    style={{
                      background:
                        "radial-gradient(circle at top left, rgba(255,255,255,0.28), transparent 30%), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 34%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-4 top-0 h-px opacity-80"
                    aria-hidden="true"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 18%, rgba(255,255,255,0.24) 82%, transparent 100%)",
                    }}
                  />
                  <div className="relative z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]", TOAST_ACCENT_STYLE[variant])} />
                      <span
                        className="rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                          color: "var(--text-tertiary)",
                          borderColor: "rgba(255,255,255,0.18)",
                          background: "rgba(255,255,255,0.08)",
                        }}
                      >
                        {TOAST_META_LABEL[variant]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-[0.01em]" style={{ color: "var(--text-primary)" }}>
                        {message.title}
                      </p>
                      {message.description ? (
                        <p className="mt-1 truncate text-[13px] leading-5" style={{ color: "var(--text-secondary)" }}>
                          {message.description}
                        </p>
                      ) : null}
                    </div>
                    <div
                      className="flex items-center justify-end gap-2"
                      data-testid={`toast-actions-${message.id}`}
                      data-toast-actions="trailing"
                    >
                      {message.actionLabel ? (
                        <Button
                          size="xs"
                          variant="secondary"
                          surface="floating"
                          className="min-w-[64px] rounded-full px-3 text-[11px] font-semibold"
                          onClick={() => onAction(message.id)}
                        >
                          {message.actionLabel}
                        </Button>
                      ) : null}
                      <Button
                        size="xs"
                        variant="ghost"
                        className="rounded-full px-2.5 text-[11px]"
                        onClick={() => onDismiss(message.id)}
                      >
                        关闭
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
