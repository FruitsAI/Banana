"use client";

import { Plus, Search, Sparkles } from "lucide-react";

interface ThreadItem {
  id: string;
  title: string;
  time: string;
  model: string;
  selected?: boolean;
}

const threadsData: {
  today: ThreadItem[];
  yesterday: ThreadItem[];
} = {
  today: [
    { id: "1", title: "项目架构重构计划", time: "12:34", model: "Claude 3.5 Sonnet", selected: true },
    { id: "2", title: "液态玻璃视觉实现指南", time: "09:15", model: "GPT-4o" },
  ],
  yesterday: [
    { id: "3", title: "如何写好一个 PRD", time: "20:45", model: "Kimi" },
  ],
};

function ThreadItem({ thread }: { thread: ThreadItem }) {
  return (
    <div className={`chat-item ${thread.selected ? "selected" : ""}`}>
      <div className="title">{thread.title}</div>
      <div className="meta">
        {thread.time} · {thread.model}
      </div>
    </div>
  );
}

/**
 * 历史会话清单侧边栏 (ThreadsSidebar)
 * @description 展示按时间线编排的用户历史对话流，它包含了发起新对话、切换对话以及对话快照的管理功能。
 */
export function ThreadsSidebar() {
  return (
    <div className="threads">
      <div className="threads-head">
        <h1>会话流</h1>
        <div className="status-pill">
          <div className="led" />
          本地已就绪
        </div>
      </div>
      
      <div className="row">
        <div className="search">
          <Search className="icon-sm" style={{ color: "var(--text-3)" }} />
          <input placeholder="搜索记录..." aria-label="搜索会话记录" />
        </div>
        <button className="btn icon" title="新建会话" aria-label="新建会话">
          <Plus className="icon" strokeWidth={2} />
        </button>
      </div>

      <div className="list">
        <div className="section-title">今天</div>
        {threadsData.today.map((thread) => (
          <ThreadItem key={thread.id} thread={thread} />
        ))}

        <div className="section-title">昨天</div>
        {threadsData.yesterday.map((thread) => (
          <ThreadItem key={thread.id} thread={thread} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="hintlink" role="button" tabIndex={0}>
        <Sparkles className="icon-sm" style={{ color: "var(--accent-primary)" }} />
        <span style={{ fontSize: "12px", color: "var(--text-2)" }}>
          快捷指令
        </span>
      </div>
    </div>
  );
}