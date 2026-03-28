"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Loading01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { useReducedMotion } from "framer-motion";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import type { ToolInvocation } from "@/domain/chat/types";
import { isToolInvocationError } from "@/components/layout/stage-message-utils";
import { isReducedMotionMode } from "@/lib/animation-intensity";
import { MessageSurface } from "./message-surface";

interface ToolInvocationCardProps {
  tool: ToolInvocation;
}

export function ToolInvocationCard({ tool }: ToolInvocationCardProps) {
  const toolFailed = isToolInvocationError(tool.result);
  const shouldReduceMotion = useReducedMotion();
  const prefersReducedMotion = shouldReduceMotion ?? undefined;
  const { intensity } = useAnimationIntensity();
  const motionReduced = isReducedMotionMode(intensity, prefersReducedMotion);
  const argumentCount = Object.keys(tool.args ?? {}).length;
  const statusLabel = tool.state === "call" ? "执行中" : toolFailed ? "调用失败" : "已完成";
  const statusTone = toolFailed ? "danger" : tool.state === "call" ? "pending" : "success";
  const statusColor = toolFailed
    ? "var(--danger)"
    : tool.state === "call"
      ? "var(--brand-primary)"
      : "var(--success)";

  return (
    <MessageSurface
      variant="tool"
      aria-label={`${tool.toolName} 工具调用`}
      className="rounded-[22px] px-3.5 py-3 text-xs transition-all duration-300"
      data-tool-state={tool.state}
      data-tool-tone={statusTone}
    >
      <div className="flex items-center gap-3" data-testid="tool-invocation-layout">
        <div
          className="flex h-9 w-9 shrink-0 self-center items-center justify-center rounded-2xl border"
          data-testid="tool-invocation-icon-shell"
          style={{
            background: "rgba(255,255,255,0.14)",
            borderColor: "rgba(255,255,255,0.18)",
            color: "var(--text-secondary)",
          }}
        >
          <HugeiconsIcon icon={Wrench01Icon} size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span>工具调用</span>
            <span
              className="inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: statusColor, opacity: tool.state === "call" ? 0.85 : 0.72 }}
            />
          </div>

          <div className="min-w-0">
            <div className="truncate font-mono text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {tool.toolName}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
              {argumentCount} 个参数
            </div>
          </div>
        </div>

        <div
          className="inline-flex shrink-0 self-center items-center gap-1.5 rounded-full border px-2.5 py-1"
          data-testid="tool-invocation-status"
          style={{
            background: "rgba(255,255,255,0.12)",
            borderColor: "rgba(255,255,255,0.16)",
            color: statusColor,
          }}
        >
          {tool.state === "call" ? (
            <HugeiconsIcon
              icon={Loading01Icon}
              size={14}
              className={motionReduced ? "opacity-70" : "animate-spin opacity-70"}
            />
          ) : (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
          )}
          <span className="text-[10px] font-medium leading-none">{statusLabel}</span>
        </div>
      </div>
    </MessageSurface>
  );
}
