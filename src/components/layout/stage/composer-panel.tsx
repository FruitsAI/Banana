"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  ArrowUp02Icon,
  InternetIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { KeyboardEvent, useCallback, useLayoutEffect, useRef } from "react";
import { ModelSelector } from "@/components/models/model-selector";
import { Button } from "@/components/ui/button";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import {
  getLiquidSelectionState,
  getLiquidSelectionStyle,
} from "@/components/ui/liquid-selection";
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

const MIN_TEXTAREA_HEIGHT_PX = 56;
const MAX_TEXTAREA_HEIGHT_PX = 160;

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const motionPresets = createMotionPresets({
    reduced: motionReduced,
    duration: motionDuration,
    distance: motionDistance,
    scale: motionScale,
    scaleFactor,
  });

  const syncTextareaHeight = useCallback(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, MAX_TEXTAREA_HEIGHT_PX);
    textareaRef.current.style.height = `${Math.max(nextHeight, MIN_TEXTAREA_HEIGHT_PX)}px`;
    textareaRef.current.style.overflowY =
      textareaRef.current.scrollHeight > MAX_TEXTAREA_HEIGHT_PX ? "auto" : "hidden";
  }, []);

  // Resize before paint so the composer does not jump for one frame after each edit.
  useLayoutEffect(() => {
    syncTextareaHeight();
  }, [input, syncTextareaHeight]);

  return (
    <div className="w-full mt-auto">
      <motion.div
        className="composer w-full overflow-hidden rounded-[32px] border p-1.5 sm:p-2"
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
        <div
          className="w-full rounded-[24px] px-3 py-2"
          data-surface-tone="liquid-textarea-field"
          style={{
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <textarea
            ref={textareaRef}
            aria-label="消息输入框"
            placeholder="输入你的任务，Banana 会接住上下文和工具"
            rows={1}
            value={input}
            onChange={(event) => {
              onInputChange(event.target.value);
              syncTextareaHeight();
            }}
            onKeyDown={onKeyDown}
            onFocus={() => {
              syncTextareaHeight();
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            className="w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-6 outline-none sm:text-base"
            style={{
              color: "var(--text-primary)",
              minHeight: `${MIN_TEXTAREA_HEIGHT_PX}px`,
              maxHeight: `${MAX_TEXTAREA_HEIGHT_PX}px`,
            }}
          />
        </div>

        <div
          className="mt-0 flex flex-wrap items-center justify-between gap-2 border-t pt-0"
          data-testid="composer-controls-row"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border sm:h-9 sm:w-9"
                  data-hover-surface={isSearchEnabled ? "accent" : "content"}
                  data-selection-style={getLiquidSelectionState(isSearchEnabled)}
                  style={getLiquidSelectionStyle({
                    active: isSearchEnabled,
                    inactiveRole: "content",
                  })}
                  type="button"
                  whileHover={motionPresets.control.hover}
                  whileTap={motionPresets.control.tap}
                  transition={motionPresets.control.transition}
                >
                  <HugeiconsIcon
                    icon={InternetIcon}
                    size={18}
                    color={
                      isSearchEnabled
                        ? "var(--selection-active-foreground, var(--brand-primary))"
                        : "var(--icon-muted)"
                    }
                  />
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border sm:h-9 sm:w-9"
                  data-hover-surface={isThinkingEnabled ? "accent" : "content"}
                  data-selection-style={getLiquidSelectionState(isThinkingEnabled)}
                  style={getLiquidSelectionStyle({
                    active: isThinkingEnabled,
                    inactiveRole: "content",
                    activeTextColor:
                      thinkingMode === "native"
                        ? "var(--selection-active-foreground, var(--brand-primary))"
                        : "var(--text-secondary)",
                  })}
                  type="button"
                  whileHover={motionPresets.control.hover}
                  whileTap={motionPresets.control.tap}
                  transition={motionPresets.control.transition}
                >
                  <HugeiconsIcon
                    icon={AiBrain01Icon}
                    size={18}
                    color={
                      isThinkingEnabled
                        ? thinkingMode === "native"
                          ? "var(--selection-active-foreground, var(--brand-primary))"
                          : "var(--text-secondary)"
                        : "var(--icon-muted)"
                    }
                  />
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
              variant={canSend ? "default" : "glass"}
              surface={canSend ? undefined : "content"}
              className="h-10 w-10 rounded-full px-0 disabled:opacity-100 sm:h-11 sm:w-11"
              aria-label="发送消息"
              data-send-state={canSend ? "enabled" : "disabled"}
              onClick={onSend}
              disabled={!canSend}
              style={
                canSend
                  ? {
                      background:
                        "linear-gradient(180deg, #60A5FA 0%, var(--brand-primary) 100%)",
                      border: "1px solid rgba(59, 130, 246, 0.34)",
                      boxShadow:
                        "0 14px 30px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.24)",
                      color: "#ffffff",
                    }
                  : {
                      background:
                        "linear-gradient(180deg, rgba(248,250,252,0.94) 0%, rgba(226,232,240,0.9) 100%)",
                      border: "1px solid rgba(148, 163, 184, 0.38)",
                      boxShadow:
                        "0 8px 20px rgba(148,163,184,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
                      color: "rgba(100, 116, 139, 0.9)",
                    }
              }
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
