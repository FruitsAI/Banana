"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  ArrowUp02Icon,
  InternetIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { KeyboardEvent } from "react";
import { ModelSelector } from "@/components/models/model-selector";
import { Button } from "@/components/ui/button";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { createMotionPresets } from "@/lib/motion-presets";

interface ComposerPanelProps {
  canSend: boolean;
  input: string;
  isLoading: boolean;
  isSearchEnabled: boolean;
  isThinkingEnabled: boolean;
  motionReduced: boolean;
  thinkingMode: "native" | "prompt-only";
  thinkingTooltip: string;
  onInputChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onToggleSearch: () => void;
  onToggleThinking: () => void;
  motionDistance: (value: number) => number;
  motionDuration: (value: number) => number;
  motionScale: (value: number) => number;
  scaleFactor: number;
}

export function ComposerPanel({
  canSend,
  input,
  isLoading,
  isSearchEnabled,
  isThinkingEnabled,
  motionReduced,
  thinkingMode,
  thinkingTooltip,
  onInputChange,
  onKeyDown,
  onSend,
  onToggleSearch,
  onToggleThinking,
  motionDistance,
  motionDuration,
  motionScale,
  scaleFactor,
}: ComposerPanelProps) {
  const motionPresets = createMotionPresets({
    reduced: motionReduced,
    duration: motionDuration,
    distance: motionDistance,
    scale: motionScale,
    scaleFactor,
  });

  return (
    <div className="w-full mt-auto">
      <motion.div
        className="composer w-full overflow-hidden rounded-[32px] border p-3 sm:p-4"
        data-testid="stage-composer"
        data-material-role="floating"
        data-motion-mode={motionReduced ? "reduced" : "standard"}
        style={{
          ...getMaterialSurfaceStyle("floating", "lg"),
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
        }}
        initial={motionPresets.panel.initial}
        animate={motionPresets.panel.animate}
        transition={motionPresets.panel.transition}
      >
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
            Banana Workspace
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
            Shift + Enter 换行
          </div>
        </div>

        <div
          className="rounded-[28px] border px-4 py-4 sm:px-5 sm:py-4"
          style={{
            ...getMaterialSurfaceStyle("content", "sm"),
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%), rgba(255,255,255,0.04)",
          }}
        >
          <textarea
            placeholder="描述你现在要推进的任务，Banana 会把上下文和工具一起接住"
            aria-label="消息输入框"
            rows={1}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            className="w-full resize-none bg-transparent p-0 text-[15px] outline-none sm:text-base"
            style={{
              color: "var(--text-primary)",
              minHeight: "84px",
              maxHeight: "300px",
            }}
          />
        </div>

        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3"
          style={{ borderColor: "rgba(255,255,255,0.14)" }}
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="flex items-center gap-1 rounded-full border px-1 py-1"
              role="group"
              aria-label="功能开关"
              style={{
                ...getMaterialSurfaceStyle("content", "sm"),
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), rgba(255,255,255,0.04)",
              }}
            >
              <div className="relative group">
                <motion.button
                  onClick={onToggleSearch}
                  aria-label="切换联网搜索"
                  aria-pressed={isSearchEnabled}
                  className="flex h-9 w-9 items-center justify-center rounded-full border"
                  style={{
                    color: isSearchEnabled ? "var(--brand-primary)" : "var(--text-tertiary)",
                    ...getMaterialSurfaceStyle(isSearchEnabled ? "accent" : "content", "sm"),
                  }}
                  type="button"
                  whileHover={motionPresets.control.hover}
                  whileTap={motionPresets.control.tap}
                  transition={motionPresets.control.transition}
                >
                  <HugeiconsIcon icon={InternetIcon} size={18} />
                </motion.button>
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 origin-bottom border z-50 shadow-xl"
                  style={{
                    ...getMaterialSurfaceStyle("floating", "sm"),
                    color: "var(--text-primary)",
                  }}
                >
                  {isSearchEnabled ? "关闭联网回复" : "开启联网回复"}
                </div>
              </div>

              <div className="relative group">
                <motion.button
                  onClick={onToggleThinking}
                  aria-label="切换深度思考"
                  aria-pressed={isThinkingEnabled}
                  title={thinkingTooltip}
                  data-thinking-mode={thinkingMode}
                  className="flex h-9 w-9 items-center justify-center rounded-full border"
                  style={{
                    color: isThinkingEnabled
                      ? thinkingMode === "native"
                        ? "var(--brand-primary)"
                        : "var(--text-secondary)"
                      : "var(--text-tertiary)",
                    ...getMaterialSurfaceStyle(isThinkingEnabled ? "accent" : "content", "sm"),
                  }}
                  type="button"
                  whileHover={motionPresets.control.hover}
                  whileTap={motionPresets.control.tap}
                  transition={motionPresets.control.transition}
                >
                  <HugeiconsIcon icon={AiBrain01Icon} size={18} />
                </motion.button>
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 origin-bottom border z-50 shadow-xl"
                  style={{
                    ...getMaterialSurfaceStyle("floating", "sm"),
                    color: "var(--text-primary)",
                  }}
                >
                  {thinkingTooltip}
                </div>
              </div>
            </div>

            <ModelSelector disabled={isLoading} />
          </div>

          <motion.div
            className="stage-action-button"
            data-testid="composer-send-control"
            style={{
              boxShadow: canSend ? "0 10px 24px var(--brand-primary-glow)" : "none",
            }}
            whileHover={
              canSend && !motionReduced
                ? {
                    scale: motionPresets.focus.active.scale,
                    y: motionDistance(-1),
                  }
                : undefined
            }
            whileTap={canSend ? motionPresets.control.tap : undefined}
            transition={motionPresets.focus.transition}
          >
            <Button
              variant="glass"
              surface={canSend ? "accent" : "content"}
              className="h-10 w-10 rounded-full border px-0 sm:h-11 sm:w-11"
              aria-label="发送消息"
              onClick={onSend}
              disabled={!canSend}
            >
              <motion.span
                animate={isLoading && !motionReduced ? { rotate: [0, 180, 360] } : { rotate: 0 }}
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
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
