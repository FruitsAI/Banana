import { describe, expect, it } from "vitest";
import {
  resolveLiquidGlassAmbientState,
  resolveLiquidGlassSurfaceState,
} from "@/lib/liquid-glass-runtime";

describe("liquid-glass runtime", () => {
  it("gives high-clarity surfaces a stronger optical support profile", () => {
    const sharedInput = {
      role: "floating" as const,
      motionLevel: "medium" as const,
      viewport: { width: 1440, height: 900, scrollVelocity: 0.28 },
      pointer: { x: 720, y: 220, active: true },
      rect: {
        left: 520,
        top: 120,
        width: 360,
        height: 200,
      },
    };

    const standardSurface = resolveLiquidGlassSurfaceState({
      ...sharedInput,
      clarity: "standard",
    });
    const highClaritySurface = resolveLiquidGlassSurfaceState({
      ...sharedInput,
      clarity: "high",
    });

    expect(highClaritySurface.clarityStrength).toBeGreaterThan(
      standardSurface.clarityStrength,
    );
    expect(highClaritySurface.blurBoostPx).toBeGreaterThan(
      standardSurface.blurBoostPx,
    );
    expect(highClaritySurface.brightnessBoost).toBeGreaterThan(
      standardSurface.brightnessBoost,
    );
  });

  it("tracks pointer position inside a surface and increases optical presence", () => {
    const state = resolveLiquidGlassSurfaceState({
      role: "content",
      clarity: "standard",
      motionLevel: "medium",
      viewport: { width: 1280, height: 800, scrollVelocity: 0.14 },
      pointer: { x: 310, y: 240, active: true },
      rect: {
        left: 200,
        top: 160,
        width: 220,
        height: 160,
      },
    });

    expect(state.pointerXPercent).toBeGreaterThan(40);
    expect(state.pointerXPercent).toBeLessThan(60);
    expect(state.pointerYPercent).toBeGreaterThan(45);
    expect(state.pointerYPercent).toBeLessThan(60);
    expect(state.pointerPresence).toBeGreaterThan(0.7);
  });

  it("publishes an ambient light field that follows the pointer across the viewport", () => {
    const ambient = resolveLiquidGlassAmbientState({
      viewport: { width: 1440, height: 900, scrollVelocity: 0.22 },
      pointer: { x: 1180, y: 160, active: true },
      motionLevel: "high",
    });

    expect(ambient.focusXPercent).toBeGreaterThan(70);
    expect(ambient.focusYPercent).toBeLessThan(25);
    expect(ambient.energy).toBeGreaterThan(0.2);
    expect(ambient.offsetX).toBeGreaterThan(0);
  });
});
