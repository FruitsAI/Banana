/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { streamText, tool, jsonSchema } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getConfig, appendMessage } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { TauriMcpTransport } from "@/lib/mcp";

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

      if (threadId) {
        await appendMessage({
          id: newMessage.id,
          thread_id: threadId,
          role: newMessage.role,
          content: newMessage.content,
        });
      }

      const newMessagesList = [...messages, newMessage];
      const coreMessages = newMessagesList.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      let mcpClient: Client | null = null;
      let mcpTransport: TauriMcpTransport | null = null;

      try {
        const apiKey = await getConfig("openai_api_key");
        const baseURL = await getConfig("openai_base_url");
        const mcpCmd = await getConfig("mcp_command");
        const mcpArgsStr = await getConfig("mcp_args");

        if (!apiKey) {
          throw new Error("API Key 未配置，请先在设置中填写。");
        }

        const aiTools: Record<string, any> = {};

        if (mcpCmd && mcpArgsStr) {
          try {
            const mcpArgs = mcpArgsStr.split(" ").filter(Boolean);
            mcpTransport = new TauriMcpTransport(mcpCmd, mcpArgs);
            mcpClient = new Client(
              { name: "banana-mcp", version: "1.0.0" },
              { capabilities: {} }
            );
            await mcpClient.connect(mcpTransport);
            
            const toolList = await mcpClient.listTools();
            for (const t of toolList.tools) {
              aiTools[t.name] = tool({
                description: t.description || "",
                parameters: jsonSchema(t.inputSchema as any),
                execute: async (args: any) => {
                  try {
                    const res = await mcpClient!.callTool({
                      name: t.name,
                      arguments: args,
                    });
                    // Stringify complex MCP results because AI SDK expects text or JSON for execution output
                    return JSON.stringify(res.content);
                  } catch (e: unknown) {
                    return `Error executing tool: ${e instanceof Error ? e.message : String(e)}`;
                  }
                },
              } as any);
            }
          } catch (mcpError) {
            console.error("Failed to connect to MCP server:", mcpError);
          }
        }

        const openai = createOpenAI({
          apiKey,
          baseURL: baseURL || "https://api.openai.com/v1",
        });

        // Use 'as any' to bypass the complex TS overloads for streamText when passing dynamic tools
        const result = await streamText({
          model: openai("gpt-4o-mini"),
          messages: coreMessages,
          ...(Object.keys(aiTools).length > 0
            ? { tools: aiTools as any, maxSteps: 5 }
            : {}),
        } as any);

        const assistantMessageId = uuidv4();
        let assistantContent = "";

        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: "" },
        ]);

        for await (const textPart of result.textStream) {
          assistantContent += textPart;

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
        console.error("Chat Error:", err);
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        if (mcpClient) {
          try {
            await mcpClient.close();
          } catch (e) {
            console.error("Error closing MCP client:", e);
          }
        }
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
