"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ChatMessage } from "@/domain/chat/types";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { MessageSurface } from "@/components/chat/message-surface";
import { ToolInvocationCard } from "@/components/chat/tool-invocation-card";
import { cn } from "@/lib/utils";
import { extractThoughtContent } from "@/components/layout/stage-message-utils";
import { MessageMarkdown } from "@/components/layout/stage/message-markdown";
import { isReducedMotionMode } from "@/lib/animation-intensity";

function ThoughtBlock({ thought, isStreaming }: { thought: string; isStreaming: boolean }) {
  const [userExpanded, setUserExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const prefersReducedMotion = shouldReduceMotion ?? undefined;
  const { intensity } = useAnimationIntensity();
  const motionReduced = isReducedMotionMode(intensity, prefersReducedMotion);
  const isExpanded = isStreaming || userExpanded;

  return (
    <MessageSurface
      variant="reasoning"
      className="mb-3 w-full rounded-[22px] text-xs transition-colors duration-300"
    >
      <button
        onClick={() => !isStreaming && setUserExpanded(!userExpanded)}
        className={cn(
          "flex w-full items-center justify-between px-3.5 py-3 transition-colors",
          !isStreaming && "material-interactive",
        )}
        data-hover-surface="content"
        disabled={isStreaming}
      >
        <div
          className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider opacity-70"
          style={{ color: "var(--text-tertiary)" }}
        >
          <HugeiconsIcon
            icon={AiBrain01Icon}
            size={12}
            className={cn(isStreaming && !motionReduced && "animate-pulse")}
          />
          <span>{isStreaming ? "正在思考..." : "推理思维"}</span>
        </div>
        {!isStreaming && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={12}
              style={{ color: "var(--text-quaternary)" }}
            />
          </motion.div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-3.5 pb-3.5 italic" style={{ color: "var(--text-tertiary)" }}>
              <MessageMarkdown content={thought} />
              {isStreaming && (
                <div className="flex gap-1 mt-2">
                  <div className={cn("w-1 h-1 rounded-full bg-brand-primary", !motionReduced && "animate-bounce")} />
                  <div
                    className={cn(
                      "w-1 h-1 rounded-full bg-brand-primary",
                      !motionReduced && "animate-bounce [animation-delay:0.2s]",
                    )}
                  />
                  <div
                    className={cn(
                      "w-1 h-1 rounded-full bg-brand-primary",
                      !motionReduced && "animate-bounce [animation-delay:0.4s]",
                    )}
                  />
                </div>
              )}
            </div>
          </motion.div>
          )}
        </AnimatePresence>
    </MessageSurface>
  );
}

function ThoughtContent({ content, reasoning }: { content: string; reasoning?: string }) {
  const explicitReasoning = reasoning?.trim();
  const parsedContent = extractThoughtContent(content);
  const combinedReasoning = [explicitReasoning, parsedContent.thought]
    .filter((value): value is string => Boolean(value))
    .join("\n\n")
    .trim();

  if (combinedReasoning) {
    return (
      <div className="flex w-full flex-col gap-3">
        <ThoughtBlock thought={combinedReasoning} isStreaming={parsedContent.isThinking} />
        {parsedContent.mainContent && (
          <div className="w-full px-0.5">
            <MessageMarkdown content={parsedContent.mainContent} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {parsedContent.thought && (
        <ThoughtBlock thought={parsedContent.thought} isStreaming={parsedContent.isThinking} />
      )}
      {parsedContent.mainContent && (
        <div className="w-full px-0.5">
          <MessageMarkdown content={parsedContent.mainContent} />
        </div>
      )}
    </div>
  );
}

export function AssistantMessageBody({ message }: { message: ChatMessage }) {
  if (message.segments && message.segments.length > 0) {
    return (
      <div className="flex w-full flex-col gap-3.5">
        {message.segments.map((segment, index) => {
          if (segment.type === "reasoning") {
            return (
              <ThoughtBlock
                key={`${message.id}-reasoning-${index}`}
                thought={segment.content}
                isStreaming={segment.isStreaming === true}
              />
            );
          }

          if (segment.type === "tool") {
            return <ToolInvocationCard key={`${message.id}-tool-${index}`} tool={segment.toolInvocation} />;
          }

          return (
            <div key={`${message.id}-content-${index}`} className="w-full px-0.5">
              <MessageMarkdown content={segment.content} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {message.toolInvocations && message.toolInvocations.length > 0 && (
        <div className="mb-3 flex flex-col gap-2.5">
          {message.toolInvocations.map((tool, index) => (
            <ToolInvocationCard key={`${message.id}-legacy-tool-${index}`} tool={tool} />
          ))}
        </div>
      )}
      <ThoughtContent content={message.content} reasoning={message.reasoning} />
    </>
  );
}
