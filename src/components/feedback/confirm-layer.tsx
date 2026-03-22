"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ConfirmRequest } from "@/components/feedback/types";

interface ConfirmLayerProps {
  activeRequest: ConfirmRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmLayer 组件
 * @description 全局确认弹窗渲染层，受控于 FeedbackProvider。
 */
export function ConfirmLayer({
  activeRequest,
  onConfirm,
  onCancel,
}: ConfirmLayerProps) {
  const options = activeRequest?.options;
  const confirmText = options?.confirmText ?? "确认";
  const cancelText = options?.cancelText ?? "取消";
  const isDestructive = options?.variant === "destructive";

  return (
    <Dialog
      open={Boolean(activeRequest)}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(32rem,calc(100vw-1.5rem))] gap-5 px-6 py-6 sm:px-7"
      >
        <DialogHeader className="gap-3">
          <div
            className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{
              color: "var(--text-tertiary)",
              borderColor: "rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            Confirm Action
          </div>
          <DialogTitle>{options?.title ?? "请确认"}</DialogTitle>
          {options?.description ? (
            <DialogDescription>{options.description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter
          className="gap-2 border-t pt-4 sm:gap-2"
          style={{ borderColor: "color-mix(in srgb, var(--divider) 78%, rgba(255,255,255,0.14))" }}
        >
          <Button variant="glass" surface="floating" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            className="shadow-[0_16px_36px_rgba(15,23,42,0.14)]"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
