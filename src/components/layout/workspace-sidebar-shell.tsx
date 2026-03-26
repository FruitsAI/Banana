"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";

type WorkspaceSidebarShellProps = HTMLMotionProps<"aside"> & {
  children: React.ReactNode;
  testId: string;
};

export function WorkspaceSidebarShell({
  children,
  className,
  style,
  testId,
  ...props
}: WorkspaceSidebarShellProps) {
  return (
    <motion.aside
      className={cn(
        "workspace-sidebar-shell w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full relative",
        className,
      )}
      data-material-role="chrome"
      data-sidebar-safe-area="traffic-lights"
      data-sidebar-shell="workspace"
      data-testid={testId}
      style={{
        ...getMaterialSurfaceStyle("chrome", "md"),
        borderRight: "1px solid var(--divider)",
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.aside>
  );
}
