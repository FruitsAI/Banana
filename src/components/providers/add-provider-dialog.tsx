"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
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
            background: "linear-gradient(145deg, var(--glass-overlay), var(--glass-surface))",
            borderColor: "var(--glass-border-strong)",
            boxShadow: "0 16px 48px var(--brand-primary-light)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border"
                  style={{
                    background: "var(--glass-subtle)",
                    borderColor: "var(--glass-border)",
                    color: "var(--brand-primary)",
                  }}
                >
                  <HugeiconsIcon icon={Add01Icon} size={15} />
                </span>
                <DialogTitle className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  添加提供商
                </DialogTitle>
              </div>
              <DialogDescription
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                录入提供商信息后，将添加到左侧 Provider 列表。
              </DialogDescription>
            </DialogHeader>

            <div className="border-t pt-5" style={{ borderColor: "var(--divider)" }}>
              <div
                className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border text-6xl font-semibold"
                style={{
                  background: "var(--glass-subtle)",
                  borderColor: "var(--glass-border)",
                  color: "var(--text-primary)",
                }}
              >
                {previewIcon}
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
                  <div className="relative">
                    <select
                      value={providerType}
                      onChange={(event) => setProviderType(event.target.value as ProviderType)}
                      className="h-10 w-full appearance-none rounded-xl border px-4 pr-10 text-sm transition-[border-color,box-shadow] duration-200 focus-visible:outline-none"
                      style={{
                        borderColor: "var(--glass-border)",
                        background: "var(--glass-surface)",
                        color: "var(--text-primary)",
                        boxShadow: "0 0 0 0 transparent",
                      }}
                    >
                      {PROVIDER_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {errorMessage ? (
              <p className="text-xs font-medium text-[var(--danger)]">{errorMessage}</p>
            ) : null}

            <DialogFooter className="pt-1 sm:justify-end">
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

