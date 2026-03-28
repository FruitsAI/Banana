"use client";

import type { ReactNode } from "react";

interface SettingsPageFrameProps {
  children: ReactNode;
  scrollMode?: "page" | "locked";
}

export function SettingsPageFrame({
  children,
  scrollMode = "page",
}: SettingsPageFrameProps) {
  const isLocked = scrollMode === "locked";

  return (
    <div
      className={isLocked ? "h-full overflow-hidden" : "h-full overflow-y-auto custom-scroll"}
      data-settings-page-scroll={scrollMode}
    >
      <div
        className={
          isLocked
            ? "mx-auto flex h-full min-h-0 w-full max-w-none flex-col px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8 2xl:px-10"
            : "mx-auto flex min-h-full w-full max-w-none flex-col px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8 2xl:px-10"
        }
        data-settings-page-fill="stage"
        data-settings-page-scroll={scrollMode}
        data-settings-page-width="fluid"
        data-testid="settings-page-frame"
      >
        {children}
      </div>
    </div>
  );
}
