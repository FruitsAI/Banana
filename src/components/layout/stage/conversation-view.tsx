"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiIdeaIcon,
  ArtificialIntelligence08Icon,
  Copy01Icon,
  PencilEdit01Icon,
  Refresh01Icon,
  RoboticIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { ModelIcon } from "@/components/models/model-selector";
import { IridescentBorder } from "@/components/ui/iridescent-border";
import { AssistantMessageBody } from "@/components/layout/stage/assistant-message";
import { formatMessageTime } from "@/components/layout/stage-message-utils";
import type { ChatMessage } from "@/domain/chat/types";
import type { Model } from "@/domain/models/types";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { icon: ArtificialIntelligence08Icon, label: "帮我写一段代码" },
  { icon: AiIdeaIcon, label: "解释一个概念" },
  { icon: RoboticIcon, label: "角色扮演对话" },
] as const;

interface ConversationViewProps {
  allModels: Model[];
  editingContent: string;
  editingMessageId: string | null;
  errorBanner: React.ReactNode;
  getModelInfo: (modelId?: string, providerId?: string) => Model | undefined;
  isLoading: boolean;
  messages: ChatMessage[];
  motionReduced: boolean;
  onCancelEdit: () => void;
  onCopy: (message: ChatMessage) => void;
  onEdit: (id: string, content: string) => void;
  onEditingContentChange: (value: string) => void;
  onInputPrefill: (value: string) => void;
  onRegenerate: (messageId: string) => void;
  onSaveEdit: (messageId: string) => void;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  motionDistance: (value: number) => number;
  motionDuration: (value: number) => number;
  motionScale: (value: number) => number;
  scaleFactor: number;
}

export function ConversationView({
  allModels,
  editingContent,
  editingMessageId,
  errorBanner,
  getModelInfo,
  isLoading,
  messages,
  motionReduced,
  onCancelEdit,
  onCopy,
  onEdit,
  onEditingContentChange,
  onInputPrefill,
  onRegenerate,
  onSaveEdit,
  scrollContainerRef,
  motionDistance,
  motionDuration,
  motionScale,
  scaleFactor,
}: ConversationViewProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="flex flex-col items-center max-w-2xl w-full">
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
            initial={motionReduced ? false : { scale: motionScale(0.86), opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: motionDuration(0.5),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <IridescentBorder opacity={0.6} animated={true} />
            <Image
              src="/logo.png"
              alt="Banana Logo"
              fill
              sizes="112px"
              className="object-cover relative z-10"
            />
          </motion.div>

          <motion.h2
            className="text-2xl sm:text-3xl font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
            initial={motionReduced ? false : { y: motionDistance(12), opacity: 0 }}
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
            initial={motionReduced ? false : { y: motionDistance(12), opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: motionDuration(0.45),
              delay: motionDuration(0.12),
            }}
          >
            欢迎使用，开始你的 AI 对话之旅
          </motion.p>

          {errorBanner && <div className="w-full max-w-xl px-4 mb-6">{errorBanner}</div>}

          <motion.div
            className="flex flex-wrap justify-center gap-3 px-4"
            initial={motionReduced ? false : { opacity: 0, y: motionDistance(12) }}
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
                        scale: Number((1 + 0.02 * scaleFactor).toFixed(3)),
                        background: "var(--glass-hover)",
                        borderColor: "var(--glass-border-strong)",
                      }
                }
                whileTap={motionReduced ? undefined : { scale: motionScale(0.98) }}
                onClick={() => onInputPrefill(item.label)}
              >
                <IridescentBorder className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <HugeiconsIcon icon={item.icon} size={16} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto min-h-0 flex flex-col pt-4 pb-32 gap-3 w-full"
      style={{ maxHeight: "100%" }}
    >
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn("flex flex-col gap-2 mb-2", message.role === "user" ? "items-end" : "items-start")}
        >
          <motion.div
            initial={motionReduced ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: motionReduced ? 0 : index * 0.05 }}
            className="flex items-center gap-2 px-1"
          >
            {message.role === "user" ? (
              <>
                <div className="flex flex-col items-end">
                  <span
                    className="text-[11px] font-bold opacity-100 uppercase tracking-wider"
                    style={{ color: "var(--text-primary)" }}
                  >
                    用户
                  </span>
                  <span
                    className="text-[10px] opacity-80 font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden"
                  style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                >
                  <Image
                    src="/logo.png"
                    alt="User"
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                  />
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden scale-95 origin-center border"
                  style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                >
                  <ModelIcon
                    modelName={
                      getModelInfo(message.modelId, message.providerId)?.name ||
                      message.modelId ||
                      allModels[0]?.id ||
                      "default"
                    }
                  />
                </div>
                <div className="flex flex-col items-start">
                  <span
                    className="text-[11px] font-bold opacity-100 uppercase tracking-wider"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {getModelInfo(message.modelId, message.providerId)?.name || "Banana AI"}
                  </span>
                  <span
                    className="text-[10px] opacity-80 font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {formatMessageTime(message.createdAt)}
                  </span>
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
              delay: motionReduced ? 0 : motionDuration(Math.min(index * 0.035, 0.14)),
            }}
            className={cn(
              "message-bubble px-4 py-3 sm:px-5 sm:py-4 rounded-2xl relative mx-10 group",
              message.role === "user"
                ? "self-end max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] rounded-tr-none"
                : "w-[calc(100%-80px)] rounded-tl-none",
            )}
            style={{
              background:
                message.role === "user" ? "var(--brand-primary-lighter)" : "var(--glass-surface)",
              border:
                editingMessageId === message.id
                  ? "1.5px solid var(--brand-primary)"
                  : "1px solid var(--glass-border)",
              color: "var(--text-primary)",
              lineHeight: 1.6,
              boxShadow:
                editingMessageId === message.id
                  ? "0 0 0 3px var(--brand-primary-light)"
                  : "var(--shadow-sm)",
              backdropFilter: "blur(var(--blur-md)) saturate(180%)",
              WebkitBackdropFilter: "blur(var(--blur-md)) saturate(180%)",
            }}
          >
            {message.role !== "user" && <IridescentBorder opacity={0.3} />}
            <div
              className="prose dark:prose-invert max-w-none w-full text-current relative z-10"
              style={{ overflowWrap: "anywhere" }}
            >
              {editingMessageId === message.id ? (
                <div className="flex flex-col gap-4">
                  <textarea
                    className="w-full bg-transparent border-none p-0 text-sm resize-none focus:outline-none focus:ring-0 min-h-[24px]"
                    style={{
                      color: "var(--text-primary)",
                      lineHeight: 1.6,
                    }}
                    value={editingContent}
                    onChange={(event) => {
                      onEditingContentChange(event.target.value);
                      event.target.style.height = "auto";
                      event.target.style.height = `${event.target.scrollHeight}px`;
                    }}
                    autoFocus
                    onFocus={(event) => {
                      event.target.style.height = "auto";
                      event.target.style.height = `${event.target.scrollHeight}px`;
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                        onSaveEdit(message.id);
                      }
                      if (event.key === "Escape") {
                        onCancelEdit();
                      }
                    }}
                  />
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancelEdit}
                      className="h-8 px-4 text-xs font-medium opacity-70 hover:opacity-100"
                    >
                      取消
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onSaveEdit(message.id)}
                      className="h-8 px-4 text-xs font-bold"
                    >
                      保存并重发
                    </Button>
                  </div>
                  <div className="text-[10px] opacity-30 text-right -mt-2">⌘ + Enter 快速保存</div>
                </div>
              ) : (
                <AssistantMessageBody message={message} />
              )}
            </div>

            <div
              className={cn(
                "absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 p-1 rounded-xl border z-20",
                message.role === "user" ? "right-0" : "left-0",
              )}
              style={{
                background: "var(--glass-elevated)",
                borderColor: "var(--glass-border)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={() => onRegenerate(message.id)}
                className="p-1.5 hover:bg-glass-hover rounded-lg transition-colors"
                title="重新生成"
              >
                <HugeiconsIcon icon={Refresh01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
              </button>
              {message.role === "user" && (
                <button
                  onClick={() => onEdit(message.id, message.content)}
                  className="p-1.5 hover:bg-glass-hover rounded-lg transition-colors"
                  title="编辑"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
                </button>
              )}
              <button
                onClick={() => onCopy(message)}
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
          initial={motionReduced ? false : { opacity: 0, y: motionDistance(8) }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDuration(0.22) }}
        >
          <div className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            <div className="flex gap-1 px-0.5">
              <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-duration:1s]" />
              <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
              <div className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-duration:1s] [animation-delay:0.4s]" />
            </div>
            <span className="font-medium opacity-80 tracking-tight">AI 正在思考...</span>
          </div>
        </motion.div>
      )}

      {errorBanner && <div className="self-start w-full">{errorBanner}</div>}
    </div>
  );
}
