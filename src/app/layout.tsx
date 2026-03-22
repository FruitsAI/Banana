import type { Metadata } from "next";
import Script from "next/script";
import { AnimationIntensityProvider } from "@/components/animation-intensity-provider";
import { FeedbackProvider } from "@/components/feedback/feedback-provider";
import { PlatformMarker } from "@/components/layout/platform-marker";
import { Rail } from "@/components/layout/rail";
import { Titlebar } from "@/components/layout/titlebar";
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
          disableTransitionOnChange={false}
          storageKey="banana-theme"
        >
          <AnimationIntensityProvider>
            <FeedbackProvider>
              <div className="window theme-transition" id="window">
                <FluidBackground />
                <Titlebar />
                <div className="content">
                  <Rail />
                  {children}
                </div>
              </div>
            </FeedbackProvider>
          </AnimationIntensityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
