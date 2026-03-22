import { describe, expect, it } from "vitest";
import { getMotionFactors, getMotionState } from "../animation-intensity";
import { createMotionPresets } from "../motion-presets";

function createMotionMath(intensity: "low" | "medium" | "high", reduced = false) {
  const factors = getMotionFactors(intensity);

  return {
    reduced,
    duration: (value: number) => Number((value * factors.duration).toFixed(3)),
    distance: (value: number) => Number((value * factors.distance).toFixed(3)),
    scale: (value: number) => Number((1 - (1 - value) * factors.scale).toFixed(3)),
    scaleFactor: factors.scale,
  };
}

describe("animation intensity", () => {
  it("disables continuous decorative loops in reduced motion mode", () => {
    expect(getMotionState("medium", true)).toMatchObject({
      reduced: true,
      decorativeLoops: false,
      decorativeLoopPlayState: "paused",
    });

    expect(getMotionState("low")).toMatchObject({
      reduced: true,
      decorativeLoops: false,
      decorativeLoopPlayState: "paused",
    });

    expect(getMotionState("medium")).toMatchObject({
      reduced: false,
      decorativeLoops: true,
      decorativeLoopPlayState: "running",
    });
  });

  it("returns stable motion presets for panel, hover, focus, selection, and accessory transitions", () => {
    const presets = createMotionPresets(createMotionMath("medium"));

    expect(presets.panel).toEqual({
      initial: { opacity: 0, y: 12, scale: 0.985 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
    });

    expect(presets.control).toEqual({
      hover: { y: -1.5, scale: 1.018 },
      tap: { scale: 0.97 },
      transition: { type: "spring", stiffness: 420, damping: 30, mass: 0.8 },
    });

    expect(presets.focus).toEqual({
      active: { scale: 1.01 },
      rest: { scale: 1 },
      transition: { duration: 0.22, ease: [0.2, 0.9, 0.2, 1] },
    });

    expect(presets.selection).toEqual({
      transition: { type: "spring", stiffness: 440, damping: 32, mass: 0.78 },
    });

    expect(presets.accessory).toEqual({
      initial: { opacity: 0, y: 8, scale: 0.965 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.24, ease: [0.2, 1, 0.32, 1] },
    });
  });

  it("raises motion distance and duration in high intensity while staying within bounded ranges", () => {
    const mediumPresets = createMotionPresets(createMotionMath("medium"));
    const highPresets = createMotionPresets(createMotionMath("high"));

    expect(highPresets.panel.transition.duration).toBeGreaterThan(mediumPresets.panel.transition.duration);
    expect(highPresets.panel.transition.duration).toBeLessThanOrEqual(0.42);
    expect(highPresets.panel.initial).not.toBe(false);
    expect(mediumPresets.panel.initial).not.toBe(false);

    if (highPresets.panel.initial && mediumPresets.panel.initial) {
      expect(highPresets.panel.initial.y).toBeGreaterThan(mediumPresets.panel.initial.y);
      expect(highPresets.panel.initial.scale).toBeLessThan(mediumPresets.panel.initial.scale);
    }

    expect(highPresets.control.hover).toEqual({ y: -1.875, scale: 1.023 });
    expect(highPresets.control.tap).toEqual({ scale: 0.961 });
    expect(highPresets.control.hover.scale).toBeLessThanOrEqual(1.03);
  });
});
