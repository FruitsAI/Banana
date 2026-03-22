"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  getMaterialSurfaceStyle,
  type MaterialRole,
} from "@/components/ui/material-surface";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  containerClassName?: string;
  surface?: Exclude<MaterialRole, "accent">;
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 overflow-hidden border px-3.5 py-2.5 rounded-[20px] transition-all duration-200",
        containerClassName
      )}
      data-field-surface={surface}
      data-focus-state={isFocused ? "focused" : "idle"}
      data-search-input="true"
      data-material-role={surface}
      data-iridescent="false"
      style={{
        ...getMaterialSurfaceStyle(surface, surface === "floating" ? "md" : "sm"),
        background:
          surface === "floating"
            ? "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)"
            : "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
        borderColor: isFocused
          ? "var(--material-accent-border)"
          : `var(--material-${surface}-border)`,
        boxShadow: isFocused
          ? "0 0 0 3px var(--brand-primary-light), 0 14px 32px rgba(15, 23, 42, 0.08)"
          : undefined,
      }}
    >
      <HugeiconsIcon
        icon={Search01Icon}
        size={16}
        className="flex-shrink-0"
        color="var(--text-tertiary)"
      />
      <input
        type="text"
        className={cn(
          "flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-placeholder)]",
          className
        )}
        style={{ color: "var(--text-primary)" }}
        spellCheck={spellCheck}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </div>
  );
}
