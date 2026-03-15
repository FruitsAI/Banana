import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: "sidebar" | "full";
}

export function GlassPanel({
  width = "sidebar",
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
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--divider)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
