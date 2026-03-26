import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";

export type MessageSurfaceVariant = "assistant" | "user" | "reasoning" | "tool";
export type MessageSurfaceState = "default" | "editing";

interface MessageSurfaceProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  variant: MessageSurfaceVariant;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  state?: MessageSurfaceState;
}

function getVariantStyle(variant: MessageSurfaceVariant): CSSProperties {
  switch (variant) {
    case "assistant":
      return {
        ...getMaterialSurfaceStyle("content", "sm"),
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.12) 100%), var(--material-content-background)",
        border: "1px solid var(--material-content-border)",
        boxShadow:
          "0 16px 34px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.42)",
      };
    case "user":
      return {
        ...getMaterialSurfaceStyle("accent", "sm"),
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.1) 100%), var(--material-accent-background)",
        border: "1px solid var(--material-accent-border)",
        boxShadow:
          "0 16px 34px rgba(59, 130, 246, 0.16), inset 0 1px 0 rgba(255,255,255,0.42)",
      };
    case "reasoning":
      return {
        ...getMaterialSurfaceStyle("content", "sm"),
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%), var(--material-content-background)",
        border: "1px solid color-mix(in srgb, var(--material-content-border) 82%, rgba(255,255,255,0.32))",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.28)",
      };
    case "tool":
      return {
        ...getMaterialSurfaceStyle("content", "sm"),
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%), var(--material-content-background)",
        border: "1px solid color-mix(in srgb, var(--material-content-border) 84%, rgba(255,255,255,0.28))",
        boxShadow: "0 10px 22px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.26)",
      };
  }
}

export function MessageSurface({
  variant,
  children,
  className,
  style,
  state = "default",
  ...props
}: MessageSurfaceProps) {
  const variantStyle = getVariantStyle(variant);

  return (
    <div
      className={cn("relative overflow-hidden border", className)}
      data-message-surface="true"
      data-message-family="liquid-glass"
      data-message-variant={variant}
      data-material-role={variant === "user" ? "accent" : "content"}
      data-surface-state={state}
      {...props}
      style={{
        color: "var(--text-primary)",
        lineHeight: 1.6,
        backdropFilter: "blur(var(--blur-md)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--blur-md)) saturate(180%)",
        transition: "background 220ms ease, border-color 220ms ease, box-shadow 260ms ease",
        ...variantStyle,
        ...(state === "editing"
          ? {
              border: "1.5px solid var(--brand-primary)",
              boxShadow: "0 0 0 3px var(--brand-primary-light), 0 22px 52px rgba(15, 23, 42, 0.16)",
            }
          : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
