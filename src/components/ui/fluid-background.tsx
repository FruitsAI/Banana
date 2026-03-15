"use client";

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
  const motionReduced = shouldReduceMotion || intensity === "low";

  const duration = (base: number) => base * factors.duration;

  if (motionReduced) {
    return (
      <div className="fluid-background">
        <div className="fluid-blob fluid-blob-1" style={{ animation: "none" }} />
        <div className="fluid-blob fluid-blob-2" style={{ animation: "none" }} />
        <div className="fluid-blob fluid-blob-3" style={{ animation: "none" }} />
        <div className="fluid-blob fluid-blob-4" style={{ animation: "none" }} />
      </div>
    );
  }

  return (
    <div className="fluid-background">
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
