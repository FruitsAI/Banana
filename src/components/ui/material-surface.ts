import type { CSSProperties } from "react";

export type MaterialRole = "chrome" | "content" | "floating" | "accent";
export type MaterialDepth = "sm" | "md" | "lg";

const MATERIAL_BLUR: Record<MaterialRole, string> = {
  chrome: "blur(26px) saturate(150%) brightness(1.02)",
  content: "blur(22px) saturate(160%) brightness(1.01)",
  floating: "blur(30px) saturate(185%) brightness(1.03)",
  accent: "blur(18px) saturate(170%) brightness(1.02)",
};

const MATERIAL_SHADOWS: Record<MaterialRole, Record<MaterialDepth, string>> = {
  chrome: {
    sm: "0 10px 24px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.32)",
    md: "0 18px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.36)",
    lg: "0 26px 56px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
  },
  content: {
    sm: "0 8px 22px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.4)",
    md: "0 16px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.46)",
    lg: "0 24px 56px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255,255,255,0.52)",
  },
  floating: {
    sm: "0 12px 32px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
    md: "0 22px 54px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.56)",
    lg: "0 34px 72px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255,255,255,0.62)",
  },
  accent: {
    sm: "0 8px 20px rgba(59, 130, 246, 0.16), inset 0 1px 0 rgba(255,255,255,0.5)",
    md: "0 16px 36px rgba(59, 130, 246, 0.22), inset 0 1px 0 rgba(255,255,255,0.56)",
    lg: "0 24px 52px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.62)",
  },
};

export function getMaterialSurfaceStyle(
  role: MaterialRole,
  depth: MaterialDepth = "md",
): CSSProperties {
  const backdropFilter = MATERIAL_BLUR[role];

  return {
    background: `var(--material-${role}-background)`,
    borderColor: `var(--material-${role}-border)`,
    boxShadow: MATERIAL_SHADOWS[role][depth],
    backdropFilter,
    WebkitBackdropFilter: backdropFilter,
  };
}
