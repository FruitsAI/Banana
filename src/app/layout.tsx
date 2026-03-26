import type { Metadata } from "next";
import Script from "next/script";
import { AnimationIntensityProvider } from "@/components/animation-intensity-provider";
import { FeedbackProvider } from "@/components/feedback/feedback-provider";
import { PlatformMarker } from "@/components/layout/platform-marker";
import { LiquidGlassRuntimeProvider } from "@/components/liquid-glass-runtime-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { FluidBackground } from "@/components/ui/fluid-background";
import { buildPlatformMarkerScript } from "@/lib/platform";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banana",
  description: "Next Generation AI Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Script id="banana-platform-marker" strategy="beforeInteractive">
          {buildPlatformMarkerScript()}
        </Script>
        <PlatformMarker />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="banana-theme"
        >
          <AnimationIntensityProvider>
            <LiquidGlassRuntimeProvider>
              <FeedbackProvider>
                <div className="window" id="window">
                  <FluidBackground />
                  <div
                    aria-hidden="true"
                    className="window-drag-region"
                    data-tauri-drag-region="true"
                    data-testid="window-drag-region"
                    data-window-drag-region="top-strip"
                  />
                  <div className="content">{children}</div>
                </div>
              </FeedbackProvider>
            </LiquidGlassRuntimeProvider>
          </AnimationIntensityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
