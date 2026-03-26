import type { MaterialRole } from "@/components/ui/material-surface";

export type LiquidGlassMotionLevel = "low" | "medium" | "high";
export type LiquidGlassSurfaceClarity = "standard" | "high";

export interface LiquidGlassViewportState {
  width: number;
  height: number;
  scrollVelocity: number;
}

export interface LiquidGlassPointerState {
  x: number;
  y: number;
  active: boolean;
}

export interface LiquidGlassRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LiquidGlassAmbientState {
  focusXPercent: number;
  focusYPercent: number;
  offsetX: number;
  offsetY: number;
  energy: number;
}

export interface LiquidGlassSurfaceState {
  pointerXPercent: number;
  pointerYPercent: number;
  pointerPresence: number;
  clarityStrength: number;
  blurBoostPx: number;
  saturateBoostPercent: number;
  brightnessBoost: number;
  ambientOpacity: number;
  rippleOpacity: number;
}

const MOTION_MULTIPLIER: Record<LiquidGlassMotionLevel, number> = {
  low: 0.78,
  medium: 1,
  high: 1.18,
};

const ROLE_WEIGHT: Record<MaterialRole, number> = {
  chrome: 0.72,
  content: 0.84,
  floating: 1,
  accent: 0.92,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision = 3) {
  return Number(value.toFixed(precision));
}

function resolvePointerInfluence(rect: LiquidGlassRect, pointer: LiquidGlassPointerState) {
  if (!pointer.active) {
    return {
      xPercent: 50,
      yPercent: 22,
      presence: 0,
    };
  }

  const safeWidth = Math.max(rect.width, 1);
  const safeHeight = Math.max(rect.height, 1);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = pointer.x - centerX;
  const dy = pointer.y - centerY;
  const influenceRadius = Math.max(rect.width, rect.height) * 0.95 + 120;
  const distance = Math.hypot(dx, dy);

  return {
    xPercent: clamp(((pointer.x - rect.left) / safeWidth) * 100, 8, 92),
    yPercent: clamp(((pointer.y - rect.top) / safeHeight) * 100, 8, 92),
    presence: clamp(1 - distance / influenceRadius, 0, 1),
  };
}

export function resolveLiquidGlassAmbientState({
  viewport,
  pointer,
  motionLevel,
}: {
  viewport: LiquidGlassViewportState;
  pointer: LiquidGlassPointerState;
  motionLevel: LiquidGlassMotionLevel;
}): LiquidGlassAmbientState {
  const motionMultiplier = MOTION_MULTIPLIER[motionLevel];
  const normalizedX = pointer.active ? clamp(pointer.x / Math.max(viewport.width, 1), 0, 1) : 0.5;
  const normalizedY = pointer.active ? clamp(pointer.y / Math.max(viewport.height, 1), 0, 1) : 0.18;
  const edgeEnergy =
    Math.abs(normalizedX - 0.5) * 0.18 + Math.abs(normalizedY - 0.34) * 0.1;

  return {
    focusXPercent: round(normalizedX * 100, 2),
    focusYPercent: round(normalizedY * 100, 2),
    offsetX: round((normalizedX - 0.5) * 64 * motionMultiplier, 2),
    offsetY: round((normalizedY - 0.32) * 46 * motionMultiplier, 2),
    energy: round(
      clamp(
        0.1 + viewport.scrollVelocity * 0.26 + edgeEnergy + (pointer.active ? 0.06 : 0),
        motionLevel === "low" ? 0.08 : 0.12,
        motionLevel === "high" ? 0.48 : 0.36,
      ),
    ),
  };
}

export function resolveLiquidGlassSurfaceState({
  role,
  clarity,
  motionLevel,
  viewport,
  pointer,
  rect,
}: {
  role: MaterialRole;
  clarity: LiquidGlassSurfaceClarity;
  motionLevel: LiquidGlassMotionLevel;
  viewport: LiquidGlassViewportState;
  pointer: LiquidGlassPointerState;
  rect: LiquidGlassRect;
}): LiquidGlassSurfaceState {
  const motionMultiplier = MOTION_MULTIPLIER[motionLevel];
  const pointerInfluence = resolvePointerInfluence(rect, pointer);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const focusTargetX = viewport.width / 2;
  const focusTargetY = viewport.height * 0.42;
  const focusDistance = Math.hypot(centerX - focusTargetX, centerY - focusTargetY);
  const maxFocusDistance = Math.hypot(viewport.width / 2, viewport.height * 0.62);
  const focusPresence = 1 - clamp(focusDistance / Math.max(maxFocusDistance, 1), 0, 1);
  const topEdgeAffinity = 1 - clamp(centerY / Math.max(viewport.height * 0.92, 1), 0, 1);
  const clarityBase = clarity === "high" ? 0.2 : 0.11;
  const roleWeight = ROLE_WEIGHT[role];
  const clarityStrength = clamp(
    clarityBase +
      focusPresence * 0.12 +
      topEdgeAffinity * 0.06 +
      viewport.scrollVelocity * 0.08 +
      pointerInfluence.presence * 0.07 +
      roleWeight * 0.03,
    clarity === "high" ? 0.18 : 0.08,
    clarity === "high" ? 0.42 : 0.3,
  );

  return {
    pointerXPercent: round(pointerInfluence.xPercent, 2),
    pointerYPercent: round(pointerInfluence.yPercent, 2),
    pointerPresence: round(pointerInfluence.presence),
    clarityStrength: round(clarityStrength),
    blurBoostPx: round((clarityStrength * 11 + pointerInfluence.presence * 4.6) * motionMultiplier, 2),
    saturateBoostPercent: round(
      (clarityStrength * 26 + pointerInfluence.presence * 12) * motionMultiplier,
      2,
    ),
    brightnessBoost: round(
      (clarityStrength * 0.11 + pointerInfluence.presence * 0.05) *
        (motionLevel === "low" ? 0.82 : 1),
    ),
    ambientOpacity: round(
      clamp(0.18 + clarityStrength * 0.52 + pointerInfluence.presence * 0.2, 0.14, 0.76),
    ),
    rippleOpacity: round(clarity === "high" ? 0.28 : 0.22),
  };
}

export function liquidGlassAmbientStateToCSSVariables(
  state: LiquidGlassAmbientState,
): Record<string, string> {
  return {
    "--liquid-ambient-focus-x": `${state.focusXPercent}%`,
    "--liquid-ambient-focus-y": `${state.focusYPercent}%`,
    "--liquid-ambient-offset-x": `${state.offsetX}px`,
    "--liquid-ambient-offset-y": `${state.offsetY}px`,
    "--liquid-ambient-energy": state.energy.toString(),
  };
}

export function liquidGlassSurfaceStateToCSSVariables(
  state: LiquidGlassSurfaceState,
): Record<string, string> {
  return {
    "--liquid-pointer-x": `${state.pointerXPercent}%`,
    "--liquid-pointer-y": `${state.pointerYPercent}%`,
    "--liquid-pointer-presence": state.pointerPresence.toString(),
    "--liquid-clarity-strength": state.clarityStrength.toString(),
    "--liquid-surface-blur-boost": `${state.blurBoostPx}px`,
    "--liquid-surface-saturate-boost": `${state.saturateBoostPercent}%`,
    "--liquid-surface-brightness-boost": state.brightnessBoost.toString(),
    "--liquid-surface-ambient-opacity": state.ambientOpacity.toString(),
    "--liquid-press-opacity": state.rippleOpacity.toString(),
  };
}

export function readLiquidGlassSurfaceClarity(
  clarityValue: string | undefined,
): LiquidGlassSurfaceClarity {
  return clarityValue === "high" ? "high" : "standard";
}
