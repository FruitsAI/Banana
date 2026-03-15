import React from "react";
import { cn } from "@/lib/utils";

interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function SidebarLayout({ sidebar, content, className }: SidebarLayoutProps) {
  return (
    <div className={cn("flex h-full w-full", className)}>
      <div
        className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full border-r"
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--divider)" }}
      >
        {sidebar}
      </div>
      <div
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{ background: "var(--bg-primary)" }}
      >
        {content}
      </div>
    </div>
  );
}
