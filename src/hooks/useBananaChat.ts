import { useState, useCallback } from "react";
import { appendMessage, getProviders, createThread } from "@/lib/db";
import { getActiveModelSelection, ensureProvidersReady, ensureProviderModelsReady } from "@/lib/model-settings";
import { v4 as uuidv4 } from "uuid";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * 核心钩子：大语言模型与 MCP 工具调度 (useBananaChat)
 * @description 
 *   封装了基于 Vercel AI SDK 的核心流式对话渲染业务。
 *   内置对用户自定义 OpenAI 兼容 Provider（如 NVIDIA、Kimi 等）的支持，以及本地 MCP 协议的系统级桥接。
 *   集成了以下功能：
 *     1. UI 的 Loading 态与通用错误捕获；
 *     2. LLM 流式消息的分片聚合展示；
 *     3. 将对话持久化至 Tauri 底层 SQLite。
 * @param {string} threadId - 当前激活的会话 (Thread) ID，用于定位数据库消息列
 */
export function useBananaChat(threadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      // Intentionally left empty for future implementations
    } catch (e) {
      console.error(e);
    }
  }, []);

  const reload = useCallback(() => {}, []);

  const append = useCallback(
    async (
      message: ChatMessage | Omit<ChatMessage, "id">,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      options?: unknown
    ) => {
      setError(null);
      setIsLoading(true);

      const newMessage: ChatMessage = {
        ...message,
        id: "id" in message ? message.id : uuidv4(),
      };

      setMessages((prev) => [...prev, newMessage]);

      const newMessagesList = [...messages, newMessage];
      const coreMessages = newMessagesList.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content as string,
      }));

      try {
        if (threadId) {
          // Ensure the thread row exists before inserting a message (FK constraint)
          try {
            await createThread(threadId, "新会话");
          } catch {
            // Thread already exists — safe to ignore
          }
          await appendMessage({
            id: newMessage.id,
            thread_id: threadId,
            role: newMessage.role,
            content: newMessage.content,
          });
        }
        
        const { activeProviderId, activeModelId } = await getActiveModelSelection();
        const providers = await getProviders();
        
        let targetProviderId = activeProviderId;
        let targetModelId = activeModelId;
        
        // Fallback context if no selection is made yet
        if (!targetProviderId || !targetModelId) {
          const defaultProviders = await ensureProvidersReady();
          if (defaultProviders.length > 0) {
             const defaultProvider = defaultProviders[0];
             targetProviderId = defaultProvider.id;
             const models = await ensureProviderModelsReady(defaultProvider.id);
             if (models.length > 0) {
                targetModelId = models[0].id;
             } else {
                 throw new Error("模型未配置，请前往设置配置");
             }
          } else {
              throw new Error("供应商尚未就绪，请前往设置页面检查配置");
          }
        }

        const activeProvider = providers.find(p => p.id === targetProviderId);
        if (!activeProvider) {
          throw new Error("当前激活的供应商未找到，请检查设置。");
        }

        const apiKey = activeProvider.api_key;
        const baseURL = activeProvider.base_url;

        if (!apiKey) {
          throw new Error(`[${activeProvider.name}] API Key 未配置，请先在设置中填写。`);
        }

        const finalBaseURL = baseURL || "https://api.openai.com/v1";
        const finalModelId = targetModelId || "gpt-4o-mini";
        
        console.log("[BananaChat] 🚀 API 调用配置:", {
          provider: activeProvider.name,
          providerId: activeProvider.id,
          modelId: finalModelId,
          baseURL: finalBaseURL,
          apiKeyPresent: !!apiKey,
          apiKeyPreview: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "(empty)",
          messageCount: coreMessages.length,
        });

        // Call server-side API route to bypass CORS restrictions
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: coreMessages,
            apiKey,
            baseURL: finalBaseURL,
            modelId: finalModelId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API 请求失败 (HTTP ${response.status})`);
        }

        if (!response.body) {
          throw new Error("API 返回了空的响应体");
        }

        const assistantMessageId = uuidv4();
        let assistantContent = "";

        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: "" },
        ]);

        // Read the plain text streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }

        if (threadId) {
          await appendMessage({
            id: assistantMessageId,
            thread_id: threadId,
            role: "assistant",
            content: assistantContent,
          });
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[BananaChat] ❌ Chat Error:", err);
        console.error("[BananaChat] 错误详情:", {
          errorType: err instanceof Error ? err.constructor.name : typeof err,
          message: errMsg,
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, threadId]
  );

  return {
    messages,
    setMessages,
    isLoading,
    error,
    append,
    reload,
    loadMessages,
  };
}
