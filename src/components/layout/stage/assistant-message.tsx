"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Loading01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import type { ChatMessage, ToolInvocation } from "@/domain/chat/types";
import { cn } from "@/lib/utils";
import { extractThoughtContent, isToolInvocationError } from "@/components/layout/stage-message-utils";

const markdownComponents: Components = {
  hr: () => (
    <hr
      className="glass-markdown-divider my-6 h-px border-0 rounded-full"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, var(--glass-border) 18%, var(--brand-primary-light) 50%, var(--glass-border) 82%, transparent 100%)",
        boxShadow: "0 0 12px var(--brand-primary-light)",
        opacity: 0.72,
      }}
    />
  ),
};

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
      <button
        onClick={() => !isStreaming && setUserExpanded(!userExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-3 transition-colors",
          !isStreaming && "hover:bg-glass-hover",
        )}
        disabled={isStreaming}
      >
        <div
          className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider opacity-70"
          style={{ color: "var(--text-tertiary)" }}
        >
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
            <div className="px-3 pb-3 italic" style={{ color: "var(--text-tertiary)" }}>
              <ReactMarkdown components={markdownComponents}>{thought}</ReactMarkdown>
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

function ToolInvocationCard({ tool }: { tool: ToolInvocation }) {
  const toolFailed = isToolInvocationError(tool.result);

  return (
    <div
      className="flex items-center justify-between text-xs px-3 py-2 rounded-xl border transition-all duration-300"
      style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
    >
      <div
        className="flex items-center gap-2 font-mono text-xs opacity-80"
        style={{ color: "var(--text-primary)" }}
      >
        <HugeiconsIcon icon={Wrench01Icon} size={14} />
        <span className="font-semibold">{tool.toolName}</span>
      </div>
      <div className="flex items-center">
        {tool.state === "call" ? (
          <HugeiconsIcon
            icon={Loading01Icon}
            size={14}
            className="animate-spin opacity-60"
            style={{ color: "var(--brand-primary)" }}
          />
        ) : (
          <div
            className="flex items-center gap-1 opacity-80"
            style={{
              color: toolFailed
                ? "var(--semantic-error, #ef4444)"
                : "var(--semantic-success, #10b981)",
            }}
          >
            <span className="text-[10px]">{toolFailed ? "调用失败" : "已完成"}</span>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
          </div>
        )}
      </div>
    </div>
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
      <div className="flex flex-col w-full">
        <ThoughtBlock thought={combinedReasoning} isStreaming={parsedContent.isThinking} />
        {parsedContent.mainContent && (
          <div className="w-full">
            <ReactMarkdown components={markdownComponents}>{parsedContent.mainContent}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {parsedContent.thought && (
        <ThoughtBlock thought={parsedContent.thought} isStreaming={parsedContent.isThinking} />
      )}
      {parsedContent.mainContent && (
        <div className="w-full">
          <ReactMarkdown components={markdownComponents}>{parsedContent.mainContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export function AssistantMessageBody({ message }: { message: ChatMessage }) {
  if (message.segments && message.segments.length > 0) {
    return (
      <div className="flex flex-col gap-3 w-full">
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
            <div key={`${message.id}-content-${index}`} className="w-full">
              <ReactMarkdown components={markdownComponents}>{segment.content}</ReactMarkdown>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {message.toolInvocations && message.toolInvocations.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {message.toolInvocations.map((tool, index) => (
            <ToolInvocationCard key={`${message.id}-legacy-tool-${index}`} tool={tool} />
          ))}
        </div>
      )}
      <ThoughtContent content={message.content} reasoning={message.reasoning} />
    </>
  );
}
