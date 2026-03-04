"use client";

import { ArrowRight, Globe, Brain } from "lucide-react";
import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { useBananaChat } from "@/hooks/useBananaChat";
import { motion, AnimatePresence } from "framer-motion";

import ReactMarkdown from "react-markdown";

/**
 * 核心对白交互舞台 (Stage)
 * @description 该组件承载了应用最重要的 AI 聊天闭环，包含从接收输入、发送上下文到流式渲染 AI 输出的全过程。
 * @param {object} props 属性，需根据实际情况挂载 `useBananaChat` 等上层下发的函数。
 */
export function Stage() {
  const { messages, append, isLoading } = useBananaChat("default-thread");
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    append({ role: "user", content: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="main">
      <div className="stage" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        
        {messages.length === 0 ? (
          /* Empty State */
          <div className="empty" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div className="logo">
              <svg
                viewBox="0 0 24 24"
                style={{ width: "28px", height: "28px", color: "var(--text-1)" }}
                fill="none"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="title">Banana</div>
            <div className="sub">欢迎使用，您可以开始新的会话。</div>
          </div>
        ) : (
          /* Messages Area */
          <div style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    padding: "1rem 1.25rem",
                    borderRadius: "1rem",
                    background: msg.role === "user" 
                      ? "linear-gradient(135deg, rgba(88, 156, 255, 0.15) 0%, rgba(88, 156, 255, 0.05) 100%)" 
                      : "rgba(0, 0, 0, 0.03)",
                    border: msg.role === "user" ? "1px solid rgba(88, 156, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.05)",
                    color: "var(--text-1)",
                    lineHeight: 1.6,
                    backdropFilter: "blur(var(--blur-subtle))"
                  }}
                  className={msg.role === "user" ? "" : "dark:bg-[rgba(255,255,255,0.03)] dark:border-[rgba(255,255,255,0.05)]"}
                >
                  <div className="prose dark:prose-invert max-w-none text-current" style={{ overflowWrap: "anywhere" }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={endOfMessagesRef} />
          </div>
        )}

        {/* Composer */}
        <div className="composer-wrap" style={{ marginTop: "auto", padding: "0 2rem 2rem 2rem" }}>
          <div className="composer" style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
            <textarea
              placeholder="给 AI 发送消息... (Shift + Enter 换行)"
              aria-label="消息输入框"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "var(--text-1)",
                resize: "none",
                outline: "none",
                padding: "1rem",
                minHeight: "56px"
              }}
            />
            <div className="controls">
              <div className="left">
                <div className="seg" role="group" aria-label="功能开关">
                  <span className="on" style={{ opacity: 0.5 }}>
                    <Globe className="icon-sm" style={{ marginRight: "4px", display: "inline", verticalAlign: "middle" }} />
                    联网搜索
                  </span>
                  <span className="off" style={{ opacity: 0.5 }}>
                    <Brain className="icon-sm" style={{ marginRight: "4px", display: "inline", verticalAlign: "middle" }} />
                    深度思考
                  </span>
                </div>
                <div className="pill" role="button" tabIndex={0} aria-label="选择模型">
                  <strong>GPT-4o-mini</strong>
                </div>
              </div>
              <button 
                className="send" 
                aria-label="发送消息" 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{ 
                  opacity: (!input.trim() || isLoading) ? 0.3 : 1,
                  cursor: (!input.trim() || isLoading) ? "not-allowed" : "pointer",
                  transition: "opacity 0.2s"
                }}
              >
                <ArrowRight className="icon-sm" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}