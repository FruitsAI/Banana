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
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{options?.title ?? "请确认"}</DialogTitle>
          {options?.description ? (
            <DialogDescription>{options.description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

