"use client";

import { cn } from "@/lib/utils";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";

interface IridescentBorderProps {
  /** 虹彩效果不透明度，默认 0.3 */
  opacity?: number;
  /** 额外的 className，用于覆盖 rounded 等属性 */
  className?: string;
  /** 是否启用流动动画，默认 false */
  animated?: boolean;
}

export function IridescentBorder({ opacity = 0.3, className, animated = false }: IridescentBorderProps) {
  const { intensity } = useAnimationIntensity();
  const allowAnimation = animated && intensity !== "low";

  return (
    <span
      className={cn(
        "absolute inset-0 rounded-[inherit] pointer-events-none",
        allowAnimation && "iridescent-animated",
        className
      )}
      data-iridescent="true"
      data-iridescent-animated={allowAnimation ? "true" : "false"}
      style={{
        padding: "1px",
        opacity,
        backgroundImage: "var(--iridescent-border)",
        backgroundPosition: "50% 50%",
        backgroundRepeat: "no-repeat",
        backgroundSize: allowAnimation ? "300% 300%" : "100% 100%",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: allowAnimation ? "iridescent-border-flow 5s ease-in-out infinite" : "none",
      }}
    />
  );
}
