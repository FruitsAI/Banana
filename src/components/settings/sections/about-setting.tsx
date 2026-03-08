"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon, Layers01Icon, CpuIcon, CodeIcon, LinkSquare02Icon } from "@hugeicons/core-free-icons";

/**
 * @function AboutSetting
 * @description 关于我们设置面板组件。采用苹果风格的液态玻璃（Glassmorphism）设计语言，
 * 展示应用的基础信息（Logo、名称、版本号）、核心技术栈架构以及项目相关的重要外链资源。
 * @returns {JSX.Element} 渲染后的关于页面视图组件
 */
export function AboutSetting() {
  // 集中定义项目的核心技术栈生态配置，通过数据驱动的方式在下方的网格布局中动态渲染技术栈视图卡片
  const techStack = [
    { name: "Tauri 2", icon: Layers01Icon, desc: "高性能桌面框架" },
    { name: "Next.js", icon: ZapIcon, desc: "React 全栈框架" },
    { name: "Vercel AI SDK", icon: CpuIcon, desc: "AI 流式响应" },
    { name: "TypeScript", icon: CodeIcon, desc: "类型安全" },
  ];

  return (
    <div className="p-6">
      <div>
        {/* Header - 页面顶部展示的模块主标题 */}
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
          关于我们
        </h2>

        {/* 
          Logo & Version - Centered Card
          居中展示应用信息的卡片容器。应用了玻璃态背景样式，并配合 Framer Motion 
          实现平滑的 Y 轴向上入场过渡效果，让界面加载更加柔和自然。
        */}
        <motion.div
          className="rounded-xl p-8 border mb-6 flex flex-col items-center text-center"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* App Logo - 悬浮时通过弹性物理动画（spring 类型）引入轻微放大效果，增强元素的互动感和触碰反馈 */}
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
            style={{
              boxShadow: '0 4px 16px var(--brand-primary-light)',
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <img
              src="/logo.png"
              alt="Banana Logo"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* App Info - 分别渲染应用名称、定位标语以及版本号标签 */}
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Banana
          </h1>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Tiny AI Assistant
          </p>
          <div
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              background: 'var(--brand-primary-light)',
              borderColor: 'var(--brand-primary-border)',
              color: 'var(--brand-primary)',
            }}
          >
            v0.1.0-alpha
          </div>
        </motion.div>

        {/* 
          Tech Stack - Full Width Grid
          全宽度的技术栈渲染容器。包裹了交错动画的父级级联控制，使用延时（delay: 0.1s）
          来确保该部分排在 Logo 主卡片之后浮现，建立视觉主次层级。
        */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            技术栈
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {/* 遍历渲染先前定义的核心技术栈数据集合，生成排列整齐的独立介绍卡片 */}
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border text-center"
                style={{
                  background: 'var(--glass-surface)',
                  borderColor: 'var(--glass-border)',
                }}
                // 利用元素索引 index 计算动画延迟，生成从左至右依次淡入弹出的视觉交错特效（Stagger Effect）
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                // 卡片悬浮状态：动态替换玻璃态的表层背景和边框颜色为强聚光（Hover）状态，明确组件的焦点位置
                whileHover={{
                  background: 'var(--glass-hover)',
                  borderColor: 'var(--glass-border-strong)',
                }}
              >
                {/* 技术栈 Icon 的内部居中包裹器 */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--glass-subtle)' }}
                >
                  <HugeiconsIcon icon={tech.icon} size={24} style={{ color: 'var(--text-secondary)' }} />
                </div>
                {/* 技术主体文本块：含该项技术的名称及其在项目里的定位说明 */}
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {tech.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {tech.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 
          Links - Full Width List
          聚合了项目常见的外链集合框。设计为一个大的统一圆角卡片，内部元素均分为横向单项列表。
          延迟进一步增加到 0.2s，实现瀑布式的依次往下呈现。
        */}
        <motion.div
          className="mt-6 rounded-xl border overflow-hidden"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* 将静态外链数据映射为纵向布局里可悬浮交互的独立入口按钮 */}
          {[
            { label: '官方网站', value: 'banana.willxue.com' },
            { label: 'GitHub', value: 'github.com/FruitsAI/Banana' },
            { label: '文档', value: 'docs.banana.willxue.com' },
          ].map((link, index, arr) => (
            <motion.button
              key={link.label}
              className="w-full flex items-center justify-between p-4 text-left group"
              // 通过检测当前 item 是否是列表最后一项，灵活地控制是否渲染底部内分割线（Divider）
              style={{
                borderBottom: index < arr.length - 1 ? '1px solid var(--divider)' : 'none',
              }}
              whileHover={{ background: 'var(--glass-hover)' }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {link.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {link.value}
                </span>
                {/* 右侧的外链跳转引导 Icon：默认全透明，只有当父级项（group）处于 Hover 态时才会通过透明度过渡显形 */}
                <HugeiconsIcon icon={LinkSquare02Icon} size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-quaternary)' }} />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* 
          Copyright - 最底部的版权申明信息段落
          采用原地的淡入加载。动画分配最大的延迟时间（0.3s），静候页面主体数据展示就绪后最后显现。
        */}
        <motion.p
          className="text-center text-xs mt-6"
          style={{ color: 'var(--text-quaternary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          © 2025 Fruits AI. All rights reserved.
        </motion.p>
      </div>
    </div>
  );
}
