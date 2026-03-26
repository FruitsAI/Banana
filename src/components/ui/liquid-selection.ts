"use client";

import type { CSSProperties } from "react";
import { getMaterialSurfaceStyle, type MaterialDepth } from "@/components/ui/material-surface";

type LiquidSelectionInactiveRole = "content" | "floating";

interface LiquidSelectionStyleOptions {
  active: boolean;
  depth?: MaterialDepth;
  inactiveRole?: LiquidSelectionInactiveRole;
  activeFill?: string;
  inactiveFill?: string;
  activeBorderColor?: string;
  inactiveBorderColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
}

const DEFAULT_INACTIVE_FILLS: Record<LiquidSelectionInactiveRole, string> = {
  content:
    "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
  floating:
    "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
};

const DEFAULT_INACTIVE_TEXT_COLORS: Record<LiquidSelectionInactiveRole, string> = {
  content: "var(--text-primary)",
  floating: "var(--text-secondary)",
};

export const LIQUID_SELECTION_STYLE = "liquid-accent";
const LIQUID_SELECTION_SHADOW =
  "var(--liquid-selection-shadow, var(--liquid-selection-rest-shadow, var(--liquid-surface-shadow, var(--liquid-material-base-shadow))))";

export function getLiquidSelectionStyle({
  active,
  depth = "sm",
  inactiveRole = "content",
  activeFill = "var(--selection-active-fill)",
  inactiveFill,
  activeBorderColor = "var(--selection-active-border)",
  inactiveBorderColor,
  activeTextColor = "var(--selection-active-foreground, var(--brand-primary))",
  inactiveTextColor,
}: LiquidSelectionStyleOptions): CSSProperties {
  if (active) {
    return {
      ...getMaterialSurfaceStyle("accent", depth),
      ["--liquid-selection-rest-shadow" as string]: "var(--selection-active-shadow, var(--liquid-material-base-shadow))",
      ["--liquid-selection-hover-shadow" as string]: "var(--selection-active-shadow, var(--liquid-material-base-shadow))",
      background: activeFill,
      borderColor: activeBorderColor,
      boxShadow: LIQUID_SELECTION_SHADOW,
      color: activeTextColor,
    };
  }

  return {
    ...getMaterialSurfaceStyle(inactiveRole, depth),
    ["--liquid-selection-rest-shadow" as string]: "var(--liquid-material-rest-shadow)",
    ["--liquid-selection-hover-shadow" as string]: "var(--liquid-material-base-shadow)",
    background: inactiveFill ?? DEFAULT_INACTIVE_FILLS[inactiveRole],
    borderColor: inactiveBorderColor ?? `var(--material-${inactiveRole}-border)`,
    boxShadow: LIQUID_SELECTION_SHADOW,
    color: inactiveTextColor ?? DEFAULT_INACTIVE_TEXT_COLORS[inactiveRole],
  };
}

export function getLiquidSelectionState(active: boolean) {
  return active ? LIQUID_SELECTION_STYLE : "idle";
}
