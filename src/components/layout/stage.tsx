"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArtificialIntelligence08Icon,
  AiIdeaIcon,
  RoboticIcon,
  ArrowUp02Icon,
  InternetIcon,
  AiBrain01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, KeyboardEvent, useEffect, useRef } from "react";
import { useBananaChat } from "@/hooks/useBananaChat";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { ModelSelector } from "@/components/models/model-selector";

const QUICK_ACTIONS = [
  { icon: ArtificialIntelligence08Icon, label: "帮我写一段代码" },
  { icon: AiIdeaIcon, label: "解释一个概念" },
  { icon: RoboticIcon, label: "角色扮演对话" },
] as const;

function StageContent() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread") || "default-thread";
  const { messages, append, isLoading, error } = useBananaChat(threadId);
  const [input, setInput] = useState("");
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();

  const motionReduced = shouldReduceMotion || intensity === "low";
  const motionDuration = (value: number) =>
    Number((value * factors.duration).toFixed(3));
  const motionDistance = (value: number) =>
    Number((value * factors.distance).toFixed(3));
  const motionScale = (value: number) =>
    Number((1 - (1 - value) * factors.scale).toFixed(3));

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: motionReduced ? "auto" : "smooth",
      });
    }
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
      className="stage-aurora flex-1 flex flex-col min-w-0 min-h-0 h-full"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden px-4 sm:px-8 py-4 sm:py-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 overflow-hidden"
              style={{
                background: "var(--glass-elevated)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--shadow-lg)",
              }}
              initial={
                motionReduced ? false : { scale: motionScale(0.86), opacity: 0 }
              }
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: motionDuration(0.5),
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <img
                src="/logo.png"
                alt="Banana Logo"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.h2
              className="text-2xl sm:text-3xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
              initial={
                motionReduced ? false : { y: motionDistance(12), opacity: 0 }
              }
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: motionDuration(0.45),
                delay: motionDuration(0.05),
              }}
            >
              Banana
            </motion.h2>

            <motion.p
              className="text-sm sm:text-base text-center px-4 mb-6"
              style={{ color: "var(--text-secondary)" }}
              initial={
                motionReduced ? false : { y: motionDistance(12), opacity: 0 }
              }
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: motionDuration(0.45),
                delay: motionDuration(0.12),
              }}
            >
              欢迎使用，开始你的 AI 对话之旅
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-3 px-4"
              initial={
                motionReduced ? false : { opacity: 0, y: motionDistance(12) }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionDuration(0.45),
                delay: motionDuration(0.18),
              }}
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
                      : {
                          opacity: 0,
                          y: motionDistance(10),
                          scale: motionScale(0.98),
                        }
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
                  whileTap={
                    motionReduced ? undefined : { scale: motionScale(0.98) }
                  }
                  onClick={() => setInput(item.label)}
                >
                  <HugeiconsIcon icon={item.icon} size={16} />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 flex flex-col py-4 gap-3 w-full">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={
                  motionReduced
                    ? false
                    : {
                        opacity: 0,
                        y: motionDistance(16),
                        scale: motionScale(0.97),
                      }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: motionDuration(0.32),
                  ease: [0.22, 1, 0.36, 1],
                  delay: motionReduced
                    ? 0
                    : motionDuration(Math.min(index * 0.035, 0.14)),
                }}
                className={cn(
                  "message-bubble px-4 py-3 sm:px-5 sm:py-4 rounded-2xl",
                  msg.role === "user" 
                    ? "self-end max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]" 
                    : "w-full"
                )}
                style={{
                  background:
                    msg.role === "user"
                      ? "var(--brand-primary)"
                      : "var(--glass-surface)",
                  border: "1px solid var(--glass-border)",
                  color:
                    msg.role === "user"
                      ? "var(--text-primary-foreground)"
                      : "var(--text-primary)",
                  lineHeight: 1.6,
                  boxShadow:
                    msg.role === "user"
                      ? "var(--shadow-md)"
                      : "var(--shadow-sm)",
                  backdropFilter:
                    msg.role !== "user"
                      ? "blur(var(--blur-md)) saturate(180%)"
                      : "none",
                  WebkitBackdropFilter:
                    msg.role !== "user"
                      ? "blur(var(--blur-md)) saturate(180%)"
                      : "none",
                }}
              >
                <div
                  className="prose dark:prose-invert max-w-none w-full text-current"
                  style={{ overflowWrap: "anywhere" }}
                >
                  <ThoughtContent content={msg.content} />
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                className="ai-thinking self-start"
                initial={
                  motionReduced ? false : { opacity: 0, y: motionDistance(8) }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: motionDuration(0.22) }}
              >
                AI 正在思考...
              </motion.div>
            )}

            {error && (
              <motion.div
                className="self-start w-full px-4 py-3 rounded-2xl text-sm"
                initial={motionReduced ? false : { opacity: 0, y: motionDistance(8) }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "var(--danger-light)",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}


          </div>
        )}

        <div className="w-full mt-auto">
          <motion.div
            className="composer w-full rounded-2xl p-4 sm:p-5 transition-all duration-200 border"
            style={{
              background: "var(--glass-elevated)",
              borderColor: "var(--glass-border)",
              boxShadow: "var(--shadow-md)",
            }}
            initial={
              motionReduced ? false : { opacity: 0, y: motionDistance(12) }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionDuration(0.35),
              ease: [0.16, 1, 0.3, 1],
            }}
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
              className="w-full bg-transparent resize-none text-sm sm:text-base mb-3 p-0 outline-none"
              style={{
                color: "var(--text-primary)",
                minHeight: "44px",
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
                  whileHover={
                    motionReduced ? undefined : { y: motionDistance(-1) }
                  }
                >
                  <button
                    onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
                    style={{ 
                      color: isSearchEnabled ? "var(--brand-primary)" : "var(--text-tertiary)",
                      background: isSearchEnabled ? "var(--brand-primary-light)" : "transparent"
                    }}
                  >
                    <HugeiconsIcon icon={InternetIcon} size={14} />
                    <span className="hidden sm:inline">联网搜索</span>
                  </button>
                  <button
                    onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
                    style={{ 
                      color: isThinkingEnabled ? "var(--brand-primary)" : "var(--text-tertiary)",
                      background: isThinkingEnabled ? "var(--brand-primary-light)" : "transparent"
                    }}
                  >
                    <HugeiconsIcon icon={AiBrain01Icon} size={14} />
                    <span className="hidden sm:inline">深度思考</span>
                  </button>
                </motion.div>

                <ModelSelector disabled={isLoading} />
              </div>

              <motion.button
                className="stage-action-button w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full flex-shrink-0 outline-none"
                style={{
                  background: canSend
                    ? "var(--brand-primary)"
                    : "var(--glass-subtle)",
                  color: canSend
                    ? "var(--text-primary-foreground)"
                    : "var(--text-tertiary)",
                  boxShadow: canSend
                    ? "0 10px 24px var(--brand-primary-glow)"
                    : "none",
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
                whileTap={
                  canSend && !motionReduced
                    ? { scale: motionScale(0.95) }
                    : undefined
                }
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
                  <HugeiconsIcon
                    icon={ArrowUp02Icon}
                    size={20}
                    color={canSend ? "#ffffff" : undefined}
                  />
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reasoning Thought Component (Collapsible)
 */
function ThoughtBlock({ thought, isStreaming }: { thought: string; isStreaming: boolean }) {
  const [userExpanded, setUserExpanded] = useState(false);
  const isExpanded = isStreaming || userExpanded;

  return (
    <div
      className="text-xs mb-3 rounded-lg border bg-glass-subtle/50 overflow-hidden transition-colors duration-300 w-full"
      style={{
        borderColor: "var(--glass-border)",
      }}
    >
      {/* 头部：切换开关 */}
      <button
        onClick={() => !isStreaming && setUserExpanded(!userExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-3 transition-colors",
          !isStreaming && "hover:bg-glass-hover"
        )}
        disabled={isStreaming}
      >
        <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider opacity-70" style={{ color: "var(--text-tertiary)" }}>
          <HugeiconsIcon
            icon={AiBrain01Icon}
            size={12}
            className={cn(isStreaming && "animate-pulse")}
          />
          <span>{isStreaming ? "正在思考..." : "推理思维"}</span>
        </div>
        {!isStreaming && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} style={{ color: "var(--text-quaternary)" }} />
          </motion.div>
        )}
      </button>

      {/* 内容区：动画折叠 */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-3 pb-3 italic" style={{ color: "var(--text-tertiary)" }}>
              <ReactMarkdown>{thought}</ReactMarkdown>
              {isStreaming && (
                 <div className="flex gap-1 mt-2">
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce" />
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-delay:0.4s]" />
                 </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Main Content Parser for Messages
 */
function ThoughtContent({ content }: { content: string }) {
  // 处理推理思维解析
  let thought = "";
  let mainContent = content;
  let isThinking = false;

  const thinkStartIndex = content.indexOf("<think>");
  if (thinkStartIndex !== -1) {
    const thinkEndIndex = content.indexOf("</think>");
    if (thinkEndIndex !== -1) {
      thought = content.substring(thinkStartIndex + 7, thinkEndIndex).trim();
      mainContent = (content.substring(0, thinkStartIndex) + content.substring(thinkEndIndex + 8)).trim();
    } else {
      thought = content.substring(thinkStartIndex + 7).trim();
      mainContent = content.substring(0, thinkStartIndex).trim();
      isThinking = true;
    }
  }

  return (
    <>
      {thought && <ThoughtBlock thought={thought} isStreaming={isThinking} />}
      {mainContent && <ReactMarkdown>{mainContent}</ReactMarkdown>}
    </>
  );
}

export function Stage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <StageContent />
    </Suspense>
  );
}
