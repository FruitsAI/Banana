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
import { Select } from "@/components/ui/select";

const PROVIDER_TYPE_OPTIONS = [
  { label: "OpenAI", value: "openai" },
  { label: "OpenAI-Response", value: "openai-response" },
  { label: "Gemini", value: "gemini" },
  { label: "Anthropic", value: "anthropic" },
  { label: "New API", value: "new-api" },
  { label: "Ollama", value: "ollama" },
] as const;

export type ProviderType = (typeof PROVIDER_TYPE_OPTIONS)[number]["value"];

export interface AddProviderFormValues {
  providerName: string;
  providerType: ProviderType;
}

interface AddProviderDialogProps {
  disabled?: boolean;
  existingProviderNames: string[];
  onOpenChange: (open: boolean) => void;
  onSubmitProvider: (values: AddProviderFormValues) => Promise<void>;
  open: boolean;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "新增提供商失败，请稍后重试";
}

/**
 * AddProviderDialog 组件
 * @description 提供商录入弹窗，沿用模型弹窗的液态玻璃视觉与交互动效。
 */
export function AddProviderDialog({
  disabled = false,
  existingProviderNames,
  onOpenChange,
  onSubmitProvider,
  open,
}: AddProviderDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [providerName, setProviderName] = useState("");
  const [providerType, setProviderType] = useState<ProviderType>("openai");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const existingNameSet = useMemo(
    () => new Set(existingProviderNames.map((name) => name.trim().toLowerCase())),
    [existingProviderNames]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setProviderName("");
    setProviderType("openai");
    setErrorMessage(null);
  }, [open]);

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

    const normalizedName = providerName.trim();
    if (!normalizedName) {
      setErrorMessage("提供商名称为必填项");
      return;
    }

    if (existingNameSet.has(normalizedName.toLowerCase())) {
      setErrorMessage("该提供商名称已存在");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSubmitProvider({
        providerName: normalizedName,
        providerType,
      });
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewIcon = providerName.trim().charAt(0).toUpperCase() || "P";

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
                    添加提供商
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
                  Provider
                </span>
              </div>
              <DialogDescription
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                录入提供商信息后，将添加到左侧 Provider 列表。
              </DialogDescription>
            </DialogHeader>

            <div
              className="rounded-2xl border px-4 py-4"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--material-floating-background) 92%, transparent) 0%, color-mix(in srgb, var(--material-content-background) 94%, transparent) 100%)",
                borderColor: "var(--material-content-border)",
              }}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-tertiary)" }}>
                    Preview
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    将显示在 Provider 列表中
                  </div>
                </div>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl font-semibold"
                  style={{
                    background: "var(--material-floating-background)",
                    borderColor: "var(--material-content-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {previewIcon}
                </div>
              </div>

              <motion.div
                className="space-y-4"
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
                  className="space-y-2"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <Label className="text-[13px] font-semibold text-[var(--text-primary)]">
                    <span className="mr-1 text-[var(--danger)]">*</span>提供商名称
                  </Label>
                  <Input
                    autoFocus
                    value={providerName}
                    onChange={(event) => setProviderName(event.target.value)}
                    placeholder="例如 OpenAI"
                    className="h-10 text-sm md:text-sm"
                    surface="floating"
                  />
                </motion.div>

                <motion.div
                  className="space-y-2"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <Label className="text-[13px] font-semibold text-[var(--text-primary)]">
                    提供商类型
                  </Label>
                  <Select
                    aria-label="提供商类型"
                    value={providerType}
                    onValueChange={(nextValue) => setProviderType(nextValue as ProviderType)}
                    options={PROVIDER_TYPE_OPTIONS}
                  />
                </motion.div>
              </motion.div>
            </div>

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
                  disabled={disabled || isSubmitting || !providerName.trim()}
                >
                  {isSubmitting ? "添加中..." : "确定"}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
