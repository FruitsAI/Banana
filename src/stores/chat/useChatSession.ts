import { useCallback, useEffect, useReducer, useRef, type Reducer } from "react";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import {
  type BananaUIMessage,
  type ChatSessionEvent,
  type ChatSessionState,
} from "@/domain/chat/types";
import { ensureProviderModelsReady, ensureProvidersReady, getActiveModelSelection } from "@/lib/model-settings";
import {
  createChatRuntime,
  createRuntimeToolMap,
  getMcpServersForChat,
  getProvidersForChat,
} from "@/services/chat";
import type { RuntimeTransportMessage } from "@/services/chat/runtime";
import { createInitialChatSessionState, reduceChatSession } from "@/domain/chat/session";
import { useChatStore } from "./useChatStore";

interface SendMessageOptions {
  isSearch?: boolean;
  isThink?: boolean;
}

interface ResolvedChatContext {
  apiKey: string;
  baseURL: string;
  modelId: string;
  providerId: string;
  providerType: string;
}

interface PendingToolExecution {
  input: unknown;
  toolCallId: string;
  toolName: string;
}

interface DynamicToolPart {
  type: "dynamic-tool";
  toolCallId: string;
  toolName: string;
  state: "input-available" | "output-available";
  input?: unknown;
  output?: unknown;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_THREAD_TITLE = "新会话";
const MAX_TOOL_ROUNDS = 5;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDynamicToolPart(part: unknown): part is DynamicToolPart {
  return (
    isObject(part) &&
    part.type === "dynamic-tool" &&
    typeof part.toolCallId === "string" &&
    typeof part.toolName === "string" &&
    (part.state === "input-available" || part.state === "output-available")
  );
}

function findPendingToolExecutions(messages: BananaUIMessage[]): PendingToolExecution[] {
  const pending: PendingToolExecution[] = [];

  messages.forEach((message) => {
    message.parts.forEach((part) => {
      if (!isDynamicToolPart(part) || part.state !== "input-available") {
        return;
      }

      pending.push({
        input: part.input ?? {},
        toolCallId: part.toolCallId,
        toolName: part.toolName,
      });
    });
  });

  return pending;
}

function applyToolOutputs(
  messages: BananaUIMessage[],
  toolOutputs: Array<{
    output: unknown;
    toolCallId: string;
  }>,
): BananaUIMessage[] {
  const outputMap = new Map(toolOutputs.map((item) => [item.toolCallId, item.output]));

  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (!isDynamicToolPart(part)) {
        return part;
      }

      const output = outputMap.get(part.toolCallId);
      if (output === undefined) {
        return part;
      }

      return {
        ...part,
        state: "output-available",
        output,
      };
    }),
  }));
}

function normalizeMessages(
  threadId: string,
  messages: RuntimeTransportMessage[] | BananaUIMessage[],
  context?: Partial<ResolvedChatContext>,
): BananaUIMessage[] {
  return messages.map((message) => ({
    ...message,
    metadata: message.metadata
      ? {
          ...message.metadata,
          threadId: message.metadata.threadId ?? threadId,
        }
      : {
          threadId,
          modelId: context?.modelId,
          providerId: context?.providerId,
        },
  }));
}

function toRuntimeMessages(messages: BananaUIMessage[]): RuntimeTransportMessage[] {
  return messages as RuntimeTransportMessage[];
}

export function useChatSession(threadId: string) {
  const [state, dispatch] = useReducer(
    reduceChatSession as Reducer<ChatSessionState, ChatSessionEvent>,
    threadId,
    createInitialChatSessionState,
  );
  const stateRef = useRef<ChatSessionState>(state);
  const {
    createChatThread,
    loadCanonicalMessages,
    replaceCanonicalMessages,
    truncateMessagesAfter,
    updateChatMessage,
  } = useChatStore();

  stateRef.current = state;

  const loadThread = useCallback(
    async (nextThreadId = threadId): Promise<void> => {
      dispatch({ type: "HYDRATE_START", threadId: nextThreadId });

      try {
        const messages = await loadCanonicalMessages(nextThreadId);
        dispatch({
          type: "HYDRATE_SUCCESS",
          threadId: nextThreadId,
          messages: normalizeMessages(nextThreadId, messages),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        dispatch({ type: "ERROR", error: message });
      }
    },
    [loadCanonicalMessages, threadId],
  );

  useEffect(() => {
    void loadThread(threadId);
  }, [loadThread, threadId]);

  const resolveChatContext = useCallback(async (): Promise<ResolvedChatContext> => {
    const selection = await getActiveModelSelection();
    let providerId = selection.activeProviderId;
    let modelId = selection.activeModelId;
    let providers = await getProvidersForChat();

    if (!providerId || !modelId) {
      providers = await ensureProvidersReady();
      providerId = providerId ?? providers[0]?.id ?? null;

      if (providerId && !modelId) {
        const models = await ensureProviderModelsReady(providerId);
        modelId = models[0]?.id ?? null;
      }
    }

    if (!providerId || !modelId) {
      throw new Error("未找到可用的模型配置");
    }

    let activeProvider = providers.find((provider) => provider.id === providerId);
    if (!activeProvider) {
      providers = await ensureProvidersReady();
      activeProvider = providers.find((provider) => provider.id === providerId);
    }

    if (!activeProvider) {
      throw new Error("供应商未找到");
    }

    if (!activeProvider.api_key) {
      throw new Error("API Key 未配置");
    }

    return {
      apiKey: activeProvider.api_key,
      baseURL: activeProvider.base_url || DEFAULT_BASE_URL,
      modelId,
      providerId,
      providerType: activeProvider.provider_type ?? "openai",
    };
  }, []);

  const runAssistantTurn = useCallback(
    async (
      seedMessages: BananaUIMessage[],
      options?: SendMessageOptions,
    ): Promise<BananaUIMessage[]> => {
      const context = await resolveChatContext();
      const servers = await getMcpServersForChat();
      const runtimeToolMap = await createRuntimeToolMap(servers);
      const runtime = createChatRuntime({
        onMessagesUpdate(messages) {
          dispatch({
            type: "MESSAGES_UPDATED",
            messages: normalizeMessages(threadId, messages, context),
          });
        },
        onStatusChange(status) {
          dispatch({ type: "STATUS_CHANGED", status });
        },
        onError(error) {
          dispatch({ type: "ERROR", error: error.message });
        },
      });

      const runtimeTools = Object.values(runtimeToolMap).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      let currentMessages = normalizeMessages(threadId, seedMessages, context);
      let round = 0;

      while (round < MAX_TOOL_ROUNDS) {
        const responseMessages = await runtime.send({
          messages: toRuntimeMessages(currentMessages),
          apiKey: context.apiKey,
          baseURL: context.baseURL,
          modelId: context.modelId,
          providerType: context.providerType,
          isSearch: options?.isSearch,
          isThink: options?.isThink,
          tools: runtimeTools,
        });

        currentMessages = normalizeMessages(threadId, responseMessages, context);
        const pendingTools = findPendingToolExecutions(currentMessages);
        dispatch({ type: "MESSAGES_UPDATED", messages: currentMessages });
        if (pendingTools.length > 0) {
          flushSync(() => {
            dispatch({ type: "STATUS_CHANGED", status: "tool-running" });
          });
        }
        await replaceCanonicalMessages(threadId, currentMessages);

        if (pendingTools.length === 0) {
          dispatch({ type: "STATUS_CHANGED", status: "ready" });
          return currentMessages;
        }

        const toolOutputs = [];
        for (const pendingTool of pendingTools) {
          const runtimeTool = runtimeToolMap[pendingTool.toolName];
          if (!runtimeTool) {
            toolOutputs.push({
              toolCallId: pendingTool.toolCallId,
              output: { error: `Tool not found: ${pendingTool.toolName}` },
            });
            continue;
          }

          const result = await runtimeTool.execute(
            isObject(pendingTool.input) ? pendingTool.input : {},
          );

          toolOutputs.push({
            toolCallId: pendingTool.toolCallId,
            output: result.ok ? result.data : { error: result.error.message },
          });
        }

        currentMessages = applyToolOutputs(currentMessages, toolOutputs);
        dispatch({ type: "MESSAGES_UPDATED", messages: currentMessages });
        await replaceCanonicalMessages(threadId, currentMessages);
        round += 1;
      }

      dispatch({ type: "STATUS_CHANGED", status: "ready" });
      return currentMessages;
    },
    [replaceCanonicalMessages, resolveChatContext, threadId],
  );

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions): Promise<void> => {
      const context = await resolveChatContext();
      const userMessage: BananaUIMessage = {
        id: uuidv4(),
        role: "user",
        parts: [{ type: "text", text: content }],
        metadata: {
          threadId,
          modelId: context.modelId,
          providerId: context.providerId,
          searchEnabled: options?.isSearch,
          thinkEnabled: options?.isThink,
        },
      };
      const nextMessages = [...stateRef.current.messages, userMessage];

      try {
        await createChatThread(threadId, DEFAULT_THREAD_TITLE, context.modelId);
      } catch {
        // Ignore duplicate thread creation for existing conversations.
      }

      dispatch({
        type: "SEND_MESSAGE",
        messageId: userMessage.id,
        messages: nextMessages,
      });
      await replaceCanonicalMessages(threadId, nextMessages);
      await runAssistantTurn(nextMessages, options);
    },
    [createChatThread, replaceCanonicalMessages, resolveChatContext, runAssistantTurn, threadId],
  );

  const regenerate = useCallback(
    async (assistantMessageId: string, options?: SendMessageOptions): Promise<void> => {
      const assistantIndex = stateRef.current.messages.findIndex(
        (message) => message.id === assistantMessageId,
      );
      if (assistantIndex <= 0) {
        return;
      }

      const boundaryMessages = stateRef.current.messages.slice(0, assistantIndex);
      dispatch({ type: "MESSAGES_UPDATED", messages: boundaryMessages });

      try {
        await truncateMessagesAfter(threadId, assistantMessageId);
      } catch {
        // Persistence truncation is best-effort here; replace handles final state.
      }

      await replaceCanonicalMessages(threadId, boundaryMessages);
      await runAssistantTurn(boundaryMessages, options);
    },
    [replaceCanonicalMessages, runAssistantTurn, threadId, truncateMessagesAfter],
  );

  const editUserMessage = useCallback(
    async (messageId: string, content: string, options?: SendMessageOptions): Promise<void> => {
      const messageIndex = stateRef.current.messages.findIndex((message) => message.id === messageId);
      if (messageIndex < 0) {
        return;
      }

      const existingMessage = stateRef.current.messages[messageIndex];
      const editedMessage: BananaUIMessage = {
        ...existingMessage,
        parts: [{ type: "text", text: content }],
      };
      const nextMessages = [
        ...stateRef.current.messages.slice(0, messageIndex),
        editedMessage,
      ];
      const nextMessage = stateRef.current.messages[messageIndex + 1];

      dispatch({ type: "MESSAGES_UPDATED", messages: nextMessages });

      await updateChatMessage(messageId, content);
      if (nextMessage) {
        await truncateMessagesAfter(threadId, nextMessage.id);
      }
      await replaceCanonicalMessages(threadId, nextMessages);
      await runAssistantTurn(nextMessages, options);
    },
    [replaceCanonicalMessages, runAssistantTurn, threadId, truncateMessagesAfter, updateChatMessage],
  );

  const retry = useCallback(async (): Promise<void> => {
    const latestAssistantMessage = [...stateRef.current.messages]
      .reverse()
      .find((message) => message.role === "assistant");

    if (latestAssistantMessage) {
      await regenerate(latestAssistantMessage.id);
      return;
    }

    if (stateRef.current.messages.length > 0) {
      await runAssistantTurn(stateRef.current.messages);
    }
  }, [regenerate, runAssistantTurn]);

  const stop = useCallback((): void => {
    dispatch({ type: "STATUS_CHANGED", status: "ready" });
  }, []);

  return {
    status: state.status,
    messages: state.messages,
    error: state.error,
    loadThread,
    sendMessage,
    regenerate,
    editUserMessage,
    retry,
    stop,
  };
}
