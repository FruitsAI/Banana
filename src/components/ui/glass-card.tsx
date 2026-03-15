import { cn } from "@/lib/utils";
import { IridescentBorder } from "@/components/ui/iridescent-border";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  iridescent?: boolean;
  iridescentOpacity?: number;
  /** 是否启用虹彩边框流动动画 */
  iridescentAnimated?: boolean;
  /** 玻璃深度等级：sm / md / lg */
  depth?: "sm" | "md" | "lg";
}

const depthStyles: Record<string, string> = {
  sm: "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.55)",
  md: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
  lg: "0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.65)",
};

export function GlassCard({
  iridescent = true,
  iridescentOpacity = 0.35,
  iridescentAnimated = false,
  depth = "md",
  className,
  children,
  style,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl", className)}
      style={{
        background: "var(--glass-surface)",
        border: "1px solid var(--glass-border)",
        boxShadow: depthStyles[depth],
        backdropFilter: "blur(20px) saturate(200%) brightness(1.01)",
        WebkitBackdropFilter: "blur(20px) saturate(200%) brightness(1.01)",
        ...style,
      }}
      {...props}
    >
      {iridescent && (
        <IridescentBorder opacity={iridescentOpacity} animated={iridescentAnimated} />
      )}
      {children}
    </div>
  );
}
