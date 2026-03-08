"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AiChat02Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

// 定义侧边栏主体导航项数据源，方便后续扩展更多模块（如知识库、插件市场等）
const navItems = [
  { id: "chats", icon: AiChat02Icon, label: "会话", path: "/" },
];

/**
 * @function Rail
 * @description 应用最左侧的极简图标导航轨道 (Rail)。
 * 采用苹果液态玻璃风格设计，主要用于在全局不同的一级功能模块间切换。
 * 
 * @returns {JSX.Element} 左侧图标轨道的 DOM 结构
 */
export function Rail() {
  const pathname = usePathname();
  const router = useRouter();

  // 判断当前路由是否处于设置页面下，以控制底部设置入口的高亮状态
  const isSettingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <aside
      // 使用 flex-shrink-0 防止在 Flex 空间挤压时被缩小；维持固定的 14/16 宽度比例。
      className="w-14 sm:w-16 flex-shrink-0 flex flex-col items-center py-4 gap-2"
      style={{
        background: 'var(--bg-sidebar)',
        // 右边框作为主内容区和侧边栏的物理分隔
        borderRight: '1px solid var(--divider)',
      }}
      aria-label="主导航"
    >
      {/* 
        Main Navigation
        核心导航项循环渲染区域 
      */}
      <div className="flex flex-col gap-1 w-full items-center">
        {navItems.map((item) => {
          // 精确匹配根路径，避免当切换到深层级路由时错误地高亮 "会话" 项
          const isActive = pathname === item.path || (item.path === "/" && pathname === "");
          return (
            <motion.button
              key={item.id}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl relative"
              style={{
                background: isActive ? 'var(--brand-primary-light)' : 'transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-tertiary)',
              }}
              whileHover={{
                background: isActive ? 'var(--brand-primary-light)' : 'var(--glass-subtle)',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
              }}
              whileTap={{ scale: 0.95 }}
              title={item.label}
              aria-label={item.label}
              onClick={() => router.push(item.path)}
            >
              <HugeiconsIcon icon={item.icon} size={20} />
              
              {/* 
                当前选中项的指示条 (Active Indicator)
                借助 Framer Motion 的 layoutId="activeIndicator" 特性，当用户在多个 navItems 间
                切换时，该线形指示器会自动执行极为顺滑的位置瞬移（Magic Move）动画。
              */}
              {isActive && (
                <motion.div
                  className="absolute left-0 w-0.5 sm:w-1 h-4 sm:h-5 rounded-r-full"
                  style={{ background: 'var(--brand-primary)' }}
                  layoutId="activeIndicator"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Spacer - 空白占位块：负责将底部的设置按钮推至可用容器的最下方 */}
      <div className="flex-1" />
      
      {/* Settings - 全局设置入口 */}
      <motion.button
        className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl relative"
        style={{
          background: isSettingsActive ? 'var(--brand-primary-light)' : 'transparent',
          color: isSettingsActive ? 'var(--brand-primary)' : 'var(--text-tertiary)',
        }}
        whileHover={{
          background: isSettingsActive ? 'var(--brand-primary-light)' : 'var(--glass-subtle)',
          color: isSettingsActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
        }}
        whileTap={{ scale: 0.95 }}
        title="设置"
        aria-label="设置"
        onClick={() => router.push("/settings")}
      >
        <HugeiconsIcon icon={Settings01Icon} size={20} />
        {/* 如果处于设置页面，指示条将滑动停留于此 */}
        {isSettingsActive && (
          <motion.div
            className="absolute left-0 w-0.5 sm:w-1 h-4 sm:h-5 rounded-r-full"
            style={{ background: 'var(--brand-primary)' }}
            layoutId="activeIndicator"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </motion.button>
    </aside>
  );
}
