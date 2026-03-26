import { cn } from "@/lib/utils";
import {
  getMaterialSurfaceStyle,
  type MaterialDepth,
  type MaterialRole,
} from "@/components/ui/material-surface";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: "sidebar" | "full";
  surface?: Extract<MaterialRole, "chrome" | "content">;
  depth?: MaterialDepth;
}

export function GlassPanel({
  width = "sidebar",
  surface = "chrome",
  depth = "md",
  className,
  children,
  style,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "flex-shrink-0 flex flex-col h-full border-r",
        width === "sidebar" && "w-60 sm:w-64 lg:w-72",
        width === "full" && "w-full",
        className
      )}
      data-material-role={surface}
      style={{
        ...getMaterialSurfaceStyle(surface, depth),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
