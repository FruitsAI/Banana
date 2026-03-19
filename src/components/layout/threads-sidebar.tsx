"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { SearchInput } from "@/components/ui/search-input";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { v4 as uuidv4 } from "uuid";
import type { Thread } from "@/domain/chat/types";
import { useChatStore } from "@/stores/chat/useChatStore";

function formatTime(dateStr: string) {
  try {
    const date = new Date(dateStr.includes('T') || dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDayCategory(dateStr: string) {
  try {
    const date = new Date(dateStr.includes('T') || dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) return "today";
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "yesterday";
  } catch (e) {
    console.warn("Time parse failed", e);
  }
  return "earlier";
}

function ThreadItemComponent({ thread, index, selected, onClick, onContextMenu }: { thread: Thread; index: number; selected: boolean; onClick: () => void; onContextMenu: (e: React.MouseEvent, threadId: string) => void }) {
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
      onContextMenu={(e) => onContextMenu(e, thread.id)}
      className={`stage-action-button px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl cursor-pointer group border transition-all relative overflow-hidden ${
        selected ? 'selected-thread' : ''
      }`}
      style={{
        background: selected ? "var(--brand-primary-lighter)" : "transparent",
        borderColor: selected ? "var(--brand-primary-border)" : "var(--glass-border)",
        transformStyle: "preserve-3d",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
      <span 
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
        style={{
          padding: "1px",
          opacity: selected ? 0.6 : 0,
          background: "var(--iridescent-border)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          backgroundSize: "300% 300%",
          animation: selected ? "iridescent-border-flow 5s ease-in-out infinite" : "none",
        }}
      />
      {/* 悬停时显示的虹彩边框 */}
      <span 
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-300"
        style={{
          padding: "1px",
          background: "var(--iridescent-border)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div
        className="font-medium text-xs sm:text-sm mb-0.5 truncate relative z-10"
        style={{ color: selected ? "var(--brand-primary)" : "var(--text-primary)" }}
      >
        {thread.title || "新会话"}
      </div>
      <div className="text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 relative z-10" style={{ color: "var(--text-tertiary)" }}>
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
  const { loadThreads: loadThreadsFromStore, removeChatThread } = useChatStore();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; threadId: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const data = await loadThreadsFromStore();
      if (!data) return;
      // Sort descending by created_at or updated_at
      data.sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      });
      setThreads(data);
    } catch (e) {
      console.error("Failed to load threads", e);
    }
  }, [loadThreadsFromStore]);

  useEffect(() => {
    let ignore = false;
    
    const load = async () => {
      try {
        const data = await loadThreadsFromStore();
        if (ignore || !data) return;
        data.sort((a, b) => {
          const timeA = new Date(a.updated_at || a.created_at).getTime();
          const timeB = new Date(b.updated_at || b.created_at).getTime();
          return timeB - timeA;
        });
        setThreads(data);
      } catch (e) {
        console.error("Failed to load threads", e);
      }
    };

    load();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // 监听刷新事件
    const handleRefresh = () => {
      loadThreads();
    };
    
    window.addEventListener("refresh-threads", handleRefresh);

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener("click", handleClickOutside);

    return () => {
      ignore = true;
      window.removeEventListener("refresh-threads", handleRefresh);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [loadThreads, loadThreadsFromStore]);

  const handleContextMenu = (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, threadId });
  };

  const handleDeleteThread = async (id: string) => {
    try {
      await removeChatThread(id);
      setContextMenu(null);
      await loadThreads();
      
      // 如果删除的是当前选中的会话，跳转到新会话
      if (activeThreadId === id) {
        router.push("/");
      }
    } catch (e) {
      console.error("Failed to delete thread", e);
    }
  };

  const handleCreateThread = async () => {
    try {
      const newId = uuidv4();
      // 这里可以先不创建数据库记录，等发消息时核心 Hook 会处理
      // 导航到新 ID
      router.push(`/?thread=${newId}`);
    } catch (e) {
      console.error("Failed to create thread", e);
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (t.title || "新会话").toLowerCase().includes(query) || 
           (t.model_id || "").toLowerCase().includes(query);
  });

  const groupedThreads = {
    today: filteredThreads.filter((t) => getDayCategory(t.created_at) === "today"),
    yesterday: filteredThreads.filter((t) => getDayCategory(t.created_at) === "yesterday"),
    earlier: filteredThreads.filter((t) => getDayCategory(t.created_at) === "earlier"),
  };

  return (
    <motion.div
      className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full relative"
      style={{
        background: "var(--glass-surface)",
        backdropFilter: "blur(40px) saturate(200%) brightness(1.01)",
        WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.01)",
        borderRight: "1px solid var(--divider)",
        boxShadow: "2px 0 16px rgba(0,0,0,0.06)",
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
        <SearchInput
          containerClassName="flex-1 min-w-0"
          placeholder="搜索会话..."
          aria-label="搜索会话记录"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

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
                  onContextMenu={handleContextMenu}
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
                  onContextMenu={handleContextMenu}
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
                  onContextMenu={handleContextMenu}
                />
              ))}
            </div>
          </motion.div>
        )}

        {filteredThreads.length === 0 && searchQuery.trim() !== "" && (
          <motion.div
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-glass-subtle flex items-center justify-center mb-3 text-text-tertiary">
              <HugeiconsIcon icon={Search01Icon} size={24} />
            </div>
            <div className="text-sm font-medium text-text-secondary mb-1">未找到相关会话</div>
            <div className="text-xs text-text-tertiary">尝试换个关键词搜索</div>
          </motion.div>
        )}
      </div>

      {/* Context Menu - 使用 Portal 挂载到 body 以避免容器剪裁 */}
      {mounted && contextMenu && createPortal(
        <AnimatePresence>
          <motion.div
            key="context-menu"
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 9999,
              minWidth: "140px",
              background: "var(--glass-surface)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-lg)",
              padding: "4px",
            }}
          >
            <motion.button
              onClick={() => handleDeleteThread(contextMenu.threadId)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
              <span>删除会话</span>
            </motion.button>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
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
