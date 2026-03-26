import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiquidGlassRuntimeProvider } from "@/components/liquid-glass-runtime-provider";

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: () => ({
    intensity: "medium",
    factors: { duration: 1, distance: 1, scale: 1 },
    isLoading: false,
    setIntensity: vi.fn(),
  }),
}));

describe("LiquidGlassRuntimeProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(16);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("dark");
    delete document.documentElement.dataset.liquidDarkOptics;
    document.documentElement.style.removeProperty("--liquid-ambient-focus-x");
    document.documentElement.style.removeProperty("--liquid-ambient-focus-y");
    document.documentElement.style.removeProperty("--liquid-ambient-offset-x");
    document.documentElement.style.removeProperty("--liquid-ambient-offset-y");
    document.documentElement.style.removeProperty("--liquid-ambient-energy");
  });

  it("does not mutate tracked SSR surfaces before the runtime is activated", () => {
    render(
      <LiquidGlassRuntimeProvider>
        <div
          data-testid="surface"
          data-material-role="floating"
          data-surface-clarity="high"
        />
      </LiquidGlassRuntimeProvider>,
    );

    const surface = screen.getByTestId("surface");

    expect(surface.dataset.liquidClarityState).toBeUndefined();
    expect(surface.style.getPropertyValue("--liquid-clarity-strength")).toBe("");
    expect(
      document.documentElement.style.getPropertyValue("--liquid-ambient-focus-x"),
    ).toBe("");
  });

  it("projects adaptive clarity and pointer optics onto tracked surfaces after activation", async () => {
    render(
      <LiquidGlassRuntimeProvider>
        <div
          data-testid="surface"
          data-material-role="floating"
          data-surface-clarity="high"
        />
      </LiquidGlassRuntimeProvider>,
    );

    const surface = screen.getByTestId("surface");
    Object.defineProperty(surface, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 120,
        top: 100,
        width: 240,
        height: 180,
        right: 360,
        bottom: 280,
        x: 120,
        y: 100,
        toJSON: () => undefined,
      }),
    });

    fireEvent.pointerMove(window, { clientX: 220, clientY: 180 });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(surface.style.getPropertyValue("--liquid-clarity-strength")).not.toBe("");
      expect(surface.style.getPropertyValue("--liquid-pointer-x")).not.toBe("");
      expect(surface.style.getPropertyValue("--liquid-surface-blur-boost")).not.toBe("");
    });
  });

  it("publishes ambient viewport light variables on the document root", async () => {
    render(
      <LiquidGlassRuntimeProvider>
        <div data-material-role="content">content</div>
      </LiquidGlassRuntimeProvider>,
    );

    fireEvent.pointerMove(window, { clientX: 900, clientY: 160 });

    await waitFor(() => {
      expect(
        document.documentElement.style.getPropertyValue("--liquid-ambient-focus-x"),
      ).not.toBe("");
      expect(
        document.documentElement.style.getPropertyValue("--liquid-ambient-energy"),
      ).not.toBe("");
    });
  });

  it("keeps dark theme surfaces static instead of projecting pointer optics", async () => {
    document.documentElement.classList.add("dark");

    render(
      <LiquidGlassRuntimeProvider>
        <div
          data-testid="surface"
          data-material-role="floating"
          data-surface-clarity="high"
        />
      </LiquidGlassRuntimeProvider>,
    );

    const surface = screen.getByTestId("surface");
    Object.defineProperty(surface, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 120,
        top: 100,
        width: 240,
        height: 180,
        right: 360,
        bottom: 280,
        x: 120,
        y: 100,
        toJSON: () => undefined,
      }),
    });

    fireEvent.pointerMove(window, { clientX: 220, clientY: 180 });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(document.documentElement.dataset.liquidDarkOptics).toBe("static");
      expect(surface.style.getPropertyValue("--liquid-pointer-x")).toBe("");
      expect(surface.style.getPropertyValue("--liquid-clarity-strength")).toBe("");
      expect(
        document.documentElement.style.getPropertyValue("--liquid-ambient-focus-x"),
      ).toBe("");
    });
  });
});
