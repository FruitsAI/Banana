"use client";

import type { ReactNode } from "react";

interface SettingsPageFrameProps {
  children: ReactNode;
}

export function SettingsPageFrame({ children }: SettingsPageFrameProps) {
  return (
    <div className="h-full overflow-y-auto custom-scroll" data-settings-page-scroll="true">
      <div
        className="mx-auto flex min-h-full w-full max-w-none flex-col px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8 2xl:px-10"
        data-settings-page-fill="stage"
        data-settings-page-width="fluid"
        data-testid="settings-page-frame"
      >
        {children}
      </div>
    </div>
  );
}
