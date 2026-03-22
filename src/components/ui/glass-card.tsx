"use client";

import { cn } from "@/lib/utils";
import { IridescentBorder } from "@/components/ui/iridescent-border";
import {
  getMaterialSurfaceStyle,
  type MaterialDepth,
  type MaterialRole,
} from "@/components/ui/material-surface";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  iridescent?: boolean;
  iridescentOpacity?: number;
  /** 是否启用虹彩边框流动动画 */
  iridescentAnimated?: boolean;
  /** 玻璃深度等级：sm / md / lg */
  depth?: MaterialDepth;
  surface?: Exclude<MaterialRole, "chrome">;
}

export function GlassCard({
  iridescent = false,
  iridescentOpacity = 0.35,
  iridescentAnimated = false,
  depth = "md",
  surface = "content",
  className,
  children,
  style,
  ...props
}: GlassCardProps) {
  const { intensity } = useAnimationIntensity();
  const allowAnimatedIridescence = iridescent && iridescentAnimated && intensity !== "low";

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border", className)}
      data-material-role={surface}
      data-iridescent={iridescent ? "true" : "false"}
      data-iridescent-animated={allowAnimatedIridescence ? "true" : "false"}
      style={{
        ...getMaterialSurfaceStyle(surface, depth),
        ...style,
      }}
      {...props}
    >
      {iridescent && (
        <IridescentBorder opacity={iridescentOpacity} animated={allowAnimatedIridescence} />
      )}
      {children}
    </div>
  );
}
