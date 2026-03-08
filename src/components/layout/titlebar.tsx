"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

/**
 * @function Titlebar
 * @description 客户端原生的应用顶栏 (Titlebar)。
 * 提供类 macOS 的流量灯占位、窗口全局拖拽句柄以及亮暗色模式在全局层面的快速切换机制。
 * 
 * @returns {JSX.Element} 窗口的自定义标题控制栏实体
 */
export function Titlebar() {
  const { theme, setTheme } = useTheme();
  
  // 使用 mounted 状态阻止服务端渲染阶段的主题控制输出，防止闪烁现象 (Hydration Mismatch)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 延迟一帧渲染挂载状态，以绕过 React 18 对同步 cascaded render 的严格校验
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <header
      className="h-11 sm:h-12 flex items-center px-3 sm:px-4 relative z-50"
      style={{
        background: 'var(--glass-surface)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--divider)',
      }}
      // 这是 Tauri 专用扩展属性，允许桌面端鼠标按住此区域移动整个系统窗口
      data-tauri-drag-region="true"
    >
      {/* 
        macOS Traffic Lights Spacer 
        占位块：为系统原生的红黄绿“交通灯”（关闭/缩放/最小化按钮）预留绝对位置，
        使用 pointerEvents: 'none' 防止意外遮挡或拦截底层系统的点击响应。
      */}
      <div className="w-16 sm:w-20 flex-shrink-0" style={{ pointerEvents: 'none' }} />

      {/* 
        Center - App Brand 
        居中的主标题。同样绑定了 data-tauri-drag-region，保证鼠标无论点在栏体还是文字上都可以拖拽窗口 
      */}
      <div
        className="flex-1 flex items-center justify-center min-w-0"
        data-tauri-drag-region="true"
      >
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Banana
        </span>
      </div>

      {/* 
        Right - Theme Toggle 
        右侧模块：用于放置窗口辅助工具（当前为主题切换）。
        此处显式声明 data-tauri-drag-region="false"，防止拖拽逻辑越权覆盖了按钮本身的 onClick 点击操作。
      */}
      <div className="w-16 sm:w-20 flex-shrink-0 flex items-center justify-end" data-tauri-drag-region="false">
        {/* 仅在挂载于浏览器 DOM 之后渲染切换器，防止服务端不知道首选主题是什么导致图标渲染异常 */}
        {mounted && (
          <motion.button
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
            }}
            whileHover={{
              background: 'var(--glass-hover)',
              color: 'var(--text-primary)',
            }}
            whileTap={{ scale: 0.95 }}
            title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            aria-label="切换主题"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {/* 切换时给予强烈的旋转视觉暗示。利用 AnimatePresence / key 使不同主题时旧组件退出，新组件滑入 */}
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {theme === "dark" ? (
                <HugeiconsIcon icon={Sun03Icon} size={16} />
              ) : (
                <HugeiconsIcon icon={Moon02Icon} size={16} />
              )}
            </motion.div>
          </motion.button>
        )}
      </div>
    </header>
  );
}
