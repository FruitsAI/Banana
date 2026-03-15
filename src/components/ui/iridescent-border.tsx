import { cn } from "@/lib/utils";

interface IridescentBorderProps {
  /** 虹彩效果不透明度，默认 0.3 */
  opacity?: number;
  /** 额外的 className，用于覆盖 rounded 等属性 */
  className?: string;
  /** 是否启用流动动画，默认 false */
  animated?: boolean;
}

export function IridescentBorder({ opacity = 0.3, className, animated = false }: IridescentBorderProps) {
  return (
    <span
      className={cn(
        "absolute inset-0 rounded-[inherit] pointer-events-none",
        animated && "iridescent-animated",
        className
      )}
      style={{
        padding: "1px",
        opacity,
        background: "var(--iridescent-border)",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        ...(animated && {
          backgroundSize: "300% 300%",
          animation: "iridescent-border-flow 5s ease-in-out infinite",
        }),
      }}
    />
  );
}
