"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { SearchInput } from "@/components/ui/search-input";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { Suspense, useEffect, useState, useCallback, useRef, type RefCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { v4 as uuidv4 } from "uuid";
import type { Thread } from "@/domain/chat/types";
import { useChatStore } from "@/stores/chat/useChatStore";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import {
  getLiquidSelectionState,
  getLiquidSelectionStyle,
} from "@/components/ui/liquid-selection";
import { SidebarUtilityDock } from "@/components/layout/sidebar-utility-dock";
import { WorkspaceSidebarShell } from "@/components/layout/workspace-sidebar-shell";

const CONTEXT_MENU_WIDTH = 168;
const CONTEXT_MENU_HEIGHT = 60;
const CONTEXT_MENU_MARGIN = 12;
const THREADS_TOOLBAR_FLOAT_CLEARANCE = "8.75rem";
const THREADS_DOCK_FLOAT_CLEARANCE = "6rem";

function parseThreadDate(dateStr: string) {
  // Stored timestamps may arrive as UTC strings without a timezone suffix.
  const normalized = dateStr.includes("T") || dateStr.includes("Z")
    ? dateStr
    : dateStr.replace(" ", "T") + "Z";
  return new Date(normalized);
}

function formatTime(dateStr: string) {
  try {
    const date = parseThreadDate(dateStr);
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
    const date = parseThreadDate(dateStr);
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

function sortThreadsByActivity(threads: Thread[]): Thread[] {
  return [...threads].sort((a, b) => {
    const timeA = parseThreadDate(a.updated_at || a.created_at).getTime();
    const timeB = parseThreadDate(b.updated_at || b.created_at).getTime();
    return timeB - timeA;
  });
}

function clampContextMenuPosition(x: number, y: number) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return {
    x: Math.max(CONTEXT_MENU_MARGIN, Math.min(x, viewportWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN)),
    y: Math.max(CONTEXT_MENU_MARGIN, Math.min(y, viewportHeight - CONTEXT_MENU_HEIGHT - CONTEXT_MENU_MARGIN)),
  };
}

function ThreadItemComponent({
  thread,
  index,
  selected,
  onClick,
  onContextMenu,
  buttonRef,
}: {
  thread: Thread;
  index: number;
  selected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent<HTMLButtonElement>, threadId: string) => void;
  buttonRef?: RefCallback<HTMLButtonElement>;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();
  const motionReduced = shouldReduceMotion || intensity === "low";
  const motionDuration = (value: number) => Number((value * factors.duration).toFixed(3));
  const motionDistance = (value: number) => Number((value * factors.distance).toFixed(3));
  const motionScale = (value: number) =>
    Number((1 - (1 - value) * factors.scale).toFixed(3));

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, thread.id)}
      aria-current={selected ? "page" : undefined}
      className={`thread-list-item material-interactive stage-action-button w-full px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-2xl cursor-pointer group border text-left transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
        selected ? 'selected-thread' : ''
      }`}
      data-hover-surface={selected ? "accent" : "floating"}
      data-material-role="content"
      data-selection-style={getLiquidSelectionState(selected)}
      style={getLiquidSelectionStyle({
        active: selected,
        activeFill: "var(--selection-active-list-fill, var(--selection-active-fill))",
        activeShadow:
          "var(--selection-active-list-shadow, var(--selection-active-shadow))",
        activeBorderColor:
          "var(--selection-active-list-border, var(--selection-active-border))",
        inactiveRole: "content",
        inactiveFill:
          "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
      })}
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
              x: motionDistance(2),
              y: motionDistance(-1),
            }
      }
      whileTap={motionReduced ? undefined : { scale: motionScale(0.99) }}
      type="button"
    >
      <div
        className="font-medium text-xs sm:text-sm mb-0.5 truncate relative z-10"
        style={{
          color: selected
            ? "var(--selection-active-foreground, var(--brand-primary))"
            : "var(--text-primary)",
        }}
      >
        {thread.title || "新会话"}
      </div>
      <div
        className="text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 relative z-10"
        style={{
          color: selected ? "var(--selection-active-foreground-muted)" : "var(--text-secondary)",
        }}
      >
        <span>{formatTime(thread.created_at)}</span>
        <span
          style={{
            color: selected ? "var(--selection-active-foreground-muted)" : "var(--text-quaternary)",
          }}
        >
          ·
        </span>
        <span className="truncate">{thread.model_id || "默认模型"}</span>
      </div>
    </motion.button>
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
  const threadButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const isMountedRef = useRef(false);
  // Ignore stale async loads so slower refreshes cannot overwrite a newer sidebar snapshot.
  const loadRequestIdRef = useRef(0);

  const loadThreads = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    try {
      const data = await loadThreadsFromStore();
      if (!data || !isMountedRef.current || requestId !== loadRequestIdRef.current) return;
      setThreads(sortThreadsByActivity(data));
    } catch (e) {
      console.error("Failed to load threads", e);
    }
  }, [loadThreadsFromStore]);

  const restoreThreadFocus = useCallback((threadId: string) => {
    window.setTimeout(() => {
      threadButtonRefs.current.get(threadId)?.focus();
    }, 0);
  }, []);

  const closeContextMenu = useCallback((restoreFocus = false) => {
    setContextMenu((currentMenu) => {
      if (restoreFocus && currentMenu?.threadId) {
        restoreThreadFocus(currentMenu.threadId);
      }

      return null;
    });
  }, [restoreThreadFocus]);

  useEffect(() => {
    isMountedRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      void loadThreads();
    });

    // 监听刷新事件
    const handleRefresh = () => {
      void loadThreads();
    };
    
    window.addEventListener("refresh-threads", handleRefresh);

    return () => {
      window.cancelAnimationFrame(frame);
      isMountedRef.current = false;
      window.removeEventListener("refresh-threads", handleRefresh);
    };
  }, [loadThreads]);

  useEffect(() => {
    if (!contextMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeContextMenu(true);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeContextMenu(true);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeContextMenu, contextMenu]);

  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>, threadId: string) => {
    e.preventDefault();
    const trigger = e.currentTarget;
    trigger.focus();
    const position = clampContextMenuPosition(e.clientX, e.clientY);
    setContextMenu({ x: position.x, y: position.y, threadId });
  };

  const handleDeleteThread = async (id: string) => {
    try {
      await removeChatThread(id);
      closeContextMenu(false);
      await loadThreads();
      
      // 如果删除的是当前选中的会话，跳转到新会话
      if (activeThreadId === id) {
        router.push("/");
      }
    } catch (e) {
      console.error("Failed to delete thread", e);
    }
  };

  const getThreadButtonRef = useCallback((threadId: string): RefCallback<HTMLButtonElement> => {
    return (node) => {
      if (node) {
        threadButtonRefs.current.set(threadId, node);
        return;
      }

      threadButtonRefs.current.delete(threadId);
    };
  }, []);

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
    <WorkspaceSidebarShell
      testId="threads-sidebar-shell"
      initial={motionReduced ? false : { opacity: 0, x: motionDistance(-14) }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: motionDuration(0.35), ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20"
        data-testid="threads-sidebar-toolbar"
        data-sidebar-floating-layer="toolbar"
        style={{ top: "var(--workspace-sidebar-safe-area-top, 0px)" }}
      >
        <div className="pointer-events-auto px-1.5 sm:px-2 pt-3 sm:pt-4 pb-2 sm:pb-3">
          <div
            className="rounded-[26px] border px-3 py-3 sm:px-4 sm:py-4"
            style={{
              ...getMaterialSurfaceStyle("floating", "sm"),
              boxShadow: "none",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%), rgba(255,255,255,0.04)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
                  Library
                </div>
                <h1 className="mt-1 text-sm sm:text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  会话流
                </h1>
              </div>
              <motion.div
                className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium flex-shrink-0"
                style={{
                  background: "var(--material-floating-background)",
                  border: "1px solid var(--material-content-border)",
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

            <div className="mt-3 flex min-w-0 items-center gap-2" data-testid="threads-sidebar-search-row">
              <SearchInput
                containerClassName="flex-1 min-w-0"
                placeholder="搜索会话..."
                aria-label="搜索会话记录"
                surface="floating"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <motion.button
                onClick={handleCreateThread}
                className="sidebar-create-button material-interactive sidebar-glow-btn stage-action-button flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[22px] border"
                data-hover-surface="floating"
                data-testid="threads-sidebar-create-button"
                style={{
                  ...getMaterialSurfaceStyle("floating", "sm"),
                  color: "var(--icon-secondary)",
                }}
                whileHover={
                  motionReduced
                    ? undefined
                    : {
                        y: motionDistance(-2),
                        scale: Number((1 + 0.04 * factors.scale).toFixed(3)),
                      }
                }
                whileTap={motionReduced ? undefined : { scale: motionScale(0.96) }}
                title="新建会话"
                aria-label="新建会话"
                type="button"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto px-1.5 sm:px-2 space-y-3 sm:space-y-4"
        data-testid="threads-sidebar-scroll-region"
        style={{
          paddingTop: `calc(var(--workspace-sidebar-safe-area-top, 0px) + ${THREADS_TOOLBAR_FLOAT_CLEARANCE})`,
          paddingBottom: THREADS_DOCK_FLOAT_CLEARANCE,
        }}
      >
        {filteredThreads.length === 0 && searchQuery.trim() === "" ? (
          <motion.div
            className="px-2 sm:px-3"
            initial={motionReduced ? false : { opacity: 0, y: motionDistance(10) }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration(0.26) }}
          >
            <div
              className="rounded-[24px] border px-4 py-5 text-center"
              data-testid="threads-sidebar-empty-state"
              data-empty-tone="guided"
              style={{
                ...getMaterialSurfaceStyle("content", "sm"),
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), rgba(255,255,255,0.04)",
              }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                从一个新会话开始
              </div>
              <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
                新建会话后，最近的任务会按时间自动回到这里，形成连续的工作流。
              </p>
            </div>
          </motion.div>
        ) : null}

        {groupedThreads.today.length > 0 && (
          <motion.div
            initial={motionReduced ? false : { opacity: 0, y: motionDistance(8) }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration(0.3), delay: motionDuration(0.08) }}
          >
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              今天
            </div>
            <div className="space-y-1">
              {groupedThreads.today.map((thread, index) => (
                <ThreadItemComponent
                  key={thread.id}
                  buttonRef={getThreadButtonRef(thread.id)}
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
            <div className="space-y-1">
              {groupedThreads.yesterday.map((thread, index) => (
                <ThreadItemComponent
                  key={thread.id}
                  buttonRef={getThreadButtonRef(thread.id)}
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
            <div className="space-y-1">
              {groupedThreads.earlier.map((thread, index) => (
                <ThreadItemComponent
                  key={thread.id}
                  buttonRef={getThreadButtonRef(thread.id)}
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
            className="px-2 sm:px-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              className="rounded-[24px] border px-4 py-5 text-center"
              data-testid="threads-sidebar-search-empty"
              data-empty-tone="search"
              style={{
                ...getMaterialSurfaceStyle("content", "sm"),
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
              }}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border" style={{
                background: "color-mix(in srgb, var(--material-content-background) 90%, rgba(255,255,255,0.08))",
                borderColor: "var(--material-content-border)",
                color: "var(--icon-secondary)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
              }}>
                <HugeiconsIcon icon={Search01Icon} size={24} />
              </div>
              <div className="mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                未找到相关会话
              </div>
              <div className="text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
                尝试换个关键词搜索，或者新建一个会话继续当前工作。
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
        data-testid="threads-sidebar-dock-layer"
        data-sidebar-floating-layer="dock"
      >
        <div className="pointer-events-auto">
          <SidebarUtilityDock activeView="home" />
        </div>
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
              minWidth: `${CONTEXT_MENU_WIDTH}px`,
              ...getMaterialSurfaceStyle("floating", "sm"),
              borderRadius: "18px",
              boxShadow: "0 20px 48px rgba(15, 23, 42, 0.18)",
              padding: "4px",
            }}
            data-material-role="floating"
            data-surface-clarity="high"
            role="menu"
            aria-label="会话操作"
          >
            <motion.button
              onClick={() => handleDeleteThread(contextMenu.threadId)}
              className="material-interactive w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
              data-hover-surface="content"
              role="menuitem"
              style={{ color: "var(--danger)" }}
              whileHover={motionReduced ? undefined : { x: 2 }}
              whileTap={motionReduced ? undefined : { scale: motionScale(0.98) }}
              type="button"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
              <span>删除会话</span>
            </motion.button>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </WorkspaceSidebarShell>
  );
}

export function ThreadsSidebar() {
  return (
    <Suspense fallback={<div className="w-60 sm:w-64 lg:w-72 flex-shrink-0 border-r border-[#ffffff1a] bg-[#1a1a1a]" />}>
      <ThreadsSidebarContent />
    </Suspense>
  );
}
