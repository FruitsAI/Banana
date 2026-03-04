import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Titlebar } from "@/components/layout/titlebar";
import { Rail } from "@/components/layout/rail";
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="window" id="window">
            <Titlebar />
            <div className="content">
              <Rail />
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
