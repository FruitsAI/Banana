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
  Refresh01Icon,
  PencilEdit01Icon,
  Copy01Icon,
  Wrench01Icon,
  CheckmarkCircle01Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, KeyboardEvent, useEffect, useRef } from "react";
import { useBananaChat } from "@/hooks/useBananaChat";
import type { ChatMessage } from "@/domain/chat/types";
import { useToast } from "@/hooks/use-toast";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { ModelSelector, ModelIcon } from "@/components/models/model-selector";
import { IridescentBorder } from "@/components/ui/iridescent-border";
import { getModelsByProviderForChat, getProvidersForChat } from "@/services/chat";
import type { Model } from "@/lib/db";

const QUICK_ACTIONS = [
  { icon: ArtificialIntelligence08Icon, label: "帮我写一段代码" },
  { icon: AiIdeaIcon, label: "解释一个概念" },
  { icon: RoboticIcon, label: "角色扮演对话" },
] as const;

const formatMessageTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  } catch {
    return "";
  }
};

function StageContent() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread") || "default-thread";
  const { messages, append, isLoading, error, regenerate, updateMessageContent } = useBananaChat(threadId);
  const toast = useToast();
  const [input, setInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  // ... (其余状态保持不变)

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("已复制到剪贴板");
  };

  const handleEdit = (id: string, content: string) => {
    setEditingMessageId(id);
    setEditingContent(content);
  };

  const handleSaveEdit = async (id: string) => {
    const nextContent = editingContent.trim();
    if (!nextContent) return;

    // Close the editor immediately so the rerun streams in the normal bubble view.
    setEditingMessageId(null);
    setEditingContent("");

    // Adapter edits + reruns in one call, so avoid a second regenerate trigger here.
    await updateMessageContent(id, nextContent, { isSearch: isSearchEnabled, isThink: isThinkingEnabled });
    // 保存后自动触发重新生成，并透传当前状态
    // regenerate is handled by updateMessageContent for user edits.
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleRegenerate = async (msgId: string) => {
    if (isLoading) return;
    await regenerate(msgId, { isSearch: isSearchEnabled, isThink: isThinkingEnabled });
  };

  // ... (在消息循环中使用这些函数)
  const [isSearchEnabled, setIsSearchEnabled] = useState(true);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();

  // 获取所有加载到的模型（用于历史模型匹配）
  const [allModels, setAllModels] = useState<Model[]>([]);
  useEffect(() => {
    const loadAllModels = async () => {
      try {
        const providers = await getProvidersForChat();
        const modelsResults = await Promise.all(
          providers.map(p => getModelsByProviderForChat(p.id))
        );
        setAllModels(modelsResults.flat());
      } catch (e) {
        console.error("Failed to load all models for stage history", e);
      }
    };
    loadAllModels();
  }, [messages.length]);

  const getModelInfo = (modelId?: string) => {
    // 优先从消息绑定的 ID 匹配，找不到则回退到当前列表中的第一个模型（或 undefined）
    return allModels.find(m => m.id === modelId) || allModels[0];
  };

  // ... (在渲染循环中使用 getModelInfo(msg.modelId))

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    append({ role: "user", content: input.trim() }, { isSearch: isSearchEnabled, isThink: isThinkingEnabled });
    setInput("");
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
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 overflow-hidden relative"
              style={{
                background: "var(--glass-elevated)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--glass-depth)",
                backdropFilter: "blur(24px) saturate(200%) brightness(1.02)",
                WebkitBackdropFilter: "blur(24px) saturate(200%) brightness(1.02)",
                animation: "liquid-pulse 4s ease-in-out infinite",
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
              <IridescentBorder opacity={0.6} animated={true} />
              <img
                src="/logo.png"
                alt="Banana Logo"
                className="w-full h-full object-cover relative z-10"
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
                  className="stage-action-button flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm relative overflow-hidden group"
                  style={{
                    background: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-primary)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
                  <IridescentBorder className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <HugeiconsIcon icon={item.icon} size={16} />
                  <span className="relative z-10">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 flex flex-col pt-4 pb-32 gap-3 w-full" style={{ maxHeight: "100%" }}>
            {messages.map((msg: ChatMessage, index: number) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-2 mb-2",
                  msg.role === "user" ? "items-end" : "items-start"
                )}
              >
                {/* 头像区域 */}
                <motion.div
                  initial={motionReduced ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: motionReduced ? 0 : index * 0.05 }}
                  className="flex items-center gap-2 px-1"
                >
                  {msg.role === "user" ? (
                    <>
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-bold opacity-100 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>用户</span>
                        <span className="text-[10px] opacity-80 font-mono" style={{ color: "var(--text-secondary)" }}>{formatMessageTime(msg.createdAt)}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden" style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}>
                        <img src="/logo.png" alt="User" className="w-6 h-6 object-contain" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden scale-95 origin-center border" style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}>
                        <ModelIcon modelName={msg.modelId || allModels[0]?.id || "default"} />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[11px] font-bold opacity-100 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                          {getModelInfo(msg.modelId)?.name || "Banana AI"}
                        </span>
                        <span className="text-[10px] opacity-80 font-mono" style={{ color: "var(--text-secondary)" }}>{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    </>
                  )}
                </motion.div>

                <motion.div
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
                    "message-bubble px-4 py-3 sm:px-5 sm:py-4 rounded-2xl relative mx-10 group",
                    msg.role === "user" 
                      ? "self-end max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] rounded-tr-none" 
                      : "w-[calc(100%-80px)] rounded-tl-none"
                  )}
                  style={{
                    background:
                      msg.role === "user"
                        ? "var(--brand-primary-lighter)"
                        : "var(--glass-surface)",
                    border: editingMessageId === msg.id 
                      ? "1.5px solid var(--brand-primary)" 
                      : "1px solid var(--glass-border)",
                    color: "var(--text-primary)",
                    lineHeight: 1.6,
                    boxShadow: editingMessageId === msg.id
                      ? "0 0 0 3px var(--brand-primary-light)"
                      : "var(--shadow-sm)",
                    backdropFilter:
                      "blur(var(--blur-md)) saturate(180%)",
                    WebkitBackdropFilter:
                      "blur(var(--blur-md)) saturate(180%)",
                  }}
                >
                  {msg.role !== "user" && <IridescentBorder opacity={0.3} />}
                  <div
                    className="prose dark:prose-invert max-w-none w-full text-current relative z-10"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-4">
                        <textarea
                          className="w-full bg-transparent border-none p-0 text-sm resize-none focus:outline-none focus:ring-0 min-h-[24px]"
                          style={{
                            color: "var(--text-primary)",
                            lineHeight: 1.6,
                          }}
                          value={editingContent}
                          onChange={(e) => {
                            setEditingContent(e.target.value);
                            // 简单的自适应高度逻辑
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          autoFocus
                          onFocus={(e) => {
                            // 初始高度调整
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              handleSaveEdit(msg.id);
                            }
                            if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <div className="flex items-center justify-end gap-3 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="h-8 px-4 text-xs font-medium opacity-70 hover:opacity-100"
                          >
                            取消
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSaveEdit(msg.id)}
                            className="h-8 px-4 text-xs font-bold"
                          >
                             保存并重发
                          </Button>
                        </div>
                        <div className="text-[10px] opacity-30 text-right -mt-2">
                          ⌘ + Enter 快速保存
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                          <div className="flex flex-col gap-2 mb-3">
                            {msg.toolInvocations.map((tool, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs px-3 py-2 rounded-xl border transition-all duration-300" style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}>
                                <div className="flex items-center gap-2 font-mono text-xs opacity-80" style={{ color: "var(--text-primary)" }}>
                                  <HugeiconsIcon icon={Wrench01Icon} size={14} />
                                  <span className="font-semibold">{tool.toolName}</span>
                                </div>
                                <div className="flex items-center">
                                   {tool.state === 'call' ? (
                                      <HugeiconsIcon icon={Loading01Icon} size={14} className="animate-spin opacity-60" style={{ color: "var(--brand-primary)" }} />
                                   ) : (
                                      <div className="flex items-center gap-1 opacity-80" 
                                           style={{ color: (tool.result as any)?.isError ? "var(--semantic-error, #ef4444)" : "var(--semantic-success, #10b981)" }}>
                                        <span className="text-[10px]">{(tool.result as any)?.isError ? "调用失败" : "已完成"}</span>
                                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                                      </div>
                                   )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <ThoughtContent content={msg.content} />
                      </>
                    )}
                  </div>

                  {/* 悬停操作按钮组 */}
                  <div 
                    className={cn(
                      "absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 p-1 rounded-xl border z-20",
                      msg.role === "user" ? "right-0" : "left-0"
                    )}
                    style={{
                      background: "var(--glass-elevated)",
                      borderColor: "var(--glass-border)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <button 
                      onClick={() => handleRegenerate(msg.id)}
                      className="p-1.5 hover:bg-glass-hover rounded-lg transition-colors"
                      title="重新生成"
                    >
                      <HugeiconsIcon icon={Refresh01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
                    </button>
                    {msg.role === "user" && (
                      <button 
                        onClick={() => handleEdit(msg.id, msg.content)}
                        className="p-1.5 hover:bg-glass-hover rounded-lg transition-colors"
                        title="编辑"
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleCopy(msg.content)}
                      className="p-1.5 hover:bg-glass-hover rounded-lg transition-colors"
                      title="复制"
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
                    </button>
                  </div>
                </motion.div>
              </div>
            ))}

            {isLoading && (
              <motion.div
                className="ai-thinking self-start ml-14 mb-6"
                initial={
                  motionReduced ? false : { opacity: 0, y: motionDistance(8) }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: motionDuration(0.22) }}
              >
                <div 
                  className="flex items-center gap-2.5 text-[13px]"
                  style={{
                    color: "var(--text-secondary)",
                  }}
                >
                  <div className="flex gap-1 px-0.5">
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-duration:1s]" />
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-duration:1s] [animation-delay:0.4s]" />
                  </div>
                  <span className="font-medium opacity-80 tracking-tight">AI 正在思考...</span>
                </div>
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
              boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
              backdropFilter: "blur(40px) saturate(200%) brightness(1.02)",
              WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.02)",
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
                <div
                  className="flex items-center gap-1 sm:gap-1.5"
                  role="group"
                  aria-label="功能开关"
                >
                  <div className="relative group">
                    <motion.button
                      onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                      className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all duration-200 hover:bg-glass-hover"
                      style={{ 
                        color: isSearchEnabled ? "var(--brand-primary)" : "var(--text-tertiary)",
                        background: "transparent",
                        borderColor: isSearchEnabled ? "var(--brand-primary-border)" : "transparent",
                        borderWidth: isSearchEnabled ? "1px" : "0px"
                      }}
                      whileHover={motionReduced ? undefined : { y: motionDistance(-1.5) }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <HugeiconsIcon icon={InternetIcon} size={18} />
                    </motion.button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 origin-bottom border z-50 shadow-xl"
                      style={{ 
                        background: "var(--glass-elevated)", 
                        borderColor: "var(--glass-border)",
                        backdropFilter: "blur(8px)",
                        color: "var(--text-primary)"
                      }}>
                      {isSearchEnabled ? "关闭联网回复" : "开启联网回复"}
                    </div>
                  </div>

                  <div className="relative group">
                    <motion.button
                      onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                      className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all duration-200 hover:bg-glass-hover"
                      style={{ 
                        color: isThinkingEnabled ? "var(--brand-primary)" : "var(--text-tertiary)",
                        background: "transparent",
                        borderColor: isThinkingEnabled ? "var(--brand-primary-border)" : "transparent",
                        borderWidth: isThinkingEnabled ? "1px" : "0px"
                      }}
                      whileHover={motionReduced ? undefined : { y: motionDistance(-1.5) }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <HugeiconsIcon icon={AiBrain01Icon} size={18} />
                    </motion.button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 origin-bottom border z-50 shadow-xl"
                      style={{ 
                        background: "var(--glass-elevated)", 
                        borderColor: "var(--glass-border)",
                        backdropFilter: "blur(8px)",
                        color: "var(--text-primary)"
                      }}>
                      {isThinkingEnabled ? "关闭深度思考" : "开启深度思考"}
                    </div>
                  </div>
                </div>

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
  // 解析推理思维内容，支持 <think> 和 <思考> 标签
  let thought = "";
  let mainContent = content;
  let isThinking = false;

  // 同时支持英文 <think> 和中文 <思考> 标签
  const thinkPatterns = [
    { start: "<think>", end: "</think>" },
    { start: "<思考>", end: "</思考>" }
  ];

  for (const pattern of thinkPatterns) {
    const thinkStartIndex = content.indexOf(pattern.start);
    if (thinkStartIndex !== -1) {
      const thinkEndIndex = content.indexOf(pattern.end);
      if (thinkEndIndex !== -1) {
        // 完整的标签块
        thought = content.substring(thinkStartIndex + pattern.start.length, thinkEndIndex).trim();
        mainContent = (content.substring(0, thinkStartIndex) + content.substring(thinkEndIndex + pattern.end.length)).trim();
      } else {
        // 只有开始标签（正在流式输出）
        thought = content.substring(thinkStartIndex + pattern.start.length).trim();
        mainContent = content.substring(0, thinkStartIndex).trim();
        isThinking = true;
      }
      break; // 匹配到一组标签即退出，不支持嵌套或多组（符合主流 AI 行为）
    }
  }

  return (
    <div className="flex flex-col w-full">
      {thought && <ThoughtBlock thought={thought} isStreaming={isThinking} />}
      {mainContent && (
        <div className="w-full">
          <ReactMarkdown>{mainContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export function Stage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <StageContent />
    </Suspense>
  );
}
