"use client";

import * as React from "react";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { IridescentBorder } from "@/components/ui/iridescent-border";
import {
  getMaterialSurfaceStyle,
  type MaterialRole,
} from "@/components/ui/material-surface";
import { cn } from "@/lib/utils";

export type FieldSurface = Extract<MaterialRole, "content" | "floating">;
export type FieldSize = "sm" | "md" | "lg";

interface FieldShellStyleOptions {
  focused?: boolean;
  invalid?: boolean;
  surface?: FieldSurface;
  size?: FieldSize;
}

interface FieldShellProps extends React.HTMLAttributes<HTMLDivElement> {
  contentClassName?: string;
  disabled?: boolean;
  invalid?: boolean;
  iridescent?: boolean;
  iridescentAnimated?: boolean;
  leading?: React.ReactNode;
  size?: FieldSize;
  surface?: FieldSurface;
  tone?: string;
  trailing?: React.ReactNode;
}

const FIELD_SIZE_CLASSES: Record<FieldSize, string> = {
  sm: "min-h-10 rounded-[20px] px-3 py-2 gap-2",
  md: "min-h-11 rounded-[22px] px-4 py-2.5 gap-2.5",
  lg: "min-h-14 rounded-[28px] px-4 py-3 gap-3",
};

const FIELD_FILLS: Record<FieldSurface, string> = {
  content:
    "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
  floating:
    "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
};

export function getFieldShellStyle({
  focused = false,
  invalid = false,
  surface = "content",
  size = "md",
}: FieldShellStyleOptions): React.CSSProperties {
  const depth = surface === "floating" || size === "lg" ? "md" : "sm";

  return {
    ...getMaterialSurfaceStyle(surface, depth),
    ["--liquid-surface-fill" as string]: FIELD_FILLS[surface],
    borderColor: invalid
      ? "color-mix(in srgb, var(--danger) 52%, var(--material-content-border))"
      : focused
        ? "var(--material-accent-border)"
        : `var(--material-${surface}-border)`,
    boxShadow: invalid
      ? "0 0 0 3px color-mix(in srgb, var(--danger) 18%, transparent), var(--liquid-material-base-shadow)"
      : focused
        ? "0 0 0 3px var(--brand-primary-light), var(--liquid-material-base-shadow)"
        : "var(--liquid-material-rest-shadow)",
  };
}

export function FieldShell({
  children,
  className,
  contentClassName,
  disabled = false,
  invalid = false,
  iridescent = false,
  iridescentAnimated = false,
  leading,
  onBlurCapture,
  onFocusCapture,
  size = "md",
  style,
  surface = "content",
  tone = "liquid-field",
  trailing,
  ...props
}: FieldShellProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const { intensity } = useAnimationIntensity();
  const allowAnimatedIridescence = iridescent && iridescentAnimated && intensity !== "low";

  return (
    <div
      className={cn(
        "group/field relative flex min-w-0 items-center overflow-hidden border transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out",
        FIELD_SIZE_CLASSES[size],
        !disabled && "hover:-translate-y-px",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      data-field-shell="true"
      data-focus-state={isFocused ? "focused" : "idle"}
      data-iridescent={String(iridescent)}
      data-iridescent-animated={String(allowAnimatedIridescence)}
      data-liquid-interactive={disabled ? undefined : "true"}
      data-material-role={surface}
      data-surface-tone={tone}
      onBlurCapture={(event) => {
        onBlurCapture?.(event);
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
          return;
        }
        setIsFocused(false);
      }}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        setIsFocused(true);
      }}
      style={{
        ...getFieldShellStyle({
          focused: isFocused,
          invalid,
          surface,
          size,
        }),
        ...style,
      }}
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-75"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.74) 18%, rgba(255,255,255,0.16) 84%, transparent 100%)",
        }}
      />
      {leading ? (
        <span className="relative z-10 inline-flex shrink-0 items-center justify-center">
          {leading}
        </span>
      ) : null}
      <div className={cn("relative z-10 flex min-w-0 flex-1 items-center", contentClassName)}>
        {children}
      </div>
      {trailing ? (
        <span className="relative z-10 inline-flex shrink-0 items-center justify-center">
          {trailing}
        </span>
      ) : null}
      {iridescent ? (
        <IridescentBorder
          className="opacity-0 transition-opacity duration-300 group-focus-within/field:opacity-100"
          animated={allowAnimatedIridescence}
        />
      ) : null}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/field:opacity-100 group-focus-within/field:opacity-100"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.14), transparent 34%)",
        }}
      />
    </div>
  );
}
