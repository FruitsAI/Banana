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
  return (
    <div className="w-full mt-auto">
      <motion.div
        className="composer w-full rounded-2xl p-4 sm:p-5 transition-all duration-200 border"
        style={{
          background: "var(--glass-elevated)",
          borderColor: "var(--glass-border)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
          backdropFilter: "blur(40px) saturate(200%) brightness(1.02)",
          WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.02)",
        }}
        initial={motionReduced ? false : { opacity: 0, y: motionDistance(12) }}
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
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
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
            <div className="flex items-center gap-1 sm:gap-1.5" role="group" aria-label="功能开关">
              <div className="relative group">
                <motion.button
                  onClick={onToggleSearch}
                  aria-label="切换联网搜索"
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all duration-200 hover:bg-glass-hover"
                  style={{
                    color: isSearchEnabled ? "var(--brand-primary)" : "var(--text-tertiary)",
                    background: "transparent",
                    borderColor: isSearchEnabled ? "var(--brand-primary-border)" : "transparent",
                    borderWidth: isSearchEnabled ? "1px" : "0px",
                  }}
                  whileHover={motionReduced ? undefined : { y: motionDistance(-1.5) }}
                  whileTap={{ scale: 0.95 }}
                >
                  <HugeiconsIcon icon={InternetIcon} size={18} />
                </motion.button>
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 origin-bottom border z-50 shadow-xl"
                  style={{
                    background: "var(--glass-elevated)",
                    borderColor: "var(--glass-border)",
                    backdropFilter: "blur(8px)",
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
                  title={thinkingTooltip}
                  data-thinking-mode={thinkingMode}
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all duration-200 hover:bg-glass-hover"
                  style={{
                    color: isThinkingEnabled
                      ? thinkingMode === "native"
                        ? "var(--brand-primary)"
                        : "var(--text-secondary)"
                      : "var(--text-tertiary)",
                    background: "transparent",
                    borderColor: isThinkingEnabled
                      ? thinkingMode === "native"
                        ? "var(--brand-primary-border)"
                        : "var(--glass-border)"
                      : "transparent",
                    borderWidth: isThinkingEnabled ? "1px" : "0px",
                  }}
                  whileHover={motionReduced ? undefined : { y: motionDistance(-1.5) }}
                  whileTap={{ scale: 0.95 }}
                >
                  <HugeiconsIcon icon={AiBrain01Icon} size={18} />
                </motion.button>
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 origin-bottom border z-50 shadow-xl"
                  style={{
                    background: "var(--glass-elevated)",
                    borderColor: "var(--glass-border)",
                    backdropFilter: "blur(8px)",
                    color: "var(--text-primary)",
                  }}
                >
                  {thinkingTooltip}
                </div>
              </div>
            </div>

            <ModelSelector disabled={isLoading} />
          </div>

          <motion.button
            className="stage-action-button w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full flex-shrink-0 outline-none"
            style={{
              background: canSend ? "var(--brand-primary)" : "var(--glass-subtle)",
              color: canSend ? "var(--text-primary-foreground)" : "var(--text-tertiary)",
              boxShadow: canSend ? "0 10px 24px var(--brand-primary-glow)" : "none",
            }}
            aria-label="发送消息"
            onClick={onSend}
            disabled={!canSend}
            whileHover={
              canSend && !motionReduced
                ? {
                    scale: Number((1 + 0.07 * scaleFactor).toFixed(3)),
                    y: motionDistance(-1),
                  }
                : undefined
            }
            whileTap={canSend && !motionReduced ? { scale: motionScale(0.95) } : undefined}
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
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
