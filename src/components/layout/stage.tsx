"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArtificialIntelligence08Icon,
  AiIdeaIcon,
  RoboticIcon,
  ArrowUp02Icon,
  InternetIcon,
  AiBrain01Icon,
} from "@hugeicons/core-free-icons";
import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { useBananaChat } from "@/hooks/useBananaChat";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";

const QUICK_ACTIONS = [
  { icon: ArtificialIntelligence08Icon, label: "帮我写一段代码" },
  { icon: AiIdeaIcon, label: "解释一个概念" },
  { icon: RoboticIcon, label: "角色扮演对话" },
] as const;

export function Stage() {
  const { messages, append, isLoading } = useBananaChat("default-thread");
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();

  const motionReduced = shouldReduceMotion || intensity === "low";
  const motionDuration = (value: number) => Number((value * factors.duration).toFixed(3));
  const motionDistance = (value: number) => Number((value * factors.distance).toFixed(3));
  const motionScale = (value: number) =>
    Number((1 - (1 - value) * factors.scale).toFixed(3));

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: motionReduced ? "auto" : "smooth",
    });
  }, [messages, motionReduced]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    append({ role: "user", content: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = Boolean(input.trim()) && !isLoading;

  return (
    <div
      className="stage-aurora flex-1 flex flex-col min-w-0 h-full"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-8 py-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 overflow-hidden"
              style={{
                background: "var(--glass-elevated)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--shadow-lg)",
              }}
              initial={motionReduced ? false : { scale: motionScale(0.86), opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: motionDuration(0.5), ease: [0.22, 1, 0.36, 1] }}
            >
              <img src="/logo.png" alt="Banana Logo" className="w-full h-full object-cover" />
            </motion.div>

            <motion.h2
              className="text-2xl sm:text-3xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
              initial={motionReduced ? false : { y: motionDistance(12), opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: motionDuration(0.45), delay: motionDuration(0.05) }}
            >
              Banana
            </motion.h2>

            <motion.p
              className="text-sm sm:text-base text-center px-4 mb-6"
              style={{ color: "var(--text-secondary)" }}
              initial={motionReduced ? false : { y: motionDistance(12), opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: motionDuration(0.45), delay: motionDuration(0.12) }}
            >
              欢迎使用，开始你的 AI 对话之旅
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-3 px-4"
              initial={motionReduced ? false : { opacity: 0, y: motionDistance(12) }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: motionDuration(0.45), delay: motionDuration(0.18) }}
            >
              {QUICK_ACTIONS.map((item, index) => (
                <motion.button
                  key={item.label}
                  className="stage-action-button flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm"
                  style={{
                    background: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-primary)",
                  }}
                  initial={
                    motionReduced
                      ? false
                      : { opacity: 0, y: motionDistance(10), scale: motionScale(0.98) }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 24,
                    delay: motionDuration(0.24 + index * 0.05),
                  }}
                  whileHover={
                    motionReduced
                      ? undefined
                      : {
                          y: motionDistance(-3),
                          scale: Number((1 + 0.02 * factors.scale).toFixed(3)),
                          background: "var(--glass-hover)",
                          borderColor: "var(--glass-border-strong)",
                        }
                  }
                  whileTap={motionReduced ? undefined : { scale: motionScale(0.98) }}
                  onClick={() => setInput(item.label)}
                >
                  <HugeiconsIcon icon={item.icon} size={16} />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 px-2 sm:px-4 py-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={
                    motionReduced
                      ? false
                      : { opacity: 0, y: motionDistance(16), scale: motionScale(0.97) }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: motionDuration(0.32),
                    ease: [0.22, 1, 0.36, 1],
                    delay: motionReduced
                      ? 0
                      : motionDuration(Math.min(index * 0.035, 0.14)),
                  }}
                  className={`message-bubble max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] px-4 py-3 sm:px-5 sm:py-4 rounded-2xl ${
                    msg.role === "user" ? "self-end" : "self-start"
                  }`}
                  style={{
                    background: msg.role === "user" ? "var(--brand-primary)" : "var(--glass-surface)",
                    border: "1px solid var(--glass-border)",
                    color:
                      msg.role === "user" ? "var(--text-primary-foreground)" : "var(--text-primary)",
                    lineHeight: 1.6,
                    boxShadow: msg.role === "user" ? "var(--shadow-md)" : "var(--shadow-sm)",
                    backdropFilter:
                      msg.role !== "user" ? "blur(var(--blur-md)) saturate(180%)" : "none",
                    WebkitBackdropFilter:
                      msg.role !== "user" ? "blur(var(--blur-md)) saturate(180%)" : "none",
                  }}
                >
                  <div
                    className="prose dark:prose-invert max-w-none text-current"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                className="ai-thinking self-start"
                initial={motionReduced ? false : { opacity: 0, y: motionDistance(8) }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: motionDuration(0.22) }}
              >
                AI 正在思考...
              </motion.div>
            )}

            <div ref={endOfMessagesRef} />
          </div>
        )}

        <div className="w-full max-w-3xl mx-auto mt-auto">
          <motion.div
            className="composer rounded-2xl p-4 sm:p-5 transition-all duration-200 border"
            style={{
              background: "var(--glass-elevated)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--shadow-md)",
            }}
            initial={motionReduced ? false : { opacity: 0, y: motionDistance(12) }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration(0.35), ease: [0.16, 1, 0.3, 1] }}
          >
            <textarea
              placeholder="给 AI 发送消息... (Shift + Enter 换行)"
              aria-label="消息输入框"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              className="w-full bg-transparent resize-none text-sm sm:text-base mb-4 p-0 outline-none"
              style={{
                color: "var(--text-primary)",
                minHeight: "60px",
                maxHeight: "300px",
              }}
            />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  className="floating-chip flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs"
                  style={{ background: "var(--glass-subtle)" }}
                  role="group"
                  aria-label="功能开关"
                  whileHover={motionReduced ? undefined : { y: motionDistance(-1) }}
                >
                  <span className="flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                    <HugeiconsIcon icon={InternetIcon} size={14} />
                    <span className="hidden sm:inline">联网搜索</span>
                  </span>
                  <span className="flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                    <HugeiconsIcon icon={AiBrain01Icon} size={14} />
                    <span className="hidden sm:inline">深度思考</span>
                  </span>
                </motion.div>

                <motion.button
                  className="floating-chip px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: "var(--brand-primary-light)",
                    color: "var(--brand-primary)",
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="选择模型"
                  whileHover={
                    motionReduced
                      ? undefined
                      : {
                          y: motionDistance(-1),
                          scale: Number((1 + 0.02 * factors.scale).toFixed(3)),
                        }
                  }
                  whileTap={motionReduced ? undefined : { scale: motionScale(0.98) }}
                >
                  GPT-4o-mini
                </motion.button>
              </div>

              <motion.button
                className="stage-action-button w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full flex-shrink-0 outline-none"
                style={{
                  background: canSend ? "var(--brand-primary)" : "var(--glass-subtle)",
                  color: canSend ? "var(--text-primary-foreground)" : "var(--text-tertiary)",
                  boxShadow: canSend ? "0 10px 24px var(--brand-primary-glow)" : "none",
                }}
                aria-label="发送消息"
                onClick={handleSend}
                disabled={!canSend}
                whileHover={
                  canSend && !motionReduced
                    ? {
                        scale: Number((1 + 0.07 * factors.scale).toFixed(3)),
                        y: motionDistance(-1),
                      }
                    : undefined
                }
                whileTap={canSend && !motionReduced ? { scale: motionScale(0.95) } : undefined}
                animate={
                  canSend && !motionReduced
                    ? {
                        boxShadow: [
                          "0 8px 20px var(--brand-primary-glow)",
                          "0 12px 28px var(--brand-primary-glow)",
                          "0 8px 20px var(--brand-primary-glow)",
                        ],
                      }
                    : undefined
                }
                transition={
                  canSend && !motionReduced
                    ? {
                        duration: motionDuration(1.8),
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }
                    : undefined
                }
              >
                <motion.span
                  animate={
                    isLoading && !motionReduced
                      ? { rotate: [0, 180, 360] }
                      : { rotate: 0 }
                  }
                  transition={
                    isLoading && !motionReduced
                      ? {
                          duration: motionDuration(0.9),
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }
                      : { duration: motionDuration(0.2) }
                  }
                >
                  <HugeiconsIcon icon={ArrowUp02Icon} size={20} color={canSend ? "#ffffff" : undefined} />
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
