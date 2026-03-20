import { useCallback, useEffect, useReducer, useRef, type Reducer } from "react";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import type { RuntimeTransportMessage } from "@/services/chat/runtime";
import {
  type BananaUIMessage,
  type ChatSessionEvent,
  type ChatSessionState,
} from "@/domain/chat/types";
import { createInitialChatSessionState, reduceChatSession } from "@/domain/chat/session";
import {
  ensureProviderModelsReady,
  ensureProvidersReady,
  getActiveModelSelection,
} from "@/lib/model-settings";
import {
  createChatRuntime,
  createRuntimeToolMap,
  getMcpServersForChat,
  getProvidersForChat,
} from "@/services/chat";
import { getErrorMessage } from "@/shared/errors";
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

interface ActiveTurn {
  controller: AbortController;
  id: number;
}

interface DynamicToolPart {
  type: "dynamic-tool";
  toolCallId: string;
  toolName: string;
  state: "input-available" | "output-available";
  input?: unknown;
  output?: unknown;
}

interface TextPart {
  type: "text";
  text: string;
}

type RuntimeTransportPart = RuntimeTransportMessage["parts"][number];

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_THREAD_TITLE = "新会话";
const MAX_TOOL_ROUNDS = 5;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTextPart(part: unknown): part is TextPart {
  return isObject(part) && part.type === "text" && typeof part.text === "string";
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

function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError(): Error {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
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

function toRuntimePart(part: unknown): RuntimeTransportPart | null {
  if (isTextPart(part)) {
    return {
      type: "text",
      text: part.text,
    };
  }

  if (isDynamicToolPart(part)) {
    if (part.state === "output-available") {
      return {
        type: "dynamic-tool",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        state: "output-available",
        input: part.input ?? {},
        output: part.output,
      };
    }

    return {
      type: "dynamic-tool",
      toolCallId: part.toolCallId,
      toolName: part.toolName,
      state: "input-available",
      input: part.input ?? {},
    };
  }

  return null;
}

function toRuntimeMessages(messages: BananaUIMessage[]): RuntimeTransportMessage[] {
  return messages
    .filter(
      (message): message is BananaUIMessage & { role: "assistant" | "system" | "user" } =>
        message.role === "assistant" || message.role === "system" || message.role === "user",
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts
        .map(toRuntimePart)
        .filter((part): part is RuntimeTransportPart => part !== null),
      metadata: message.metadata,
    }));
}

export function useChatSession(threadId: string) {
  const [state, dispatch] = useReducer(
    reduceChatSession as Reducer<ChatSessionState, ChatSessionEvent>,
    threadId,
    createInitialChatSessionState,
  );
  const stateRef = useRef<ChatSessionState>(state);
  const nextTurnIdRef = useRef(0);
  const activeTurnRef = useRef<ActiveTurn | null>(null);
  const {
    createChatThread,
    loadCanonicalMessages,
    replaceCanonicalMessages,
  } = useChatStore();

  stateRef.current = state;

  const isTurnActive = useCallback((turn: ActiveTurn): boolean => {
    return activeTurnRef.current?.id === turn.id && !turn.controller.signal.aborted;
  }, []);

  const ensureTurnActive = useCallback(
    (turn: ActiveTurn): void => {
      if (!isTurnActive(turn)) {
        throw createAbortError();
      }
    },
    [isTurnActive],
  );

  const dispatchIfActive = useCallback(
    (turn: ActiveTurn, event: ChatSessionEvent): void => {
      if (!isTurnActive(turn)) {
        return;
      }

      dispatch(event);
    },
    [isTurnActive],
  );

  const stopActiveTurn = useCallback((): void => {
    const activeTurn = activeTurnRef.current;
    if (activeTurn && !activeTurn.controller.signal.aborted) {
      activeTurn.controller.abort();
    }
    activeTurnRef.current = null;
  }, []);

  const beginTurn = useCallback((): ActiveTurn => {
    stopActiveTurn();

    const turn: ActiveTurn = {
      id: nextTurnIdRef.current + 1,
      controller: new AbortController(),
    };

    nextTurnIdRef.current = turn.id;
    activeTurnRef.current = turn;

    return turn;
  }, [stopActiveTurn]);

  const clearTurn = useCallback((turn: ActiveTurn): void => {
    if (activeTurnRef.current?.id === turn.id) {
      activeTurnRef.current = null;
    }
  }, []);

  const handleTurnFailure = useCallback(
    (turn: ActiveTurn, error: unknown): void => {
      if (isAbortError(error) || turn.controller.signal.aborted) {
        if (activeTurnRef.current?.id === turn.id) {
          activeTurnRef.current = null;
        }
        dispatch({ type: "STATUS_CHANGED", status: "ready" });
        return;
      }

      dispatch({
        type: "ERROR",
        error: getErrorMessage(error),
      });
    },
    [],
  );

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
        dispatch({ type: "ERROR", error: getErrorMessage(error) });
      }
    },
    [loadCanonicalMessages, threadId],
  );

  useEffect(() => {
    void loadThread(threadId);

    return () => {
      stopActiveTurn();
    };
  }, [loadThread, stopActiveTurn, threadId]);

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
      turn: ActiveTurn,
      options?: SendMessageOptions,
      contextOverride?: ResolvedChatContext,
    ): Promise<BananaUIMessage[]> => {
      const context = contextOverride ?? (await resolveChatContext());
      ensureTurnActive(turn);

      const servers = await getMcpServersForChat();
      ensureTurnActive(turn);

      const runtimeToolMap = await createRuntimeToolMap(servers);
      ensureTurnActive(turn);

      const runtime = createChatRuntime({
        onMessagesUpdate(messages) {
          dispatchIfActive(turn, {
            type: "MESSAGES_UPDATED",
            messages: normalizeMessages(threadId, messages, context),
          });
        },
        onStatusChange(status) {
          dispatchIfActive(turn, { type: "STATUS_CHANGED", status });
        },
        onError(error) {
          dispatchIfActive(turn, { type: "ERROR", error: error.message });
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
        ensureTurnActive(turn);

        const responseMessages = await runtime.send({
          messages: toRuntimeMessages(currentMessages),
          apiKey: context.apiKey,
          baseURL: context.baseURL,
          modelId: context.modelId,
          providerType: context.providerType,
          isSearch: options?.isSearch,
          isThink: options?.isThink,
          tools: runtimeTools,
          abortSignal: turn.controller.signal,
        });

        ensureTurnActive(turn);

        currentMessages = normalizeMessages(threadId, responseMessages, context);
        const pendingTools = findPendingToolExecutions(currentMessages);
        dispatchIfActive(turn, { type: "MESSAGES_UPDATED", messages: currentMessages });

        if (pendingTools.length > 0 && isTurnActive(turn)) {
          flushSync(() => {
            dispatchIfActive(turn, { type: "STATUS_CHANGED", status: "tool-running" });
          });
        }

        await replaceCanonicalMessages(threadId, currentMessages);
        ensureTurnActive(turn);

        if (pendingTools.length === 0) {
          dispatchIfActive(turn, { type: "STATUS_CHANGED", status: "ready" });
          return currentMessages;
        }

        const toolOutputs = [];
        for (const pendingTool of pendingTools) {
          ensureTurnActive(turn);

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
          ensureTurnActive(turn);

          toolOutputs.push({
            toolCallId: pendingTool.toolCallId,
            output: result.ok ? result.data : { error: result.error.message },
          });
        }

        currentMessages = applyToolOutputs(currentMessages, toolOutputs);
        dispatchIfActive(turn, { type: "MESSAGES_UPDATED", messages: currentMessages });
        await replaceCanonicalMessages(threadId, currentMessages);
        ensureTurnActive(turn);
        round += 1;
      }

      dispatchIfActive(turn, { type: "STATUS_CHANGED", status: "ready" });
      return currentMessages;
    },
    [
      dispatchIfActive,
      ensureTurnActive,
      isTurnActive,
      replaceCanonicalMessages,
      resolveChatContext,
      threadId,
    ],
  );

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions): Promise<void> => {
      const turn = beginTurn();

      try {
        const context = await resolveChatContext();
        ensureTurnActive(turn);

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

        dispatchIfActive(turn, {
          type: "SEND_MESSAGE",
          messageId: userMessage.id,
          messages: nextMessages,
        });

        await replaceCanonicalMessages(threadId, nextMessages);
        ensureTurnActive(turn);

        await runAssistantTurn(nextMessages, turn, options, context);
      } catch (error) {
        handleTurnFailure(turn, error);
      } finally {
        clearTurn(turn);
      }
    },
    [
      beginTurn,
      clearTurn,
      createChatThread,
      dispatchIfActive,
      ensureTurnActive,
      handleTurnFailure,
      replaceCanonicalMessages,
      resolveChatContext,
      runAssistantTurn,
      threadId,
    ],
  );

  const regenerate = useCallback(
    async (assistantMessageId: string, options?: SendMessageOptions): Promise<void> => {
      const assistantIndex = stateRef.current.messages.findIndex(
        (message) => message.id === assistantMessageId,
      );
      if (assistantIndex <= 0) {
        return;
      }

      const turn = beginTurn();
      const boundaryMessages = stateRef.current.messages.slice(0, assistantIndex);

      try {
        dispatchIfActive(turn, { type: "MESSAGES_UPDATED", messages: boundaryMessages });
        await replaceCanonicalMessages(threadId, boundaryMessages);
        ensureTurnActive(turn);
        await runAssistantTurn(boundaryMessages, turn, options);
      } catch (error) {
        handleTurnFailure(turn, error);
      } finally {
        clearTurn(turn);
      }
    },
    [
      beginTurn,
      clearTurn,
      dispatchIfActive,
      ensureTurnActive,
      handleTurnFailure,
      replaceCanonicalMessages,
      runAssistantTurn,
      threadId,
    ],
  );

  const editUserMessage = useCallback(
    async (messageId: string, content: string, options?: SendMessageOptions): Promise<void> => {
      const messageIndex = stateRef.current.messages.findIndex((message) => message.id === messageId);
      if (messageIndex < 0) {
        return;
      }

      const turn = beginTurn();
      const existingMessage = stateRef.current.messages[messageIndex];
      const editedMessage: BananaUIMessage = {
        ...existingMessage,
        parts: [{ type: "text", text: content }],
      };
      const nextMessages = [
        ...stateRef.current.messages.slice(0, messageIndex),
        editedMessage,
      ];

      try {
        dispatchIfActive(turn, { type: "MESSAGES_UPDATED", messages: nextMessages });
        await replaceCanonicalMessages(threadId, nextMessages);
        ensureTurnActive(turn);
        await runAssistantTurn(nextMessages, turn, options);
      } catch (error) {
        handleTurnFailure(turn, error);
      } finally {
        clearTurn(turn);
      }
    },
    [
      beginTurn,
      clearTurn,
      dispatchIfActive,
      ensureTurnActive,
      handleTurnFailure,
      replaceCanonicalMessages,
      runAssistantTurn,
      threadId,
    ],
  );

  const retry = useCallback(async (): Promise<void> => {
    const latestAssistantMessage = [...stateRef.current.messages]
      .reverse()
      .find((message) => message.role === "assistant");

    if (latestAssistantMessage) {
      await regenerate(latestAssistantMessage.id);
      return;
    }

    if (stateRef.current.messages.length === 0) {
      return;
    }

    const turn = beginTurn();

    try {
      await runAssistantTurn(stateRef.current.messages, turn);
    } catch (error) {
      handleTurnFailure(turn, error);
    } finally {
      clearTurn(turn);
    }
  }, [beginTurn, clearTurn, handleTurnFailure, regenerate, runAssistantTurn]);

  const stop = useCallback((): void => {
    stopActiveTurn();
    dispatch({ type: "STATUS_CHANGED", status: "ready" });
  }, [stopActiveTurn]);

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
