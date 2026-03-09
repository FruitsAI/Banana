import type { Metadata } from "next";
import { AnimationIntensityProvider } from "@/components/animation-intensity-provider";
import { FeedbackProvider } from "@/components/feedback/feedback-provider";
import { PlatformMarker } from "@/components/layout/platform-marker";
import { Rail } from "@/components/layout/rail";
import { Titlebar } from "@/components/layout/titlebar";
import { ThemeProvider } from "@/components/theme-provider";
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
