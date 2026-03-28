"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, KeyboardEvent, useEffect, useRef } from "react";
import { useBananaChat } from "@/hooks/useBananaChat";
import type { ChatMessage } from "@/domain/chat/types";
import { useToast } from "@/hooks/use-toast";
import { motion, useReducedMotion } from "framer-motion";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import {
  buildCopyableMessageContent,
} from "@/components/layout/stage-message-utils";
import { useStageModelContext } from "@/components/layout/stage/use-stage-model-context";
import { ComposerPanel } from "@/components/layout/stage/composer-panel";
import { ConversationView } from "@/components/layout/stage/conversation-view";

function StageContent() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread") || "default-thread";
  const { messages, append, isLoading, error, regenerate, updateMessageContent, stop } = useBananaChat(threadId);
  const toast = useToast();
  const [input, setInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  // ... (其余状态保持不变)

  const handleCopy = async (message: ChatMessage) => {
    const visibleContent = buildCopyableMessageContent(message);
    try {
      await navigator.clipboard.writeText(visibleContent);
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
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
  const { allModels, getModelInfo, thinkingMode, thinkingTooltip } = useStageModelContext(
    threadId,
    messages.length,
  );

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
      void handleSend();
    }
  };

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isLoading) return;
    const sent = await append(
      { role: "user", content: input.trim() },
      { isSearch: isSearchEnabled, isThink: isThinkingEnabled },
    );
    if (sent) {
      setInput("");
    }
  };

  const canSend = Boolean(input.trim()) && !isLoading;
  const errorBanner = error ? (
    <motion.div
      className="w-full px-4 py-3 rounded-2xl text-sm"
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
  ) : null;

  return (
    <div
      className="stage-aurora flex-1 flex flex-col min-w-0 min-h-0 h-full"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden px-4 sm:px-8 py-4 sm:py-6">
        <ConversationView
          allModels={allModels}
          editingContent={editingContent}
          editingMessageId={editingMessageId}
          errorBanner={errorBanner}
          getModelInfo={getModelInfo}
          isLoading={isLoading}
          messages={messages}
          motionReduced={motionReduced}
          onCancelEdit={handleCancelEdit}
          onCopy={(message) => {
            void handleCopy(message);
          }}
          onEdit={handleEdit}
          onEditingContentChange={setEditingContent}
          onInputPrefill={setInput}
          onRegenerate={(messageId) => {
            void handleRegenerate(messageId);
          }}
          onSaveEdit={(messageId) => {
            void handleSaveEdit(messageId);
          }}
          scrollContainerRef={scrollContainerRef}
          motionDistance={motionDistance}
          motionDuration={motionDuration}
          motionScale={motionScale}
          scaleFactor={factors.scale}
        />

        <ComposerPanel
          canSend={canSend}
          input={input}
          isLoading={isLoading}
          isSearchEnabled={isSearchEnabled}
          isThinkingEnabled={isThinkingEnabled}
          motionReduced={motionReduced}
          thinkingMode={thinkingMode}
          thinkingTooltip={thinkingTooltip}
          onInputChange={setInput}
          onKeyDown={handleKeyDown}
          onSend={() => {
            void handleSend();
          }}
          onStop={() => {
            stop();
          }}
          onToggleSearch={() => setIsSearchEnabled(!isSearchEnabled)}
          onToggleThinking={() => setIsThinkingEnabled(!isThinkingEnabled)}
          motionDistance={motionDistance}
          motionDuration={motionDuration}
          motionScale={motionScale}
          scaleFactor={factors.scale}
        />
      </div>
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
