import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Titlebar } from "@/components/layout/titlebar";
import { Rail } from "@/components/layout/rail";
import "./globals.css";

/**
 * Next.js 页面级的静态元数据（Metadata）配置。
 * @description 这些信息会被自动注入到文档的 `<head>` 中，用于 SEO 和页面标题展示。
 */
export const metadata: Metadata = {
  title: "Banana",
  description: "Next Generation AI Assistant",
};

/**
 * @function RootLayout
 * @description 应用的全局根布局组件。所有 Next.js 的页面都会被包裹在这个布局之下。
 * 主要负责：
 * 1. 初始化 HTML 骨架并配置语言。
 * 2. 挂载全局主题状态管理器 (ThemeProvider)，实现亮暗色模式切换。
 * 3. 定义全局通用 UI 层，如自定义标题栏 (Titlebar) 和左侧图标侧边栏 (Rail)。
 * 
 * @param {Object} props 组件属性
 * @param {React.ReactNode} props.children Next.js 路由匹配后注入的具体页面内容
 * @returns {JSX.Element} 渲染后的根节点 DOM 树
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 使用 suppressHydrationWarning 忽略由于 Next.js 服务端渲染（SSR）
    // 和客户端水合（Hydration）时因深色模式插件自动修改 body class 造成的不匹配警告
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {/*
          主题提供者：使用 next-themes 管理应用的亮暗模式。
          配置 storageKey 以在本地 localStorage 缓存用户的主题偏好设置；
          允许监听系统设置的变化 (enableSystem) 并启用动画过渡。
        */}
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange={false}
          storageKey="banana-theme"
        >
          {/* 主应用视口的顶级容器，带主题过渡动画类名 */}
          <div className="window theme-transition" id="window">
            {/* 顶部的自定义窗口拖拽控制栏 */}
            <Titlebar />
            {/* 核心内容区域的弹性或网格容器 */}
            <div className="content">
              {/* 最左侧极简导航栏（轨道），通常包含应用的核心入口图标 */}
              <Rail />
              {/* 根据当前 URL 动态渲染的路由页面内容（例如 page.tsx 或 setting/page.tsx） */}
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
