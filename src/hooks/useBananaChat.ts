import { useState, useCallback, useEffect } from "react";
import { appendMessage, getProviders, createThread, getMessages, updateThreadTitle } from "@/lib/db";
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
 *   封装了基于 Vercel AI SDK 的 core 流式对话渲染业务。
 *   支持 OpenAI 兼容 Provider，以及本地 MCP 协议桥接。
 */
export function useBananaChat(threadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!threadId || threadId === "default-thread") {
      setMessages([]);
      return;
    }
    try {
      const data = await getMessages(threadId);
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      })));
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  }, [threadId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const reload = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

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
        const { activeProviderId, activeModelId } = await getActiveModelSelection();
        const providers = await getProviders();
        
        let targetProviderId = activeProviderId;
        let targetModelId = activeModelId;
        
        // Fallback context
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

        // 处理新会话的首次创建
        let currentThreadId = threadId;
        if (threadId === "default-thread") {
          currentThreadId = uuidv4();
          // 更新 URL 参数以保持持久化
          const url = new URL(window.location.href);
          url.searchParams.set("thread", currentThreadId);
          window.history.replaceState(null, "", url.toString());
        }

        if (currentThreadId) {
          try {
            await createThread(currentThreadId, "新会话", targetModelId);
          } catch {
            // Already exists
          }
          await appendMessage({
            id: newMessage.id,
            thread_id: currentThreadId,
            role: newMessage.role,
            content: newMessage.content,
          });
        }
        
        const activeProvider = providers.find(p => p.id === targetProviderId);
        if (!activeProvider) throw new Error("供应商未找到");

        const apiKey = activeProvider.api_key;
        const baseURL = activeProvider.base_url || "https://api.openai.com/v1";

        if (!apiKey) throw new Error("API Key 未配置");

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: coreMessages,
            apiKey,
            baseURL,
            modelId: targetModelId,
            providerType: activeProvider.provider_type ?? "openai",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API 错误 ${response.status}`);
        }

        const assistantMessageId = uuidv4();
        let assistantContent = "";

        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: "" },
        ]);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }

        setIsLoading(false);

        if (currentThreadId) {
          await appendMessage({
            id: assistantMessageId,
            thread_id: currentThreadId,
            role: "assistant",
            content: assistantContent,
          });
          
          // 立即刷新侧边栏以显示新会话
          window.dispatchEvent(new CustomEvent("refresh-threads"));
          
          // 第一条消息自动总结标题
          if (newMessagesList.length === 1) {
            try {
              // 清理掉推理思维后再进行总结，避免干扰
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
                // 二次清理：有些模型即便要求了也可能输出 <think>
                const cleanTitle = summaryTitle
                   .replace(/<think>[\s\S]*?<\/think>/, "")
                   .replace(/[#*`"']/g, '')
                   .trim();
                
                if (cleanTitle) {
                  await updateThreadTitle(currentThreadId, cleanTitle);
                  // 总结完成后再次刷新以更新标题
                  window.dispatchEvent(new CustomEvent("refresh-threads"));
                }
              }
            } catch (e) { console.error("Summary failed", e); }
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
      } finally {
        // isLoading is already set to false after stream ends in the try block
        // but we keep it here for safety in case of errors before stream starts
        setIsLoading(false);
      }
    },
    [messages, threadId]
  );

  return { messages, setMessages, isLoading, error, append, reload, loadMessages };
}
