"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiIdeaIcon,
  ArtificialIntelligence08Icon,
  RoboticIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { RefObject } from "react";
import { MessageSurface } from "@/components/chat/message-surface";
import { MessageToolbar } from "@/components/chat/message-toolbar";
import { Button } from "@/components/ui/button";
import { ModelIcon } from "@/components/models/model-selector";
import { IridescentBorder } from "@/components/ui/iridescent-border";
import { AssistantMessageBody } from "@/components/layout/stage/assistant-message";
import { formatMessageTime } from "@/components/layout/stage-message-utils";
import type { ChatMessage } from "@/domain/chat/types";
import type { Model } from "@/domain/models/types";
import { createMotionPresets } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";

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
  const motionPresets = createMotionPresets({
    reduced: motionReduced,
    duration: motionDuration,
    distance: motionDistance,
    scale: motionScale,
    scaleFactor,
  });

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-end min-h-0 pb-4 sm:pb-6">
        <div className="max-w-4xl w-full mx-auto space-y-4 sm:space-y-5">
          <motion.div
            className="relative isolate overflow-hidden rounded-[32px] border p-6 sm:p-7 md:p-8"
            data-stage-tone="workspace-welcome"
            data-testid="stage-empty-hero"
            style={{
              ...getMaterialSurfaceStyle("content", "lg"),
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 100%), var(--material-content-background)",
            }}
            initial={motionReduced ? false : { y: motionDistance(14), opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: motionDuration(0.5),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div
              className="pointer-events-none absolute -top-12 right-[-8%] h-44 w-44 rounded-full blur-3xl"
              style={{ background: "rgba(59, 130, 246, 0.16)" }}
            />
            <div
              className="pointer-events-none absolute inset-x-10 top-0 h-px"
              style={{ background: "rgba(255,255,255,0.4)" }}
            />
            <div
              className="pointer-events-none absolute -left-10 bottom-[-22%] h-36 w-36 rounded-full blur-3xl"
              style={{ background: "rgba(255,255,255,0.18)" }}
            />

            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border sm:h-24 sm:w-24"
                style={{
                  ...getMaterialSurfaceStyle("floating", "md"),
                  boxShadow:
                    "0 18px 34px rgba(59, 130, 246, 0.16), inset 0 1px 0 rgba(255,255,255,0.48)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-2 rounded-[22px] blur-2xl"
                  style={{ background: "rgba(59, 130, 246, 0.24)" }}
                />
                <IridescentBorder opacity={0.32} animated={!motionReduced} />
                <Image
                  src="/logo.png"
                  alt="Banana Logo"
                  fill
                  sizes="80px"
                  className="object-cover relative z-10"
                />
              </div>

              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em]" style={{
                  ...getMaterialSurfaceStyle("floating", "sm"),
                  color: "var(--text-tertiary)",
                }}>
                  <span>Banana Workspace</span>
                  <span className="h-1 w-1 rounded-full" style={{ background: "var(--brand-primary)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>Liquid Glass</span>
                </div>
                <h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] sm:text-[2.2rem]" style={{ color: "var(--text-primary)" }}>
                  从一个清晰的提示开始
                </h2>
                <p
                  className="max-w-2xl text-sm leading-7 sm:text-[1.02rem]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  为当前任务输入指令，Banana 会把会话、模型和工具上下文一起接住，让聊天、工具与配置自然落在同一层工作流里。
                </p>
              </div>
            </div>
          </motion.div>

          {errorBanner && <div className="w-full">{errorBanner}</div>}

          <motion.div
            className="flex flex-wrap gap-3 px-1"
            data-testid="stage-quick-actions"
            data-stage-priority="secondary"
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
                className="stage-quick-action material-interactive stage-action-button relative overflow-hidden rounded-[22px] border px-4 py-2.5 text-sm"
                data-hover-surface="floating"
                style={{
                  ...getMaterialSurfaceStyle("content", "md"),
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-content-background)",
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
                whileHover={motionPresets.control.hover}
                whileTap={motionPresets.control.tap}
                onClick={() => onInputPrefill(item.label)}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-2xl border"
                    style={{
                      background: "rgba(255,255,255,0.14)",
                      borderColor: "rgba(255,255,255,0.18)",
                    }}
                  >
                    <HugeiconsIcon icon={item.icon} size={16} />
                  </span>
                  <span className="relative z-10 font-medium">{item.label}</span>
                </div>
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
                  style={{ ...getMaterialSurfaceStyle("floating", "sm") }}
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
                  style={{ ...getMaterialSurfaceStyle("floating", "sm") }}
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
              motionPresets.panel.initial
                ? {
                    ...motionPresets.panel.initial,
                    y: motionDistance(16),
                    scale: motionScale(0.97),
                  }
                : false
            }
            animate={motionPresets.panel.animate}
            transition={{
              ...motionPresets.panel.transition,
              duration: motionDuration(0.32),
              delay: motionReduced ? 0 : motionDuration(Math.min(index * 0.035, 0.14)),
            }}
          >
            <MessageSurface
              variant={message.role === "user" ? "user" : "assistant"}
              state={editingMessageId === message.id ? "editing" : "default"}
              className={cn(
                "message-bubble relative mx-10 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 group",
                message.role === "user"
                  ? "self-end max-w-[82%] rounded-tr-none sm:max-w-[72%] lg:max-w-[66%]"
                  : "w-full max-w-[780px] rounded-tl-none",
              )}
            >
              <div
                className="prose dark:prose-invert relative z-10 max-w-none w-full text-current"
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

              <MessageToolbar
                ownerId={message.id}
                align={message.role === "user" ? "right" : "left"}
                canEdit={message.role === "user"}
                onRegenerate={() => onRegenerate(message.id)}
                onEdit={
                  message.role === "user"
                    ? () => onEdit(message.id, message.content)
                    : undefined
                }
                onCopy={() => onCopy(message)}
              />
            </MessageSurface>
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
              <div
                className={cn(
                  "w-1 h-1 rounded-full bg-brand-primary",
                  !motionReduced && "animate-bounce [animation-duration:1s]",
                )}
              />
              <div
                className={cn(
                  "w-1 h-1 rounded-full bg-brand-primary",
                  !motionReduced && "animate-bounce [animation-duration:1s] [animation-delay:0.2s]",
                )}
              />
              <div
                className={cn(
                  "w-1 h-1 rounded-full bg-brand-primary",
                  !motionReduced && "animate-bounce [animation-duration:1s] [animation-delay:0.4s]",
                )}
              />
            </div>
            <span className="font-medium opacity-80 tracking-tight">AI 正在思考...</span>
          </div>
        </motion.div>
      )}

      {errorBanner && <div className="self-start w-full">{errorBanner}</div>}
    </div>
  );
}
