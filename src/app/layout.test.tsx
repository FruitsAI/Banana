import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/script", () => ({
  default: ({
    children,
    ...props
  }: React.ScriptHTMLAttributes<HTMLScriptElement>) => <script {...props}>{children}</script>,
}));

vi.mock("@/components/animation-intensity-provider", () => ({
  AnimationIntensityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/feedback/feedback-provider", () => ({
  FeedbackProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layout/platform-marker", () => ({
  PlatformMarker: () => <div data-testid="platform-marker" />,
}));

vi.mock("@/components/liquid-glass-runtime-provider", () => ({
  LiquidGlassRuntimeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/fluid-background", () => ({
  FluidBackground: () => <div data-testid="fluid-background" />,
}));

vi.mock("@/lib/platform", () => ({
  buildPlatformMarkerScript: () => "window.__banana_platform_marker = true;",
}));

describe("RootLayout", () => {
  it("keeps an explicit top drag region after removing the custom titlebar", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>hello banana</div>
      </RootLayout>,
    );

    expect(markup).toContain('data-testid="window-drag-region"');
    expect(markup).toContain('data-tauri-drag-region="true"');
    expect(markup).toContain('data-window-drag-region="top-strip"');
  });
});
