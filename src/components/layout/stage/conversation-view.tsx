"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiIdeaIcon,
  ArtificialIntelligence08Icon,
  RoboticIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { RefObject, useEffect, useState } from "react";
import { MessageSurface } from "@/components/chat/message-surface";
import { MessageToolbar } from "@/components/chat/message-toolbar";
import { Button } from "@/components/ui/button";
import { ModelIcon } from "@/components/models/model-selector";
import { IridescentBorder } from "@/components/ui/iridescent-border";
import { TextareaField } from "@/components/ui/textarea-field";
import { AssistantMessageBody } from "@/components/layout/stage/assistant-message";
import { formatMessageTime } from "@/components/layout/stage-message-utils";
import { UserMessageBody } from "@/components/layout/stage/user-message-body";
import type { ChatMessage } from "@/domain/chat/types";
import type { Model } from "@/domain/models/types";
import { createMotionPresets } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { getLiquidSelectionState, getLiquidSelectionStyle } from "@/components/ui/liquid-selection";

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
  const [themeMode, setThemeMode] = useState<"unknown" | "light" | "dark">("unknown");
  const isDarkTheme = themeMode === "dark";
  const shouldAnimateEmptyHero = !motionReduced && themeMode === "light";

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    // Keep the empty-state motion in sync with next-themes class flips without
    // waiting for a full rerender from outside the stage.
    const syncThemeMode = () => {
      setThemeMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };

    syncThemeMode();

    const observer = new MutationObserver(() => {
      syncThemeMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center min-h-0 py-3 sm:py-4">
        <div className="max-w-2xl w-full mx-auto flex flex-col items-center gap-4 sm:gap-5">
          <motion.div
            className="relative flex items-center justify-center py-6 sm:py-8"
            data-stage-tone="workspace-welcome"
            data-testid="stage-empty-hero"
            initial={motionReduced ? false : { y: motionDistance(14), opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: motionDuration(0.5),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {!isDarkTheme ? (
              <motion.div
                aria-hidden="true"
                data-testid="stage-empty-halo"
                className="pointer-events-none absolute h-36 w-36 rounded-full blur-3xl sm:h-44 sm:w-44"
                style={{
                  background:
                    "radial-gradient(circle, rgba(59,130,246,0.26) 0%, rgba(59,130,246,0.12) 38%, rgba(255,255,255,0.02) 72%, transparent 100%)",
                }}
                animate={
                  shouldAnimateEmptyHero
                    ? { opacity: [0.18, 0.34, 0.18], scale: [0.92, 1.14, 0.92] }
                    : { opacity: 0.22, scale: 1 }
                }
                transition={
                  shouldAnimateEmptyHero
                    ? {
                        duration: motionDuration(2.8),
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }
                    : undefined
                }
              />
            ) : null}

            <motion.div
              className="relative z-10 h-24 w-24 overflow-hidden rounded-[30px] border sm:h-28 sm:w-28"
              data-testid="stage-empty-logo-shell"
              data-empty-logo-animation={shouldAnimateEmptyHero ? "breathing" : "still"}
              style={{
                ...getMaterialSurfaceStyle("floating", "md"),
                borderColor: isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(59, 130, 246, 0.14)",
                background: isDarkTheme
                  ? "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%), color-mix(in srgb, var(--material-floating-background) 94%, transparent)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.1) 100%), rgba(255,255,255,0.08)",
              }}
              animate={
                shouldAnimateEmptyHero
                  ? {
                      scale: [1, 1.04, 1],
                      y: [0, -4, 0],
                      boxShadow: [
                        "0 14px 28px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.28)",
                        "0 22px 46px rgba(59,130,246,0.32), inset 0 1px 0 rgba(255,255,255,0.42)",
                        "0 14px 28px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.28)",
                      ],
                    }
                  : {
                      scale: 1,
                      y: 0,
                      boxShadow: isDarkTheme
                        ? "0 18px 36px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.12)"
                        : "0 16px 34px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.34)",
                    }
              }
              transition={
                shouldAnimateEmptyHero
                  ? {
                      duration: motionDuration(2.6),
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }
                  : undefined
              }
            >
              <IridescentBorder opacity={isDarkTheme ? 0.12 : 0.22} animated={shouldAnimateEmptyHero} />
              <Image
                src="/logo.png"
                alt="Banana Logo"
                fill
                sizes="112px"
                className="object-cover relative z-10"
              />
            </motion.div>
          </motion.div>

          {errorBanner && <div className="w-full">{errorBanner}</div>}

          <motion.div
            className="flex items-center justify-center gap-3"
            data-testid="stage-quick-actions"
            data-stage-priority="secondary"
            initial={motionReduced ? false : { opacity: 0, y: motionDistance(10) }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionDuration(0.4),
              delay: motionDuration(0.12),
            }}
          >
            {QUICK_ACTIONS.map((item, index) => (
              <motion.button
                key={item.label}
                className="stage-quick-action material-interactive stage-action-button relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] border"
                data-hover-surface="floating"
                aria-label={item.label}
                title={item.label}
                style={{
                  ...getMaterialSurfaceStyle("content", "md"),
                  background: isDarkTheme
                    ? "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%), var(--material-content-background)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%), var(--material-content-background)",
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
                  delay: motionDuration(0.18 + index * 0.05),
                }}
                whileHover={motionPresets.control.hover}
                whileTap={motionPresets.control.tap}
                onClick={() => onInputPrefill(item.label)}
              >
                <HugeiconsIcon icon={item.icon} size={18} />
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
      className="flex-1 overflow-y-auto min-h-0 flex flex-col pt-4 pb-14 sm:pb-16 gap-3 w-full"
      data-testid="stage-conversation-scroll"
      style={{ maxHeight: "100%" }}
    >
      {messages.map((message, index) => {
        const modelInfo = getModelInfo(message.modelId, message.providerId);

        return (
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
                        modelInfo?.name ||
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
                      {modelInfo?.name || "Banana AI"}
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
              className={cn(message.role === "assistant" && "w-full")}
            >
              <MessageSurface
                variant={message.role === "user" ? "user" : "assistant"}
                state={editingMessageId === message.id ? "editing" : "default"}
                className={cn(
                  "message-bubble relative mx-10 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 group",
                  message.role === "user"
                    ? "w-fit max-w-[calc(100%-80px)] self-end rounded-tr-none"
                    : "w-[calc(100%-80px)] rounded-tl-none",
                )}
              >
                <div
                  className={cn(
                    "relative z-10 text-current",
                    message.role === "user"
                      ? "inline-block max-w-full"
                      : "prose dark:prose-invert max-w-none w-full",
                  )}
                  style={{ overflowWrap: "anywhere" }}
                >
                {editingMessageId === message.id ? (
                  <div className="flex flex-col gap-4">
                    <TextareaField
                      autoFocus
                      autoResize
                      className="text-sm"
                      containerClassName="w-full"
                      minHeight={24}
                      maxHeight={240}
                      rows={1}
                      size="sm"
                      surface="content"
                      value={editingContent}
                      onChange={(event) => {
                        onEditingContentChange(event.target.value);
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
                  message.role === "user" ? (
                    <UserMessageBody content={message.content} />
                  ) : (
                    <AssistantMessageBody message={message} />
                  )
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
      );
      })}

      {isLoading && (
        <motion.div
          className="ai-thinking self-start ml-1 mb-6 w-fit max-w-[calc(100%-96px)] text-left"
          data-testid="stage-thinking-indicator"
          data-thinking-motion={motionReduced ? "still" : "animated"}
          data-thinking-surface="true"
          data-selection-style={getLiquidSelectionState(true)}
          initial={motionReduced ? false : { opacity: 0, y: motionDistance(8) }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDuration(0.22) }}
          style={getLiquidSelectionStyle({
            active: true,
            activeFill: "var(--selection-active-list-fill, var(--selection-active-fill))",
            activeShadow: "var(--selection-active-list-shadow, var(--selection-active-shadow))",
            activeBorderColor: "var(--selection-active-list-border, var(--selection-active-border))",
            activeTextColor: "var(--selection-active-foreground, var(--brand-primary))",
          })}
        >
          <div className="ai-thinking-content" data-thinking-copy="true">
            <div className="ai-thinking-orbs" data-thinking-orbs="true" aria-hidden="true">
              <div className="ai-thinking-dot" />
              <div className="ai-thinking-dot" />
              <div className="ai-thinking-dot" />
            </div>
            <span className="ai-thinking-label">AI 正在思考</span>
            <div
              className="ai-thinking-orbs ai-thinking-orbs-end"
              data-thinking-orbs="true"
              aria-hidden="true"
            >
              <div className="ai-thinking-dot" />
              <div className="ai-thinking-dot" />
              <div className="ai-thinking-dot" />
            </div>
          </div>
        </motion.div>
      )}

      {errorBanner && <div className="self-start w-full">{errorBanner}</div>}
    </div>
  );
}
