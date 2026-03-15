import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  containerClassName?: string;
}

export function SearchInput({
  containerClassName,
  className,
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
        "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200",
        containerClassName
      )}
      style={{
        background: "var(--glass-surface)",
        borderColor: isFocused ? "var(--brand-primary)" : "var(--glass-border)",
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
