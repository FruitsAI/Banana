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
        className="max-w-[min(30rem,calc(100vw-1.5rem))] gap-4 px-6 py-5 sm:px-7 sm:py-6"
      >
        <DialogHeader className="gap-2.5 text-left">
          <div
            className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{
              color: "var(--text-tertiary)",
              borderColor:
                "color-mix(in srgb, var(--material-floating-border) 82%, rgba(255,255,255,0.1))",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
            }}
          >
            Confirm
          </div>
          <DialogTitle>{options?.title ?? "请确认"}</DialogTitle>
          {options?.description ? (
            <DialogDescription className="max-w-[34rem]">
              {options.description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="mt-1 gap-2 pt-1 sm:gap-2">
          <Button variant="glass" surface="floating" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={isDestructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
