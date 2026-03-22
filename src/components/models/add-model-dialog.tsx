"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AddModelFormValues {
  groupName: string;
  modelId: string;
  modelName: string;
}

type AddModelDialogMode = "create" | "edit";

interface AddModelDialogProps {
  disabled?: boolean;
  excludeModelId?: string | null;
  existingModelIds: string[];
  initialValues?: Partial<AddModelFormValues>;
  mode?: AddModelDialogMode;
  onOpenChange: (open: boolean) => void;
  onSubmitModel: (values: AddModelFormValues) => Promise<void>;
  open: boolean;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "新增模型失败，请稍后重试";
}

function getDefaultGroupNameFromModelId(modelId: string): string {
  const normalizedModelId = modelId.trim();
  if (!normalizedModelId) {
    return "";
  }

  const segments = normalizedModelId.split("-").filter(Boolean);
  if (segments.length <= 1) {
    return normalizedModelId;
  }

  return segments.slice(0, -1).join("-");
}

/**
 * AddModelDialog 组件
 * @description 模型录入弹窗，全局复用，内置校验与提交交互。
 */
export function AddModelDialog({
  disabled = false,
  excludeModelId = null,
  existingModelIds,
  initialValues,
  mode = "create",
  onOpenChange,
  onSubmitModel,
  open,
}: AddModelDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isModelNameEdited, setIsModelNameEdited] = useState(false);
  const [isGroupNameEdited, setIsGroupNameEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const excludedId = (excludeModelId ?? "").trim().toLowerCase();

  const existingIdSet = useMemo(
    () =>
      new Set(
        existingModelIds
          .map((id) => id.trim().toLowerCase())
          .filter((id) => id !== excludedId)
      ),
    [excludedId, existingModelIds]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialModelId = initialValues?.modelId?.trim() ?? "";
    const initialModelName = initialValues?.modelName?.trim() ?? initialModelId;
    const initialGroupName =
      initialValues?.groupName?.trim() ?? getDefaultGroupNameFromModelId(initialModelId);

    setModelId(initialModelId);
    setModelName(initialModelName);
    setGroupName(initialGroupName);
    setIsModelNameEdited(false);
    setIsGroupNameEdited(false);
    setErrorMessage(null);
  }, [initialValues, open]);

  const dialogTitle = mode === "edit" ? "修改模型" : "添加模型";
  const dialogDescription =
    mode === "edit"
      ? "修改模型 ID、模型名称和分组名称后，将保存到当前 Provider。"
      : "录入模型 ID、模型名称和分组名称后，将保存到当前 Provider。";
  const submitIdleText = mode === "edit" ? "保存修改" : "添加模型";
  const submitBusyText = mode === "edit" ? "保存中..." : "添加中...";

  function handleDialogOpenChange(nextOpen: boolean): void {
    if (isSubmitting) {
      return;
    }
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setErrorMessage(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (disabled || isSubmitting) {
      return;
    }

    const normalizedModelId = modelId.trim();
    if (!normalizedModelId) {
      setErrorMessage("模型 ID 为必填项");
      return;
    }

    if (existingIdSet.has(normalizedModelId.toLowerCase())) {
      setErrorMessage("该模型 ID 已存在");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSubmitModel({
        modelId: normalizedModelId,
        modelName: modelName.trim(),
        groupName: groupName.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleModelIdChange(nextModelId: string): void {
    setModelId(nextModelId);
    if (!isModelNameEdited) {
      setModelName(nextModelId);
    }
    if (!isGroupNameEdited) {
      setGroupName(getDefaultGroupNameFromModelId(nextModelId));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={!isSubmitting}
        className="max-w-2xl overflow-hidden border-0 bg-transparent p-0 shadow-none"
      >
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.985, y: 14 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 260, damping: 24, mass: 0.8 }
          }
          className="relative rounded-2xl border"
          style={{
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--material-floating-background) 96%, transparent) 0%, color-mix(in srgb, var(--material-content-background) 94%, transparent) 100%)",
            borderColor: "var(--material-content-border)",
            boxShadow: "0 22px 54px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.42)",
            backdropFilter: "blur(24px) saturate(190%)",
            WebkitBackdropFilter: "blur(24px) saturate(190%)",
          }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full"
            style={{
              background: "radial-gradient(circle, var(--brand-primary-glow) 0%, transparent 74%)",
              filter: "blur(8px)",
            }}
            animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={prefersReducedMotion ? undefined : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          />

          <form className="relative space-y-6 px-6 pb-5 pt-6" onSubmit={(event) => void handleSubmit(event)}>
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border"
                    style={{
                      background: "var(--material-floating-background)",
                      borderColor: "var(--material-content-border)",
                      color: "var(--brand-primary)",
                    }}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={15} />
                  </span>
                  <DialogTitle className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                    {dialogTitle}
                  </DialogTitle>
                </div>
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    background: "var(--material-floating-background)",
                    borderColor: "var(--material-content-border)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  Model
                </span>
              </div>
              <DialogDescription
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {dialogDescription}
              </DialogDescription>
            </DialogHeader>

            <motion.div
              className="space-y-4 rounded-2xl border px-4 py-4"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--material-floating-background) 92%, transparent) 0%, color-mix(in srgb, var(--material-content-background) 94%, transparent) 100%)",
                borderColor: "var(--material-content-border)",
              }}
              initial={prefersReducedMotion ? false : "hidden"}
              animate={prefersReducedMotion ? undefined : "visible"}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.04,
                  },
                },
              }}
            >
              <motion.div
                className="grid grid-cols-[112px_1fr] items-center gap-4"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  <span className="mr-1 text-[var(--danger)]">*</span>模型 ID
                </Label>
                <Input
                  autoFocus
                  value={modelId}
                  onChange={(event) => handleModelIdChange(event.target.value)}
                  placeholder="必填，例如 gpt-4o-mini"
                  className="h-10 text-sm md:text-sm"
                  surface="floating"
                />
              </motion.div>

              <motion.div
                className="grid grid-cols-[112px_1fr] items-center gap-4"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  模型名称
                </Label>
                <Input
                  value={modelName}
                  onChange={(event) => {
                    setIsModelNameEdited(true);
                    setModelName(event.target.value);
                  }}
                  placeholder="例如 GPT-4o Mini"
                  className="h-10 text-sm md:text-sm"
                  surface="floating"
                />
              </motion.div>

              <motion.div
                className="grid grid-cols-[112px_1fr] items-center gap-4"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  分组名称
                </Label>
                <Input
                  value={groupName}
                  onChange={(event) => {
                    setIsGroupNameEdited(true);
                    setGroupName(event.target.value);
                  }}
                  placeholder="例如 OpenAI"
                  className="h-10 text-sm md:text-sm"
                  surface="floating"
                />
              </motion.div>
            </motion.div>

            {errorMessage ? (
              <p className="text-xs font-medium text-[var(--danger)]">{errorMessage}</p>
            ) : null}

            <DialogFooter
              className="border-t pt-4 sm:justify-end"
              style={{ borderColor: "var(--divider)" }}
            >
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl px-4 text-xs"
                  surface="floating"
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
              </motion.div>

              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{ type: "spring", stiffness: 420, damping: 19 }}
              >
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 rounded-xl px-4 text-xs"
                  disabled={disabled || isSubmitting || !modelId.trim()}
                >
                  {isSubmitting ? submitBusyText : submitIdleText}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
