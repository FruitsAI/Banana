import type { CSSProperties } from "react";

export type MaterialRole = "chrome" | "content" | "floating" | "accent";
export type MaterialDepth = "sm" | "md" | "lg";

const MATERIAL_OPTICS: Record<
  MaterialRole,
  {
    blur: number;
    saturate: number;
    brightness: number;
  }
> = {
  chrome: { blur: 26, saturate: 150, brightness: 1.02 },
  content: { blur: 22, saturate: 160, brightness: 1.01 },
  floating: { blur: 30, saturate: 185, brightness: 1.03 },
  accent: { blur: 18, saturate: 170, brightness: 1.02 },
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
  const optics = MATERIAL_OPTICS[role];
  const backdropFilter = `var(--liquid-surface-backdrop-filter, blur(calc(${optics.blur}px + var(--liquid-surface-blur-boost, 0px))) saturate(calc(${optics.saturate}% + var(--liquid-surface-saturate-boost, 0%))) brightness(calc(${optics.brightness} + var(--liquid-surface-brightness-boost, 0))))`;
  const surfaceBackground = [
    "radial-gradient(140% 120% at var(--liquid-pointer-x, 50%) var(--liquid-pointer-y, 22%), rgba(255,255,255,calc(0.08 + var(--liquid-pointer-presence, 0) * 0.3)) 0%, rgba(255,255,255,calc(0.02 + var(--liquid-surface-ambient-opacity, 0.22) * 0.12)) 22%, transparent 58%)",
    "linear-gradient(180deg, rgba(255,255,255,calc(0.1 + var(--liquid-clarity-strength, 0.12) * 0.24)) 0%, rgba(255,255,255,calc(0.02 + var(--liquid-clarity-strength, 0.12) * 0.12)) 100%)",
    `var(--liquid-surface-fill, var(--material-${role}-background))`,
  ].join(", ");

  return {
    ["--liquid-material-base-background" as string]: `var(--material-${role}-background)`,
    ["--liquid-material-base-border" as string]: `var(--material-${role}-border)`,
    ["--liquid-material-base-shadow" as string]: MATERIAL_SHADOWS[role][depth],
    background: `var(--liquid-surface-background, ${surfaceBackground})`,
    borderColor: `var(--liquid-material-base-border)`,
    boxShadow: `var(--liquid-material-base-shadow)`,
    backdropFilter,
    WebkitBackdropFilter: backdropFilter,
  };
}
