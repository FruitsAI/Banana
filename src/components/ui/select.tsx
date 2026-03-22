"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { cn } from "@/lib/utils";

export interface SelectOption<Value extends string = string> {
  label: string;
  value: Value;
  description?: string;
}

interface SelectProps<Value extends string = string> {
  "aria-label": string;
  value: Value;
  onValueChange: (value: Value) => void;
  options: ReadonlyArray<SelectOption<Value>>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Select<Value extends string = string>({
  "aria-label": ariaLabel,
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  className,
  contentClassName,
}: SelectProps<Value>) {
  const [open, setOpen] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(nextOpen) => {
        if (disabled) {
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          data-liquid-interactive="true"
          className={cn(
            "group/select relative flex h-11 w-full items-center justify-between overflow-hidden rounded-[22px] border px-4 text-left transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary-light)] disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
          data-surface-tone="liquid-select-trigger"
          data-material-role="floating"
          data-hover-surface="floating"
          style={{
            ...getMaterialSurfaceStyle("floating", "md"),
            ["--liquid-surface-fill" as string]:
              "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--liquid-material-base-background)",
            color: "var(--text-primary)",
          }}
        >
          <span
            className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-70"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 16%, rgba(255,255,255,0.16) 84%, transparent 100%)",
            }}
          />
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/select:opacity-100 group-focus-visible/select:opacity-100"
            aria-hidden="true"
            style={{
              background: "radial-gradient(circle at top left, rgba(255,255,255,0.12), transparent 34%)",
            }}
          />
          <span className="relative z-10 min-w-0 flex-1 truncate text-sm">
            {selectedOption?.label ?? placeholder ?? ""}
          </span>
          <motion.span
            className="relative z-10 ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full border"
            aria-hidden="true"
            animate={shouldReduceMotion ? undefined : { rotate: open ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            style={{
              background: "color-mix(in srgb, var(--material-floating-background) 92%, transparent)",
              borderColor: "var(--material-content-border)",
              color: "var(--text-tertiary)",
            }}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
          </motion.span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={10}
        className={cn("w-[var(--radix-popover-trigger-width)] min-w-[14rem] p-2", contentClassName)}
      >
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="space-y-1"
          data-surface-tone="liquid-select-content"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-liquid-interactive="true"
                className="group/option relative flex w-full items-center justify-between rounded-[18px] border px-3 py-2.5 text-left transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out hover:-translate-y-px"
                data-surface-tone={isSelected ? "liquid-select-option-active" : "liquid-select-option"}
                data-material-role={isSelected ? "accent" : "floating"}
                data-hover-surface={isSelected ? "accent" : "floating"}
                style={{
                  ...getMaterialSurfaceStyle(isSelected ? "accent" : "floating", "sm"),
                  ["--liquid-surface-fill" as string]: isSelected
                    ? "linear-gradient(180deg, rgba(59,130,246,0.18) 0%, rgba(255,255,255,0.08) 100%), var(--material-accent-background)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--material-floating-background)",
                  borderColor: isSelected
                    ? "var(--material-accent-border)"
                    : "var(--material-floating-border)",
                  color: isSelected ? "var(--brand-primary)" : "var(--text-primary)",
                }}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{option.label}</span>
                  {option.description ? (
                    <span
                      className="mt-0.5 block truncate text-xs leading-5"
                      style={{ color: isSelected ? "var(--brand-primary)" : "var(--text-tertiary)" }}
                    >
                      {option.description}
                    </span>
                  ) : null}
                </span>
                <AnimatePresence initial={false}>
                  {isSelected ? (
                    <motion.span
                      initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                      className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full border"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0.78) 100%)",
                        borderColor: "rgba(255,255,255,0.32)",
                        color: "#fff",
                        boxShadow: "0 10px 22px rgba(59,130,246,0.22)",
                      }}
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={12} color="currentColor" />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
