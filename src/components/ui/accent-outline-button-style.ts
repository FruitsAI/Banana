import type { CSSProperties } from "react";
import {
  getMaterialSurfaceStyle,
  type MaterialDepth,
} from "@/components/ui/material-surface";

export function getAccentOutlineButtonStyle(depth: MaterialDepth = "sm"): CSSProperties {
  return {
    ...getMaterialSurfaceStyle("floating", depth),
    ["--liquid-surface-fill" as string]:
      "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--liquid-material-base-background)",
    borderColor:
      "var(--selection-active-list-border, var(--selection-active-border, var(--brand-primary-border)))",
    color: "var(--brand-primary)",
    boxShadow:
      "var(--selection-active-list-shadow, var(--selection-active-shadow, var(--liquid-material-rest-shadow)))",
  };
}
