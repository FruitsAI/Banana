"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Search01Icon, AiMagicIcon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

/**
 * @interface ThreadItem
 * @description 定义单条聊天会话历史记录的数据结构
 */
interface ThreadItem {
  /** 会话记录的唯一标识符 */
  id: string;
  /** 会话标题（多数场景下由 AI 自动生成） */
  title: string;
  /** 会话最后活跃时间 */
  time: string;
  /** 会话使用的底层模型名称（如 GPT-4o, Claude 3.5 Sonnet 等） */
  model: string;
  /** 是否为当前正在查看的激活状态 */
  selected?: boolean;
}

// 模拟的初始会话历史数据。实际开发中将被替换为本地数据库查询（如 SQLite / IndexedDB）。
// 将其分为 today 和 yesterday，以便 UI 上按时间线聚类展示。
const threadsData: {
  today: ThreadItem[];
  yesterday: ThreadItem[];
} = {
  today: [
    { id: "1", title: "项目架构重构计划", time: "12:34", model: "Claude 3.5 Sonnet", selected: true },
    { id: "2", title: "液态玻璃视觉实现指南", time: "09:15", model: "GPT-4o" },
  ],
  yesterday: [
    { id: "3", title: "如何写好一个 PRD", time: "20:45", model: "Kimi" },
  ],
};

/**
 * @function ThreadItemComponent
 * @description Sidebar 列表中单个会话气泡的渲染单元。
 * 处理了常态、悬浮、选中不同状态下极为细腻的背景和边框颜色过渡。
 * 
 * @param {Object} props 组件参数
 * @param {ThreadItem} props.thread 传入的单条会话数据
 * @returns {JSX.Element} 单个会话框视图
 */
function ThreadItemComponent({ thread }: { thread: ThreadItem }) {
  return (
    <motion.div
      className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl cursor-pointer group border"
      style={{
        background: thread.selected ? 'var(--brand-primary-lighter)' : 'transparent',
        borderColor: thread.selected ? 'var(--brand-primary-border)' : 'var(--glass-border)',
      }}
      // 增强悬浮时的色阶反馈，如果是已选中状态则加深高亮，未选中则增加毛玻璃浅层高亮
      whileHover={{
        background: thread.selected ? 'var(--brand-primary-light)' : 'var(--glass-subtle)',
        borderColor: thread.selected ? 'var(--brand-primary-border-strong)' : 'var(--glass-border-strong)',
      }}
      whileTap={{ scale: 0.99 }} // 极轻微的点按反馈
    >
      <div
        className="font-medium text-xs sm:text-sm mb-0.5 truncate"
        style={{
          color: thread.selected ? 'var(--brand-primary)' : 'var(--text-primary)',
        }}
      >
        {thread.title}
      </div>
      <div
        className="text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span>{thread.time}</span>
        {/* 使用符号作为分隔符 */}
        <span style={{ color: 'var(--text-quaternary)' }}>·</span>
        <span className="truncate">{thread.model}</span>
      </div>
    </motion.div>
  );
}

/**
 * @function ThreadsSidebar
 * @description 采用苹果液态玻璃风格设计的会话列表侧边栏。
 * 提供了全局搜索、新建会话以及对历史长列表进行分类检视的核心功能。
 * 
 * @returns {JSX.Element} 会话列表侧边栏 DOM 结构
 */
export function ThreadsSidebar() {
  return (
    <div
      // 设置固定宽度或响应式宽度，当外层容器缩小时自身绝不被挤压变形 (flex-shrink-0)
      className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full"
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--divider)',
      }}
    >
      {/* 
        Header - 状态区域
        显示栏目标题和一个类似“本地已就绪”状态的微型指示器
      */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-center justify-between gap-2">
        <h1
          className="text-sm sm:text-base font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          会话流
        </h1>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0"
          style={{
            background: 'var(--success-light)',
            color: 'var(--success)',
          }}
        >
          {/* 加入一个带发光阴影的小圆点标识，提示系统连接健康度 */}
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: 'var(--success)',
              boxShadow: '0 0 4px var(--success-glow)',
            }}
          />
          <span className="hidden sm:inline">本地已就绪</span>
          <span className="sm:hidden">就绪</span>
        </div>
      </div>

      {/* 
        Search & Add 
        功能操作区：全局会话搜索输入框，以及右侧独立的新建按钮 
      */}
      <div className="px-3 sm:px-4 pb-2 sm:pb-3 flex gap-2 min-w-0">
        <div
          className="search flex-1 min-w-0 flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all duration-200 border"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <HugeiconsIcon icon={Search01Icon} size={16} className="flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <input
            placeholder="搜索..."
            // 去除原生输入框的轮廓及不必要的自动配置项
            className="flex-1 min-w-0 text-xs sm:text-sm placeholder:text-[var(--text-placeholder)] bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
            aria-label="搜索会话记录"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
        <motion.button
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            background: 'var(--glass-subtle)',
            color: 'var(--text-secondary)',
          }}
          whileHover={{
            background: 'var(--glass-hover)',
            color: 'var(--text-primary)',
          }}
          whileTap={{ scale: 0.95 }}
          title="新建会话"
          aria-label="新建会话"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
        </motion.button>
      </div>

      {/* 
        Thread List 
        真正的滚动列表承载区域 (overflow-y-auto) 
      */}
      <div className="flex-1 overflow-y-auto px-1.5 sm:px-2 py-2 space-y-3 sm:space-y-4">
        {/* Today - 渲染“今天”的分组 */}
        <div>
          <div
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}
          >
            今天
          </div>
          <div className="space-y-0.5">
            {threadsData.today.map((thread) => (
              <ThreadItemComponent key={thread.id} thread={thread} />
            ))}
          </div>
        </div>

        {/* Yesterday - 渲染“昨天”的分组 */}
        <div>
          <div
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}
          >
            昨天
          </div>
          <div className="space-y-0.5">
            {threadsData.yesterday.map((thread) => (
              <ThreadItemComponent key={thread.id} thread={thread} />
            ))}
          </div>
        </div>
      </div>

      {/* 
        Quick Actions 
        底部常驻快捷操作区，如召唤“快捷指令”或全局命令面板
      */}
      <div className="p-2.5 sm:p-3 border-t" style={{ borderColor: 'var(--divider)' }}>
        <motion.button
          className="w-full flex items-center justify-center sm:justify-start gap-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all duration-200"
          style={{
            background: 'transparent',
            color: 'var(--text-secondary)',
          }}
          whileHover={{
            background: 'var(--glass-subtle)',
            color: 'var(--text-primary)',
          }}
          whileTap={{ scale: 0.99 }}
        >
          <HugeiconsIcon icon={AiMagicIcon} size={16} className="flex-shrink-0" style={{ color: 'var(--accent-purple)' }} />
          <span className="text-xs sm:text-sm hidden sm:inline">快捷指令</span>
        </motion.button>
      </div>
    </div>
  );
}
