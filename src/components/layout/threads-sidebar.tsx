"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Search01Icon, AiMagicIcon } from "@hugeicons/core-free-icons";
import { motion, useReducedMotion } from "framer-motion";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getThreads, createThread, type Thread } from "@/lib/db";

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDayCategory(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (isToday) return "today";

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "yesterday";

  return "earlier";
}

function ThreadItemComponent({ thread, index, selected, onClick }: { thread: Thread; index: number; selected: boolean; onClick: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();
  const motionReduced = shouldReduceMotion || intensity === "low";
  const motionDuration = (value: number) => Number((value * factors.duration).toFixed(3));
  const motionDistance = (value: number) => Number((value * factors.distance).toFixed(3));
  const motionScale = (value: number) =>
    Number((1 - (1 - value) * factors.scale).toFixed(3));

  return (
    <motion.div
      onClick={onClick}
      className="stage-action-button px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl cursor-pointer group border"
      style={{
        background: selected ? "var(--brand-primary-lighter)" : "transparent",
        borderColor: selected ? "var(--brand-primary-border)" : "var(--glass-border)",
        transformStyle: "preserve-3d",
      }}
      initial={motionReduced ? false : { opacity: 0, x: motionDistance(-8), y: motionDistance(4) }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: motionDuration(0.28),
        ease: [0.22, 1, 0.36, 1],
        delay: motionReduced ? 0 : motionDuration(Math.min(index * 0.04, 0.2)),
      }}
      whileHover={
        motionReduced
          ? undefined
          : {
              x: motionDistance(4),
              y: motionDistance(-1),
              rotateX: motionDistance(-2),
              rotateY: selected ? 0 : motionDistance(-2),
              background: selected ? "var(--brand-primary-light)" : "var(--glass-subtle)",
              borderColor: selected
                ? "var(--brand-primary-border-strong)"
                : "var(--glass-border-strong)",
            }
      }
      whileTap={motionReduced ? undefined : { scale: motionScale(0.99) }}
    >
      <div
        className="font-medium text-xs sm:text-sm mb-0.5 truncate"
        style={{ color: selected ? "var(--brand-primary)" : "var(--text-primary)" }}
      >
        {thread.title || "新会话"}
      </div>
      <div className="text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5" style={{ color: "var(--text-tertiary)" }}>
        <span>{formatTime(thread.created_at)}</span>
        <span style={{ color: "var(--text-quaternary)" }}>·</span>
        <span className="truncate">{thread.model_id || "默认模型"}</span>
      </div>
    </motion.div>
  );
}

function ThreadsSidebarContent() {
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();
  const motionReduced = shouldReduceMotion || intensity === "low";
  const motionDuration = (value: number) => Number((value * factors.duration).toFixed(3));
  const motionDistance = (value: number) => Number((value * factors.distance).toFixed(3));
  const motionScale = (value: number) =>
    Number((1 - (1 - value) * factors.scale).toFixed(3));

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get("thread");

  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const data = await getThreads();
      // Sort descending by created_at
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setThreads(data);
    } catch (e) {
      console.error("Failed to load threads", e);
    }
  };

  const handleCreateThread = async () => {
    try {
      const newId = uuidv4();
      await createThread(newId, "新会话");
      await loadThreads();
      router.push(`/?thread=${newId}`);
    } catch (e) {
      console.error("Failed to create thread", e);
    }
  };

  const groupedThreads = {
    today: threads.filter((t) => getDayCategory(t.created_at) === "today"),
    yesterday: threads.filter((t) => getDayCategory(t.created_at) === "yesterday"),
    earlier: threads.filter((t) => getDayCategory(t.created_at) === "earlier"),
  };

  return (
    <motion.div
      className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full"
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--divider)",
      }}
      initial={motionReduced ? false : { opacity: 0, x: motionDistance(-14) }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: motionDuration(0.35), ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-center justify-between gap-2">
        <h1 className="text-sm sm:text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          会话流
        </h1>
        <motion.div
          className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0"
          style={{
            background: "var(--success-light)",
            color: "var(--success)",
          }}
          whileHover={motionReduced ? undefined : { y: motionDistance(-1) }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "var(--success)" }}
            animate={
              motionReduced
                ? undefined
                : {
                    opacity: [0.8, 1, 0.8],
                    boxShadow: [
                      "0 0 0 0 var(--success-glow)",
                      "0 0 0 4px transparent",
                      "0 0 0 0 var(--success-glow)",
                    ],
                  }
            }
            transition={{
              duration: motionDuration(1.8),
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <span className="hidden sm:inline">本地已就绪</span>
          <span className="sm:hidden">就绪</span>
        </motion.div>
      </div>

      <div className="px-3 sm:px-4 pb-2 sm:pb-3 flex gap-2 min-w-0">
        <motion.div
          className="search flex-1 min-w-0 flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all duration-200 border"
          style={{
            background: "var(--glass-surface)",
            borderColor: "var(--glass-border)",
          }}
          whileFocus={motionReduced ? undefined : { scale: Number((1 + 0.01 * factors.scale).toFixed(3)) }}
        >
          <HugeiconsIcon icon={Search01Icon} size={16} className="flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
          <input
            placeholder="搜索..."
            className="flex-1 min-w-0 text-xs sm:text-sm placeholder:text-[var(--text-placeholder)] bg-transparent outline-none"
            style={{ color: "var(--text-primary)" }}
            aria-label="搜索会话记录"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />
        </motion.div>

        <motion.button
          onClick={handleCreateThread}
          className="sidebar-glow-btn stage-action-button w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            background: "var(--glass-subtle)",
            color: "var(--text-secondary)",
          }}
          whileHover={
            motionReduced
              ? undefined
              : {
                  y: motionDistance(-2),
                  scale: Number((1 + 0.04 * factors.scale).toFixed(3)),
                  background: "var(--glass-hover)",
                  color: "var(--text-primary)",
                }
          }
          whileTap={motionReduced ? undefined : { scale: motionScale(0.96) }}
          title="新建会话"
          aria-label="新建会话"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 sm:px-2 py-2 space-y-3 sm:space-y-4">
        {groupedThreads.today.length > 0 && (
          <motion.div
            initial={motionReduced ? false : { opacity: 0, y: motionDistance(8) }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration(0.3), delay: motionDuration(0.08) }}
          >
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              今天
            </div>
            <div className="space-y-0.5">
              {groupedThreads.today.map((thread, index) => (
                <ThreadItemComponent
                  key={thread.id}
                  thread={thread}
                  index={index}
                  selected={activeThreadId === thread.id}
                  onClick={() => router.push(`/?thread=${thread.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {groupedThreads.yesterday.length > 0 && (
          <motion.div
            initial={motionReduced ? false : { opacity: 0, y: motionDistance(8) }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration(0.3), delay: motionDuration(0.14) }}
          >
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              昨天
            </div>
            <div className="space-y-0.5">
              {groupedThreads.yesterday.map((thread, index) => (
                <ThreadItemComponent
                  key={thread.id}
                  thread={thread}
                  index={groupedThreads.today.length + index}
                  selected={activeThreadId === thread.id}
                  onClick={() => router.push(`/?thread=${thread.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {groupedThreads.earlier.length > 0 && (
          <motion.div
            initial={motionReduced ? false : { opacity: 0, y: motionDistance(8) }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration(0.3), delay: motionDuration(0.20) }}
          >
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              更早
            </div>
            <div className="space-y-0.5">
              {groupedThreads.earlier.map((thread, index) => (
                <ThreadItemComponent
                  key={thread.id}
                  thread={thread}
                  index={groupedThreads.today.length + groupedThreads.yesterday.length + index}
                  selected={activeThreadId === thread.id}
                  onClick={() => router.push(`/?thread=${thread.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-2.5 sm:p-3 border-t" style={{ borderColor: "var(--divider)" }}>
        <motion.button
          className="sidebar-glow-btn stage-action-button w-full flex items-center justify-center sm:justify-start gap-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all duration-200"
          style={{
            background: "transparent",
            color: "var(--text-secondary)",
          }}
          whileHover={
            motionReduced
              ? undefined
              : {
                  background: "var(--glass-subtle)",
                  color: "var(--text-primary)",
                  x: motionDistance(2),
                }
          }
          whileTap={motionReduced ? undefined : { scale: motionScale(0.99) }}
        >
          <HugeiconsIcon icon={AiMagicIcon} size={16} className="flex-shrink-0" style={{ color: "var(--accent-purple)" }} />
          <span className="text-xs sm:text-sm hidden sm:inline">快捷指令</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

export function ThreadsSidebar() {
  return (
    <Suspense fallback={<div className="w-60 sm:w-64 lg:w-72 flex-shrink-0 border-r border-[#ffffff1a] bg-[#1a1a1a]" />}>
      <ThreadsSidebarContent />
    </Suspense>
  );
}
