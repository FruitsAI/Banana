import { useState, useCallback, useEffect, useRef } from "react";
import { appendMessage, getProviders, createThread, getMessages, updateThreadTitle, deleteMessagesAfter, updateMessage } from "@/lib/db";
import { getActiveModelSelection, ensureProvidersReady, ensureProviderModelsReady } from "@/lib/model-settings";
import { v4 as uuidv4 } from "uuid";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  modelId?: string;
  createdAt?: string; // 保持可选
}

// 核心：模块级内存缓存，用于跨 Hook 实例保活正在生成的会话内容
// 解决 threadId 变更（从 default 到 uuid）导致 Hook 卸载、状态丢失的问题
const pendingMessagesCache: Record<string, ChatMessage[]> = {};

/**
 * 核心钩子：大语言模型与 MCP 工具调度 (useBananaChat)
 */
export function useBananaChat(threadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isProcessingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  
  // 使用内部 Ref 来追踪在不触发外层重新渲染的情况下的真实 ThreadID (e.g. `history.replaceState` 绕过了 Next.js 的更新)
  const activeThreadIdRef = useRef(threadId);

  // 当外部显式改变 threadId 时，更新内部 Ref
  useEffect(() => {
    activeThreadIdRef.current = threadId;
  }, [threadId]);

  // 同步当前状态到 Ref
  useEffect(() => {
    messagesRef.current = messages;
    // 如果该 thread 正在处理中，则实时更新缓存供新 Hook 获取
    const currentId = activeThreadIdRef.current;
    if (isProcessingRef.current && currentId !== "default-thread") {
      pendingMessagesCache[currentId] = messages;
    }
  }, [messages]);

  const loadMessages = useCallback(async () => {
    // 如果处理锁开启，严禁外部加载冲刷本地乐观更新
    if (isProcessingRef.current) return;

    if (!threadId || threadId === "default-thread") {
      setMessages([]);
      return;
    }

    try {
      const data = await getMessages(threadId);
      const dbMessages = data.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        modelId: m.model_id,
        createdAt: m.created_at || new Date().toISOString()
      }));

      // 优先级：内存缓存内容（代表正在运行的最前端状态） > 数据库（物理存储）
      const cache = pendingMessagesCache[threadId];
      if (cache && cache.length > 0) {
        // 合并策略：保留正在流式生成的 AI 回复
        const combined: ChatMessage[] = [...dbMessages];
        cache.forEach(c => {
          if (!combined.find(m => m.id === c.id)) {
            combined.push(c);
          }
        });
        setMessages(combined);
      } else {
        setMessages(dbMessages);
      }
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  }, [threadId]);

  useEffect(() => {
    // 强制初始化：如果该 threadId 已有缓存内容，优先注入
    if (threadId !== "default-thread" && pendingMessagesCache[threadId]) {
      setMessages(pendingMessagesCache[threadId]);
    } else {
      loadMessages();
    }
  }, [threadId, loadMessages]);

  const reload = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  // 核心对话触发逻辑
  const executeChat = useCallback(async (currentMessages: ChatMessage[], threadIdToUse: string, options?: { isSearch?: boolean; isThink?: boolean }) => {
    setIsLoading(true);
    setError(null);
    isProcessingRef.current = true;

    try {
      const { activeProviderId, activeModelId } = await getActiveModelSelection();
      const providers = await getProviders();
      
      let targetProviderId = activeProviderId;
      let targetModelId = activeModelId;
      
      if (!targetProviderId || !targetModelId) {
        const defaultProviders = await ensureProvidersReady();
        if (defaultProviders.length > 0) {
           const defaultProvider = defaultProviders[0];
           targetProviderId = defaultProvider.id;
           const models = await ensureProviderModelsReady(defaultProvider.id);
           if (models.length > 0) targetModelId = models[0].id;
        }
      }

      if (!targetProviderId || !targetModelId) throw new Error("未找到可用的模型配置");

      const activeProvider = providers.find(p => p.id === targetProviderId);
      if (!activeProvider) throw new Error("供应商未找到");

      const apiKey = activeProvider.api_key;
      const baseURL = activeProvider.base_url || "https://api.openai.com/v1";
      if (!apiKey) throw new Error("API Key 未配置");

      const coreMessages = currentMessages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content as string,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: coreMessages,
          apiKey,
          baseURL,
          modelId: targetModelId,
          providerType: activeProvider.provider_type ?? "openai",
          isSearch: options?.isSearch,
          isThink: options?.isThink,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API 错误 ${response.status}`);
      }

      const assistantMessageId = uuidv4();
      const assistantCreatedAt = new Date().toISOString();
      let assistantContent = "";

      const initialAssistantMsg: ChatMessage = { 
        id: assistantMessageId, 
        role: "assistant", 
        content: "", 
        modelId: targetModelId,
        createdAt: assistantCreatedAt 
      };
      
      // 更新状态并写入缓存
      const withAssistant = [...currentMessages, initialAssistantMsg];
      setMessages(withAssistant);
      if (threadIdToUse !== "default-thread") {
        pendingMessagesCache[threadIdToUse] = withAssistant;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        
        // 确保使用最新的消息进行更新，防止冲突
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
          );
          if (threadIdToUse !== "default-thread") {
            pendingMessagesCache[threadIdToUse] = updated;
          }
          return updated;
        });
      }

      // **提前结束加载状态**：让用户看到回复已完成
      setIsLoading(false);

      // 最后一步：持久化到数据库
      if (threadIdToUse && threadIdToUse !== "default-thread") {
        await appendMessage({
          id: assistantMessageId,
          thread_id: threadIdToUse,
          role: "assistant",
          content: assistantContent,
          model_id: targetModelId,
        });

        window.dispatchEvent(new CustomEvent("refresh-threads"));

        // 标题总结：改为不阻塞流程
        if (currentMessages.length === 1 && currentMessages[0].role === "user") {
          // 使用闭包异步处理，不影响 executeChat 的返回
          (async () => {
            try {
              const cleanContextContent = assistantContent.replace(/<think>[\s\S]*?<\/think>/, "").trim();
              const summaryResponse = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [
                    ...coreMessages,
                    { role: "assistant", content: cleanContextContent },
                    { role: "user", content: "请用10字以内总结这段对话作为标题，不要标点、引号或多余说明。仅输出标题文字。" }
                  ],
                  apiKey,
                  baseURL,
                  modelId: targetModelId,
                  providerType: activeProvider.provider_type ?? "openai",
                  isSearch: false, // 显式传 false 解决 undefined 日志
                  isThink: false,
                }),
              });
              if (summaryResponse.ok && summaryResponse.body) {
                const sReader = summaryResponse.body.getReader();
                let summaryTitle = "";
                while (true) {
                  const { done, value } = await sReader.read();
                  if (done) break;
                  summaryTitle += decoder.decode(value, { stream: true });
                }
                const cleanTitle = summaryTitle.replace(/<think>[\s\S]*?<\/think>/, "").replace(/[#*`"']/g, '').trim();
                if (cleanTitle) {
                  await updateThreadTitle(threadIdToUse, cleanTitle);
                  window.dispatchEvent(new CustomEvent("refresh-threads"));
                }
              }
            } catch (e) {
              console.error("Summary background execution failed", e);
            }
          })();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false); // 确保出错也关闭加载
    } finally {
      isProcessingRef.current = false;
      // ... 延时清理逻辑保持不变 ...
      // 处理结束，适当延时清理缓存，确保新 Hook 加载完成后再释放
      if (threadIdToUse !== "default-thread") {
        setTimeout(() => {
          delete pendingMessagesCache[threadIdToUse];
        }, 1000);
      }
    }
  }, []);

  const append = useCallback(
    async (
      message: ChatMessage | Omit<ChatMessage, "id">,
      options?: { isSearch?: boolean; isThink?: boolean }
    ) => {
      isProcessingRef.current = true;
      let currentThreadId = activeThreadIdRef.current;
      
      // 处理新会话初始化
      if (currentThreadId === "default-thread") {
        currentThreadId = uuidv4();
        activeThreadIdRef.current = currentThreadId; // 立即在内部生效，接下来的 append 此时已并非 default
        const url = new URL(window.location.href);
        url.searchParams.set("thread", currentThreadId);
        window.history.replaceState(null, "", url.toString());
      }

      const newMessage: ChatMessage = {
        ...message,
        id: "id" in message ? message.id : uuidv4(),
        createdAt: "createdAt" in message ? (message as ChatMessage).createdAt : new Date().toISOString(),
      };

      const latestMessages = [...messagesRef.current, newMessage];
      setMessages(latestMessages);
      
      // 写入信使，确保 Hook 变更时也能找回
      if (currentThreadId !== "default-thread") {
        pendingMessagesCache[currentThreadId] = latestMessages;
      }

      if (currentThreadId) {
        const { activeModelId } = await getActiveModelSelection();
        try {
          await createThread(currentThreadId, "新会话", activeModelId || "default");
        } catch { /* Likely exists */ }

        try {
          await appendMessage({
            id: newMessage.id,
            thread_id: currentThreadId,
            role: newMessage.role,
            content: newMessage.content,
            model_id: activeModelId || undefined,
          });
        } catch (e) {
          console.error("Failed to append user message:", e);
        }
      }
      
      await executeChat(latestMessages, currentThreadId, options);
    },
    [executeChat]
  );

  const deleteMessage = useCallback(async (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMessageContent = useCallback(async (id: string, content: string) => {
    try {
      await updateMessage(id, content);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content } : m));
    } catch (e) {
      console.error("Failed to update message", e);
    }
  }, []);

  const regenerate = useCallback(async (lastMessageId: string, options?: { isSearch?: boolean; isThink?: boolean }) => {
    isProcessingRef.current = true;
    const currentMessages = messagesRef.current;
    
    // 使用内部 tracking 的 ID
    const currentThreadId = activeThreadIdRef.current;
    
    const msgIndex = currentMessages.findIndex(m => m.id === lastMessageId);
    if (msgIndex === -1) {
      isProcessingRef.current = false;
      return;
    }
    
    const targetMsg = currentMessages[msgIndex];
    let contextMessages: ChatMessage[] = [];

    if (targetMsg.role === "assistant") {
      if (currentThreadId && currentThreadId !== "default-thread") {
        await deleteMessagesAfter(currentThreadId, lastMessageId);
      }
      const lastUserMsgIndex = currentMessages.slice(0, msgIndex).reverse().findIndex(m => m.role === "user");
      if (lastUserMsgIndex === -1) {
        isProcessingRef.current = false;
        return;
      }
      const userIndex = msgIndex - 1 - lastUserMsgIndex;
      contextMessages = currentMessages.slice(0, userIndex + 1);
    } else {
      if (currentThreadId && currentThreadId !== "default-thread" && msgIndex < currentMessages.length - 1) {
        const nextMsgId = currentMessages[msgIndex + 1].id;
        await deleteMessagesAfter(currentThreadId, nextMsgId);
      }
      contextMessages = currentMessages.slice(0, msgIndex + 1);
    }

    setMessages(contextMessages);
    if (currentThreadId !== "default-thread") {
      pendingMessagesCache[currentThreadId] = contextMessages;
    }
    await executeChat(contextMessages, currentThreadId, options);
  }, [executeChat]);

  return { messages, setMessages, isLoading, error, append, reload, loadMessages, deleteMessage, regenerate, updateMessageContent };
}
