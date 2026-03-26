"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { FieldShell, type FieldSurface } from "@/components/ui/field-shell";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  containerClassName?: string;
  surface?: FieldSurface;
}

export function SearchInput({
  containerClassName,
  className,
  surface = "content",
  onFocus,
  onBlur,
  spellCheck = false,
  autoComplete = "off",
  autoCorrect = "off",
  ...props
}: SearchInputProps) {
  return (
    <FieldShell
      className={containerClassName}
      data-field-surface={surface}
      data-search-input="true"
      leading={
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="flex-shrink-0"
          color="var(--icon-muted)"
        />
      }
      surface={surface}
      tone="liquid-search-field"
    >
      <input
        type="text"
        className={cn(
          "h-full flex-1 bg-transparent p-0 text-sm outline-none placeholder:text-[var(--text-placeholder)]",
          className
        )}
        style={{ color: "var(--text-primary)" }}
        spellCheck={spellCheck}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
    </FieldShell>
  );
}
