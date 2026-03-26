import React from "react";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";

interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function SidebarLayout({ sidebar, content, className }: SidebarLayoutProps) {
  return (
    <div className={cn("flex h-full w-full min-h-0 gap-3 p-3 sm:gap-4 sm:p-4", className)}>
      <div
        className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full rounded-[24px] border overflow-hidden"
        data-material-role="chrome"
        style={{ ...getMaterialSurfaceStyle("chrome", "sm") }}
      >
        {sidebar}
      </div>
      <div
        className="flex-1 flex flex-col h-full overflow-hidden rounded-[28px] border"
        data-material-role="content"
        style={{ ...getMaterialSurfaceStyle("content", "md") }}
      >
        {content}
      </div>
    </div>
  );
}
