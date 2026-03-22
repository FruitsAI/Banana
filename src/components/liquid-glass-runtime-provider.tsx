"use client";

import { useEffect, type ReactNode } from "react";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import {
  liquidGlassAmbientStateToCSSVariables,
  liquidGlassSurfaceStateToCSSVariables,
  readLiquidGlassSurfaceClarity,
  resolveLiquidGlassAmbientState,
  resolveLiquidGlassSurfaceState,
  type LiquidGlassMotionLevel,
  type LiquidGlassPointerState,
} from "@/lib/liquid-glass-runtime";
import type { MaterialRole } from "@/components/ui/material-surface";

const SURFACE_SELECTOR = "[data-material-role]";
const INTERACTIVE_SELECTOR = [
  "[data-liquid-interactive='true']",
  ".material-interactive",
  "[data-slot='button'][data-material-role]",
].join(", ");

function applyCSSVariables(target: HTMLElement, variables: Record<string, string>) {
  for (const [property, value] of Object.entries(variables)) {
    target.style.setProperty(property, value);
  }
}

function applyRootCSSVariables(variables: Record<string, string>) {
  const root = document.documentElement;

  for (const [property, value] of Object.entries(variables)) {
    root.style.setProperty(property, value);
  }
}

function resolveMotionLevel(intensity: string): LiquidGlassMotionLevel {
  if (intensity === "low" || intensity === "high") {
    return intensity;
  }

  return "medium";
}

function isHTMLElement(value: EventTarget | null): value is HTMLElement {
  return value instanceof HTMLElement;
}

function resolveInteractiveSurface(target: EventTarget | null) {
  if (!isHTMLElement(target)) {
    return null;
  }

  return target.closest<HTMLElement>(INTERACTIVE_SELECTOR);
}

export function LiquidGlassRuntimeProvider({ children }: { children: ReactNode }) {
  const { intensity } = useAnimationIntensity();

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const pointerState: LiquidGlassPointerState = {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.18,
      active: false,
    };
    const motionLevel = resolveMotionLevel(intensity);
    const pressedCleanup = new Map<HTMLElement, number>();
    let frame = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let scrollVelocity = 0;

    const scheduleSync = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncSurfaces();
      });
    };

    const syncSurfaces = () => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollVelocity,
      };
      const ambientState = resolveLiquidGlassAmbientState({
        viewport,
        pointer: pointerState,
        motionLevel,
      });
      const surfaces = document.querySelectorAll<HTMLElement>(SURFACE_SELECTOR);

      document.documentElement.dataset.liquidGlassRuntime = "active";
      applyRootCSSVariables(liquidGlassAmbientStateToCSSVariables(ambientState));

      for (const surface of surfaces) {
        const rect = surface.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
          continue;
        }

        const surfaceState = resolveLiquidGlassSurfaceState({
          role: (surface.dataset.materialRole as MaterialRole) ?? "content",
          clarity: readLiquidGlassSurfaceClarity(surface.dataset.surfaceClarity),
          motionLevel,
          viewport,
          pointer: pointerState,
          rect,
        });

        surface.dataset.liquidClarityState =
          surfaceState.clarityStrength >= 0.2 ? "elevated" : "steady";
        applyCSSVariables(surface, liquidGlassSurfaceStateToCSSVariables(surfaceState));
      }

      scrollVelocity = Math.max(0, scrollVelocity * 0.72);
    };

    const triggerPressRipple = (event: PointerEvent) => {
      const surface = resolveInteractiveSurface(event.target);

      if (!surface) {
        return;
      }

      const rect = surface.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;

      surface.dataset.liquidPressed = "true";
      surface.style.setProperty("--liquid-ripple-x", `${Math.min(92, Math.max(8, x)).toFixed(2)}%`);
      surface.style.setProperty("--liquid-ripple-y", `${Math.min(92, Math.max(8, y)).toFixed(2)}%`);
      surface.style.setProperty("--liquid-ripple-opacity", "0.24");
      surface.style.setProperty("--liquid-ripple-scale", "0.22");

      const existingCleanup = pressedCleanup.get(surface);
      if (existingCleanup) {
        window.clearTimeout(existingCleanup);
      }

      const timeoutId = window.setTimeout(() => {
        surface.dataset.liquidPressed = "false";
        surface.style.setProperty("--liquid-ripple-opacity", "0");
        surface.style.setProperty("--liquid-ripple-scale", "1.08");
        pressedCleanup.delete(surface);
      }, 420);

      pressedCleanup.set(surface, timeoutId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerState.x = event.clientX;
      pointerState.y = event.clientY;
      pointerState.active = true;
      scheduleSync();
    };

    const handlePointerReset = () => {
      pointerState.active = false;
      scheduleSync();
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerState.x = event.clientX;
      pointerState.y = event.clientY;
      pointerState.active = true;
      triggerPressRipple(event);
      scheduleSync();
    };

    const handleScroll = () => {
      const now = performance.now();
      const nextScrollY = window.scrollY;
      const deltaY = Math.abs(nextScrollY - lastScrollY);
      const deltaT = Math.max(16, now - lastScrollAt);

      scrollVelocity = Math.min(1, (deltaY / deltaT) * 6);
      lastScrollY = nextScrollY;
      lastScrollAt = now;
      scheduleSync();
    };

    const mutationObserver = new MutationObserver(() => {
      scheduleSync();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-material-role", "data-surface-clarity", "class"],
    });

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerReset, { passive: true });
    window.addEventListener("pointercancel", handlePointerReset, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", scheduleSync, { passive: true });
    window.addEventListener("blur", handlePointerReset);
    document.addEventListener("mouseleave", handlePointerReset);

    syncSurfaces();

    return () => {
      mutationObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerReset);
      window.removeEventListener("pointercancel", handlePointerReset);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("blur", handlePointerReset);
      document.removeEventListener("mouseleave", handlePointerReset);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      for (const timeoutId of pressedCleanup.values()) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [intensity]);

  return <>{children}</>;
}
