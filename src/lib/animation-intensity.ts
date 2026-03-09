export type AnimationIntensity = "low" | "medium" | "high";

export const ANIMATION_INTENSITY_CONFIG_KEY = "animation_intensity";
export const DEFAULT_ANIMATION_INTENSITY: AnimationIntensity = "medium";

export interface MotionFactors {
  duration: number;
  distance: number;
  scale: number;
}

export function normalizeAnimationIntensity(
  value: string | null | undefined
): AnimationIntensity {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return DEFAULT_ANIMATION_INTENSITY;
}

export function getMotionFactors(intensity: AnimationIntensity): MotionFactors {
  switch (intensity) {
    case "low":
      return { duration: 0.82, distance: 0.55, scale: 0.6 };
    case "high":
      return { duration: 1.18, distance: 1.25, scale: 1.3 };
    case "medium":
    default:
      return { duration: 1, distance: 1, scale: 1 };
  }
}

