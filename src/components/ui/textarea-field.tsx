"use client";

import * as React from "react";
import { FieldShell, type FieldSize, type FieldSurface } from "@/components/ui/field-shell";
import { cn } from "@/lib/utils";

interface TextareaFieldProps extends React.ComponentProps<"textarea"> {
  autoResize?: boolean;
  containerClassName?: string;
  invalid?: boolean;
  maxHeight?: number;
  minHeight?: number;
  size?: FieldSize;
  surface?: FieldSurface;
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    {
      autoResize = false,
      className,
      containerClassName,
      invalid = false,
      maxHeight,
      minHeight,
      onChange,
      onFocus,
      rows = 3,
      size = "md",
      style,
      surface = "content",
      value,
      ...props
    },
    ref,
  ) {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

    const syncHeight = React.useCallback(() => {
      if (!autoResize || !innerRef.current) {
        return;
      }

      innerRef.current.style.height = "auto";
      const nextHeight = innerRef.current.scrollHeight;
      const clampedHeight = maxHeight ? Math.min(nextHeight, maxHeight) : nextHeight;
      innerRef.current.style.height = `${clampedHeight}px`;
      innerRef.current.style.overflowY = maxHeight && nextHeight > maxHeight ? "auto" : "hidden";
    }, [autoResize, maxHeight]);

    React.useLayoutEffect(() => {
      syncHeight();
    }, [syncHeight, value]);

    return (
      <FieldShell
        className={cn("items-start", containerClassName)}
        contentClassName="items-stretch"
        invalid={invalid}
        size={size}
        surface={surface}
        tone="liquid-textarea-field"
      >
        <textarea
          ref={innerRef}
          data-slot="textarea-field"
          data-surface-tone="liquid-textarea-field"
          rows={rows}
          value={value}
          className={cn(
            "custom-scroll w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 outline-none placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)]",
            className,
          )}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          style={{
            minHeight,
            maxHeight,
            ...style,
          }}
          onChange={(event) => {
            syncHeight();
            onChange?.(event);
          }}
          onFocus={(event) => {
            syncHeight();
            onFocus?.(event);
          }}
          {...props}
        />
      </FieldShell>
    );
  },
);
