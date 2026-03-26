"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";

/**
 * FluidBackground Component
 * @description 
 *   Animated fluid gradient background with multiple morphing blobs.
 *   Creates a premium, cinematic atmosphere inspired by Apple visionOS.
 *   Respects user's motion preferences and animation intensity settings.
 * @example
 * <FluidBackground />
 */
export function FluidBackground() {
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();
  const [themeMode, setThemeMode] = useState<"unknown" | "light" | "dark">("unknown");
  const motionReduced = shouldReduceMotion || intensity === "low";

  const duration = (base: number) => base * factors.duration;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncThemeMode = () => {
      setThemeMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };

    syncThemeMode();

    const observer = new MutationObserver(() => {
      syncThemeMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  if (themeMode === "unknown") {
    return <div className="fluid-background" data-fluid-mode="hydrating" />;
  }

  if (themeMode === "dark") {
    return <div className="fluid-background" data-fluid-mode="static-dark" />;
  }

  if (motionReduced) {
    return (
      <div className="fluid-background" data-fluid-mode="static-light">
        <div className="fluid-blob fluid-blob-1" style={{ animation: "none" }} />
        <div className="fluid-blob fluid-blob-2" style={{ animation: "none" }} />
        <div className="fluid-blob fluid-blob-3" style={{ animation: "none" }} />
        <div className="fluid-blob fluid-blob-4" style={{ animation: "none" }} />
      </div>
    );
  }

  return (
    <div className="fluid-background" data-fluid-mode="dynamic-light">
      <motion.div
        className="fluid-blob fluid-blob-1"
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -150, 100, 0],
          scale: [1, 1.1, 0.95, 1],
          rotate: [0, 5, -3, 0],
        }}
        transition={{
          duration: duration(20),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="fluid-blob fluid-blob-2"
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 80, -120, 0],
          scale: [1, 1.15, 0.9, 1],
          rotate: [0, -4, 6, 0],
        }}
        transition={{
          duration: duration(25),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="fluid-blob fluid-blob-3"
        animate={{
          x: [0, 150, -80, 0],
          y: [0, 120, -60, 0],
          scale: [1, 1.2, 0.85, 1],
          rotate: [0, 8, -5, 0],
        }}
        transition={{
          duration: duration(22),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="fluid-blob fluid-blob-4"
        animate={{
          x: [0, -100, 60, 0],
          y: [0, -80, 100, 0],
          scale: [1, 1.1, 0.92, 1],
          rotate: [0, -5, 3, 0],
        }}
        transition={{
          duration: duration(18),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
