"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArtificialIntelligence08Icon, AiIdeaIcon, RoboticIcon, ArrowUp02Icon, InternetIcon, AiBrain01Icon } from "@hugeicons/core-free-icons";
import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { useBananaChat } from "@/hooks/useBananaChat";
import { motion, AnimatePresence } from "framer-motion";

import ReactMarkdown from "react-markdown";

/**
 * @function Stage
 * @description 核心对白交互舞台 (Stage)。
 * 它是 AI 对话模块的主视图区，负责管理输入输出逻辑、对话气泡的生命周期及 Markdown 解析渲染。
 * 采用了典型的 Apple Liquid Glass (毛玻璃) 沉浸式设计系统。
 * 
 * @returns {JSX.Element} 完整的动态聊天主容器 DOM 与交互逻辑绑定
 */
export function Stage() {
  // 从自定义的 hook 中接入对指定 Thread ID 的流式渲染通道和加载状态
  const { messages, append, isLoading } = useBananaChat("default-thread");
  const [input, setInput] = useState("");
  // 获取末尾锚点 DOM，用以保证用户发消息或 AI 回复时列表持续平滑滚动到最新一条
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // 监听 messages 变动，自动将聊天列表自动拉取到底部
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 控制并下发当前输入至通道
  const handleSend = () => {
    // 防止用户发送空信息，或在上一次对话请求未完成时重复注入中断了通道稳定
    if (!input.trim() || isLoading) return;
    append({ role: "user", content: input.trim() });
    setInput("");
  };

  // 支持在键盘敲击时，如果捕捉到直接回车而不带 Shift，等同于点击“发送”按钮
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 如果尚未存在任何对话线索，则全屏展示欢迎状态（Empty State） */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {/* Logo 欢迎图形 - 浮出缩放缓动特效 */}
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 overflow-hidden"
              style={{
                background: 'var(--glass-elevated)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-lg)',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <img
                src="/logo.png"
                alt="Banana Logo"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.h2
              className="text-2xl sm:text-3xl font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Banana
            </motion.h2>
            <motion.p
              className="text-sm sm:text-base text-center px-4 mb-6"
              style={{ color: 'var(--text-secondary)' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              欢迎使用，开始您的 AI 对话之旅
            </motion.p>

            {/* Quick Action Buttons: 快捷填充意图的建议动作区 */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 px-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {[
                { icon: ArtificialIntelligence08Icon, label: '帮我写一段代码' },
                { icon: AiIdeaIcon, label: '解释一个概念' },
                { icon: RoboticIcon, label: '角色扮演对话' },
              ].map((item, index) => (
                <motion.button
                  key={item.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-all duration-200"
                  style={{
                    background: 'var(--glass-surface)',
                    borderColor: 'var(--glass-border)',
                    color: 'var(--text-primary)',
                  }}
                  whileHover={{
                    background: 'var(--glass-hover)',
                    borderColor: 'var(--glass-border-strong)',
                    y: -2, // 悬浮微微向上浮动
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() => {
                    setInput(item.label);
                    // 如果有需要，此事件甚至可以立刻执行 append 将请求提交给模型
                  }}
                >
                  <HugeiconsIcon icon={item.icon} size={16} />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          /* 当消息有存档时展现为瀑布流模式 */
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 px-2 sm:px-4 py-4">
            {/* 使用 AnimatePresence 确保动态生成的新消息能得到“从下往上方缓缓推入”（y: 12 -> 0）的出场动画保障 */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  // 判断并自动分配左右对齐：用户处于右侧（self-end），AI 模型位于左侧（self-start）
                  className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] px-4 py-3 sm:px-5 sm:py-4 rounded-2xl ${
                    msg.role === "user" ? "self-end" : "self-start"
                  }`}
                  style={{
                    // 用户气泡为主色调，AI 气泡则应用全景玻璃透出底色
                    background: msg.role === "user"
                      ? "var(--brand-primary)"
                      : "var(--glass-surface)",
                    border: "1px solid var(--glass-border)",
                    color: msg.role === "user" ? "var(--text-primary-foreground)" : "var(--text-primary)",
                    lineHeight: 1.6,
                    boxShadow: msg.role === "user" ? "var(--shadow-md)" : "var(--shadow-sm)",
                    // 仅对非用户的面板施加玻璃滤镜消耗，提升性能的同时也保障视觉通透感
                    backdropFilter: msg.role !== "user" ? "blur(var(--blur-md)) saturate(180%)" : "none",
                    WebkitBackdropFilter: msg.role !== "user" ? "blur(var(--blur-md)) saturate(180%)" : "none",
                  }}
                >
                  <div className="prose dark:prose-invert max-w-none text-current" style={{ overflowWrap: "anywhere" }}>
                    {/* 直接注入并负责将服务端流式的 Markdown 字符串渲染为正确的 HTML 富文本 */}
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {/* 该锚点负责滚动锁定核心区域 */}
            <div ref={endOfMessagesRef} />
          </div>
        )}

        {/* 
          Composer - 输入撰写核心面板 
          永远坐落于主工作流底部，即使历史会话极少也会因为 mt-auto 的作用贴靠下方。
        */}
        <div className="w-full max-w-3xl mx-auto mt-auto">
          <div
            className="composer rounded-2xl p-4 sm:p-5 transition-all duration-200 border"
            style={{
              background: 'var(--glass-elevated)',
              borderColor: 'var(--glass-border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* 多行长文本输入区，不支持自动 Resize */}
            <textarea
              placeholder="给 AI 发送消息... (Shift + Enter 换行)"
              aria-label="消息输入框"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false} // 关闭原生的底层高亮拼写警告
              autoComplete="off"
              autoCorrect="off"
              className="w-full bg-transparent resize-none text-sm sm:text-base mb-4 p-0 outline-none"
              style={{
                color: 'var(--text-primary)',
                minHeight: '60px',
                maxHeight: '300px',
              }}
            />
            {/* 工具栏功能挂载区及提交口 */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--glass-subtle)' }}
                  role="group"
                  aria-label="功能开关"
                >
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                    <HugeiconsIcon icon={InternetIcon} size={14} />
                    <span className="hidden sm:inline">联网搜索</span>
                  </span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                    <HugeiconsIcon icon={AiBrain01Icon} size={14} />
                    <span className="hidden sm:inline">深度思考</span>
                  </span>
                </div>
                {/* 默认模型标记指示器 */}
                <button
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'var(--brand-primary-light)',
                    color: 'var(--brand-primary)',
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="选择模型"
                >
                  GPT-4o-mini
                </button>
              </div>
              
              {/* 发送引擎起飞按钮：空文本或正在加载中保持非响应置灰色彩搭配 */}
              <motion.button
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full flex-shrink-0 outline-none"
                style={{
                  background: input.trim() && !isLoading ? 'var(--brand-primary)' : 'var(--glass-subtle)',
                  color: input.trim() && !isLoading ? 'var(--text-primary-foreground)' : 'var(--text-tertiary)',
                }}
                aria-label="发送消息"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
              >
                <HugeiconsIcon 
                  icon={ArrowUp02Icon} 
                  size={20} 
                  color={input.trim() && !isLoading ? '#ffffff' : undefined}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
