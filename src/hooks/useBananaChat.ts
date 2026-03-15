import { useState, useCallback, useEffect, useRef } from "react";
import { appendMessage, getProviders, createThread, getMessages, deleteMessagesAfter, updateMessage } from "@/lib/db";
import { getActiveModelSelection, ensureProvidersReady, ensureProviderModelsReady } from "@/lib/model-settings";
import { v4 as uuidv4 } from "uuid";

export interface ToolInvocation {
  state: "call" | "result";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ChatMessage {
  toolInvocations?: ToolInvocation[];
  id: string;
  role: "user" | "assistant" | "system" | "tool";
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

      // --- MCP 工具准备 ---
      const { getMcpServers } = await import("@/lib/db");
      const { mcpListTools, mcpCallTool } = await import("@/lib/mcp");
      const allMcpServers = await getMcpServers();
      const enabledServers = allMcpServers.filter(s => s.is_enabled);
      console.log("[MCP] Enabled servers detected:", enabledServers.length, enabledServers.map(s => s.name));
      
      const mcpTools: Record<string, unknown>[] = [];
      const toolToSourceMap: Record<string, string> = {};

      for (const server of enabledServers) {
        try {
          const { tools } = await mcpListTools(server);
          tools.forEach((t: Record<string, unknown>) => {
            mcpTools.push(t);
            if (typeof t.name === 'string') {
              toolToSourceMap[t.name] = server.id;
            }
          });
        } catch (e) {
          console.error(`Failed to load tools for MCP ${server.name}:`, e);
        }
      }
      
      console.log("[MCP] Total aggregated tools:", mcpTools.length);

      // Map messages taking care of tool metadata for history if needed
      const coreMessages: any[] = [];
      for (let i = 0; i < currentMessages.length; i++) {
        const m = currentMessages[i];
        if (m.role === "assistant" && m.toolInvocations && m.toolInvocations.length > 0) {
          // 构造 Assistant 消息 Parts
          const parts: any[] = [];
          if (m.content) parts.push({ type: "text", text: m.content });
          
          m.toolInvocations.forEach(t => {
            parts.push({
              type: "tool-call",
              toolCallId: t.toolCallId,
              toolName: t.toolName,
              args: t.args
            });
          });
          coreMessages.push({ role: "assistant", content: parts });

          // 关键：如果这些工具已经有结果了，必须紧跟一条 tool 消息
          const resolvedTools = m.toolInvocations.filter(t => t.state === "result");
          if (resolvedTools.length > 0) {
            coreMessages.push({
              role: "tool",
              content: resolvedTools.map(t => ({
                type: "tool-result",
                toolCallId: t.toolCallId,
                toolName: t.toolName,
                output: t.result // 使用 v6 规范的 output 字段
              }))
            });
          }
        } else if (m.role !== "tool") { // 忽略原始列表中的 tool 消息，因为我们已经通过 assistant 逻辑生成了
          coreMessages.push({ role: m.role, content: m.content });
        }
      }

      // 发起请求外壳
      const runChat = async (msgs: any[]) => {
        return await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs,
            apiKey,
            baseURL,
            modelId: targetModelId,
            providerType: activeProvider.provider_type ?? "openai",
            isSearch: options?.isSearch,
            isThink: options?.isThink,
            tools: mcpTools,
          }),
        });
      };

      const assistantMessageId = uuidv4();
      const assistantCreatedAt = new Date().toISOString();
      let assistantContent = "";
      let assistantToolInvocations: ToolInvocation[] = [];

      const initialAssistantMsg: ChatMessage = { 
        id: assistantMessageId, 
        role: "assistant", 
        content: "", 
        modelId: targetModelId,
        createdAt: assistantCreatedAt 
      };
      
      setMessages([...currentMessages, initialAssistantMsg]);

      const updateMessageUI = (text: string, tools?: ToolInvocation[]) => {
        setMessages((prev: ChatMessage[]) => {
          const updated = prev.map((msg: ChatMessage) =>
            msg.id === assistantMessageId ? { ...msg, content: text, ...(tools ? { toolInvocations: tools } : {}) } : msg
          );
          if (threadIdToUse !== "default-thread") {
            pendingMessagesCache[threadIdToUse] = updated;
          }
          return updated;
        });
      };

      // 提取流解析为单步函数
      const processStreamStep = async (resp: Response) => {
        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        
        let stepContent = "";
        let stepTools: ToolInvocation[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            
            const content = trimmedLine.substring(6);
            if (content === '[DONE]') {
              await reader.cancel();
              return { stepContent, stepTools };
            }
            
            try {
              const data = JSON.parse(content);
              
              if (data.type === 'text-delta') {
                stepContent += data.delta;
                assistantContent += data.delta;
                updateMessageUI(assistantContent, assistantToolInvocations);
              } else if (data.type === 'finish' || data.type === 'finish-step') {
                await reader.cancel();
                return { stepContent, stepTools };
              } else if (data.type === 'tool-input-available') {
                console.log("[MCP] Tool Call detected (raw):", data);
                
                const serverId = toolToSourceMap[data.toolName];
                const callId = data.toolCallId || String(Date.now());
                if (serverId) {
                  // 针对某些模型(如 Minimax)可能会漏传必填参数的兜底修复逻辑
                  let finalArgs = data.input || data.args || {};
                  if (data.toolName === 'get_current_time' && (!finalArgs || Object.keys(finalArgs).length === 0)) {
                    console.log("[MCP] 补齐工具必选参数: timezone -> Asia/Shanghai");
                    finalArgs = { timezone: "Asia/Shanghai" };
                  }

                  const newCall: ToolInvocation = {
                    state: "call",
                    toolCallId: callId,
                    toolName: data.toolName,
                    args: finalArgs
                  };
                  stepTools.push(newCall);
                  assistantToolInvocations = [...assistantToolInvocations, newCall];
                  updateMessageUI(assistantContent, assistantToolInvocations);

                  const result = await mcpCallTool(serverId, data.toolName, finalArgs);
                  console.log("[MCP] Tool Result:", result);
                  
                  // 更新该工具为已完成及其结果
                  stepTools = stepTools.map(t => 
                    t.toolCallId === callId ? { ...t, state: "result", result } : t
                  );
                  assistantToolInvocations = assistantToolInvocations.map(t => 
                    t.toolCallId === callId ? { ...t, state: "result", result } : t
                  );
                  updateMessageUI(assistantContent, assistantToolInvocations);
                }
              }
            } catch (e) {
              console.warn("Parse line failed:", trimmedLine, e);
            }
          }
        }
        return { stepContent, stepTools };
      };

      // 引入 Max Steps 多轮对话机制
      let stepCount = 0;
      const MAX_STEPS = 5;

      while (stepCount < MAX_STEPS) {
        stepCount++;
        const response = await runChat(coreMessages);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API 错误 ${response.status}`);
        }

        const { stepContent, stepTools } = await processStreamStep(response);
        
        if (stepTools.length > 0) {
           // 准备将本轮生成的 Assistant Message 追加进 coreMessages (使用 Parts 数组格式)
           const parts: any[] = [];
           if (stepContent) parts.push({ type: "text", text: stepContent });
           
           stepTools.forEach(t => {
             parts.push({
               type: "tool-call",
               toolCallId: t.toolCallId,
               toolName: t.toolName,
               args: t.args
             });
           });

           coreMessages.push({ role: "assistant", content: parts });
           
           // 紧接着追加包含结果的 Tool Message 送回接口 (内容必须是 ToolResultPart 数组)
           // 注意：AI SDK v5+ 要求使用 'output' 而非 'result'
           coreMessages.push({
             role: "tool",
             content: stepTools.map(t => ({
               type: "tool-result",
               toolCallId: t.toolCallId,
               toolName: t.toolName,
               output: t.result // 将本地存储的 result 映射为 SDK 需要的 output
             }))
           });
           
        } else {
           break;
        }
      }

      setIsLoading(false);

      if (threadIdToUse && threadIdToUse !== "default-thread") {
        await appendMessage({
          id: assistantMessageId,
          thread_id: threadIdToUse,
          role: "assistant",
          content: assistantContent,
          model_id: targetModelId,
        });

        window.dispatchEvent(new CustomEvent("refresh-threads"));

        // 自动总结标题逻辑
        if (currentMessages.length === 1 && currentMessages[0].role === "user") {
          (async () => {
             // ... 标题总结内容保持原有逻辑，但注意 API 已改为 DataStream ...
             // 暂时省略总结逻辑以防死循环或复杂度过高
          })();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    } finally {
      isProcessingRef.current = false;
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
