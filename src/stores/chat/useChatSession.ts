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
  resolveThinkingModelId,
  setActiveModelSelection,
} from "@/lib/model-settings";
import {
  createChatRuntime,
  createRuntimeToolMap,
  generateConversationTitle,
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

interface StaticToolPart extends Record<string, unknown> {
  type: `tool-${string}`;
  toolCallId: string;
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
const canonicalPersistenceLanes = new Map<string, Promise<void>>();

function hasApiKey(apiKey?: string): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTextPart(part: unknown): part is TextPart {
  return isObject(part) && part.type === "text" && typeof part.text === "string";
}

function getStaticToolName(type: string): string | null {
  if (!type.startsWith("tool-")) {
    return null;
  }

  const toolName = type.slice(5);
  return toolName.length > 0 ? toolName : null;
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

function isStaticToolPart(part: unknown): part is StaticToolPart {
  return (
    isObject(part) &&
    typeof part.type === "string" &&
    getStaticToolName(part.type) !== null &&
    typeof part.toolCallId === "string" &&
    (part.state === "input-available" || part.state === "output-available")
  );
}

function isToolPart(part: unknown): part is DynamicToolPart | StaticToolPart {
  return isDynamicToolPart(part) || isStaticToolPart(part);
}

function getToolPartName(part: DynamicToolPart | StaticToolPart): string {
  if (part.type === "dynamic-tool") {
    return part.toolName;
  }

  return getStaticToolName(part.type) ?? "";
}

function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError(): Error {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

function notifyThreadsChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("refresh-threads"));
}

function enqueueCanonicalPersistence<T>(
  threadId: string,
  write: () => Promise<T>,
): Promise<T> {
  const previous = canonicalPersistenceLanes.get(threadId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(write);
  const tracked = next.then(
    () => undefined,
    () => undefined,
  );

  canonicalPersistenceLanes.set(threadId, tracked);
  void tracked.finally(() => {
    if (canonicalPersistenceLanes.get(threadId) === tracked) {
      canonicalPersistenceLanes.delete(threadId);
    }
  });

  return next;
}

function findPendingToolExecutions(messages: BananaUIMessage[]): PendingToolExecution[] {
  const pending: PendingToolExecution[] = [];

  messages.forEach((message) => {
    message.parts.forEach((part) => {
      if (!isToolPart(part) || part.state !== "input-available") {
        return;
      }

      pending.push({
        input: part.input ?? {},
        toolCallId: part.toolCallId,
        toolName: getToolPartName(part),
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
      if (!isToolPart(part)) {
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
  previousMessages: BananaUIMessage[] = [],
): BananaUIMessage[] {
  const previousMessagesById = new Map(previousMessages.map((message) => [message.id, message]));

  return messages.map((message) => ({
    ...message,
    metadata: {
      threadId: message.metadata?.threadId ?? previousMessagesById.get(message.id)?.metadata?.threadId ?? threadId,
      modelId: message.metadata?.modelId ?? previousMessagesById.get(message.id)?.metadata?.modelId ?? context?.modelId,
      providerId:
        message.metadata?.providerId ??
        previousMessagesById.get(message.id)?.metadata?.providerId ??
        context?.providerId,
      createdAt:
        message.metadata?.createdAt ??
        previousMessagesById.get(message.id)?.metadata?.createdAt ??
        new Date().toISOString(),
      searchEnabled:
        message.metadata?.searchEnabled ??
        previousMessagesById.get(message.id)?.metadata?.searchEnabled,
      thinkEnabled:
        message.metadata?.thinkEnabled ??
        previousMessagesById.get(message.id)?.metadata?.thinkEnabled,
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

  if (isObject(part) && typeof part.type === "string") {
    return { ...part } as RuntimeTransportPart;
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
  const loadRequestIdRef = useRef(0);
  const {
    createChatThread,
    loadCanonicalMessages,
    renameChatThread,
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
      if (activeTurnRef.current?.id !== turn.id) {
        return;
      }

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

  const persistIfActive = useCallback(
    async (turn: ActiveTurn, messages: BananaUIMessage[]): Promise<void> => {
      await enqueueCanonicalPersistence(threadId, async () => {
        ensureTurnActive(turn);
        await replaceCanonicalMessages(threadId, messages);
        notifyThreadsChanged();
        ensureTurnActive(turn);
      });
      ensureTurnActive(turn);
    },
    [ensureTurnActive, replaceCanonicalMessages, threadId],
  );

  const loadThread = useCallback(
    async (nextThreadId = threadId): Promise<void> => {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      dispatch({ type: "HYDRATE_START", threadId: nextThreadId });

      try {
        const messages = await loadCanonicalMessages(nextThreadId);
        if (loadRequestIdRef.current !== requestId) {
          return;
        }
        dispatch({
          type: "HYDRATE_SUCCESS",
          threadId: nextThreadId,
          messages: normalizeMessages(nextThreadId, messages, undefined, stateRef.current.messages),
        });
      } catch (error) {
        if (loadRequestIdRef.current !== requestId) {
          return;
        }
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

  const resolveChatContext = useCallback(async (
    options?: SendMessageOptions,
  ): Promise<ResolvedChatContext> => {
    const selection = await getActiveModelSelection();
    let providers = await getProvidersForChat();
    const providerId = selection.activeProviderId;
    const modelId = selection.activeModelId;

    const syncProviders = async () => {
      providers = await ensureProvidersReady();
      return providers;
    };

    const resolveEnabledModels = async (candidateProviderId: string) => {
      const models = await ensureProviderModelsReady(candidateProviderId);
      return models.filter((model) => model.is_enabled !== false);
    };

    let activeProvider = providerId
      ? providers.find((provider) => provider.id === providerId)
      : undefined;

    if (!activeProvider) {
      await syncProviders();
      activeProvider = providerId
        ? providers.find((provider) => provider.id === providerId)
        : undefined;
    }

    const canUseProvider = (provider?: (typeof providers)[number]) =>
      provider?.is_enabled !== false && hasApiKey(provider?.api_key);

    if (activeProvider && canUseProvider(activeProvider)) {
      const enabledModels = await resolveEnabledModels(activeProvider.id);
      const selectedModel = modelId
        ? enabledModels.find((model) => model.id === modelId)
        : undefined;

      if (selectedModel) {
        const effectiveModelId = resolveThinkingModelId(
          activeProvider.id,
          selectedModel.id,
          enabledModels,
          options?.isThink === true,
        );

        return {
          apiKey: activeProvider.api_key!.trim(),
          baseURL: activeProvider.base_url || DEFAULT_BASE_URL,
          modelId: effectiveModelId,
          providerId: activeProvider.id,
          providerType: activeProvider.provider_type ?? "openai",
        };
      }

      const fallbackModel = enabledModels[0];
      if (fallbackModel) {
        if (activeProvider.id !== providerId || fallbackModel.id !== modelId) {
          await setActiveModelSelection(activeProvider.id, fallbackModel.id);
        }
        const effectiveModelId = resolveThinkingModelId(
          activeProvider.id,
          fallbackModel.id,
          enabledModels,
          options?.isThink === true,
        );
        return {
          apiKey: activeProvider.api_key!.trim(),
          baseURL: activeProvider.base_url || DEFAULT_BASE_URL,
          modelId: effectiveModelId,
          providerId: activeProvider.id,
          providerType: activeProvider.provider_type ?? "openai",
        };
      }
    }

    await syncProviders();

    for (const provider of providers) {
      if (!canUseProvider(provider)) {
        continue;
      }

      const enabledModels = await resolveEnabledModels(provider.id);
      const fallbackModel = enabledModels[0];
      if (!fallbackModel) {
        continue;
      }

      if (provider.id !== providerId || fallbackModel.id !== modelId) {
        await setActiveModelSelection(provider.id, fallbackModel.id);
      }

      const effectiveModelId = resolveThinkingModelId(
        provider.id,
        fallbackModel.id,
        enabledModels,
        options?.isThink === true,
      );

      return {
        apiKey: provider.api_key!.trim(),
        baseURL: provider.base_url || DEFAULT_BASE_URL,
        modelId: effectiveModelId,
        providerId: provider.id,
        providerType: provider.provider_type ?? "openai",
      };
    }

    const hasConfiguredProvider = providers.some(
      (provider) => provider.is_enabled !== false && hasApiKey(provider.api_key),
    );

    if (!hasConfiguredProvider) {
      throw new Error("API Key 未配置");
    }

    throw new Error("未找到可用的模型配置");
  }, []);

  const runAssistantTurn = useCallback(
    async (
      seedMessages: BananaUIMessage[],
      turn: ActiveTurn,
      options?: SendMessageOptions,
      contextOverride?: ResolvedChatContext,
    ): Promise<BananaUIMessage[]> => {
      const context = contextOverride ?? (await resolveChatContext(options));
      ensureTurnActive(turn);

      let currentMessages = normalizeMessages(
        threadId,
        seedMessages,
        context,
        stateRef.current.messages,
      );

      const servers = await getMcpServersForChat();
      ensureTurnActive(turn);

      const runtimeToolMap = await createRuntimeToolMap(servers, {
        capabilityMode: {
          searchEnabled: options?.isSearch ?? false,
        },
      });
      ensureTurnActive(turn);

      const runtime = createChatRuntime({
        onMessagesUpdate(messages) {
          currentMessages = normalizeMessages(threadId, messages, context, currentMessages);
          dispatchIfActive(turn, {
            type: "MESSAGES_UPDATED",
            messages: currentMessages,
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

        currentMessages = normalizeMessages(threadId, responseMessages, context, currentMessages);
        const pendingTools = findPendingToolExecutions(currentMessages);
        dispatchIfActive(turn, { type: "MESSAGES_UPDATED", messages: currentMessages });

        if (pendingTools.length > 0 && isTurnActive(turn)) {
          flushSync(() => {
            dispatchIfActive(turn, { type: "STATUS_CHANGED", status: "tool-running" });
          });
        }

        await persistIfActive(turn, currentMessages);

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
        await persistIfActive(turn, currentMessages);
        round += 1;
      }

      dispatchIfActive(turn, { type: "STATUS_CHANGED", status: "ready" });
      return currentMessages;
    },
    [
      dispatchIfActive,
      ensureTurnActive,
      isTurnActive,
      persistIfActive,
      resolveChatContext,
      threadId,
    ],
  );

  const updateThreadTitleInBackground = useCallback(
    (context: ResolvedChatContext, messages: BananaUIMessage[]): void => {
      if (threadId === "default-thread") {
        return;
      }

      void (async () => {
        let titleModelId = context.modelId;
        try {
          const providerModels = await ensureProviderModelsReady(context.providerId);
          titleModelId = resolveThinkingModelId(
            context.providerId,
            context.modelId,
            providerModels,
            false,
          );
        } catch {
          titleModelId = context.modelId;
        }

        const result = await generateConversationTitle({
          apiKey: context.apiKey,
          baseURL: context.baseURL,
          modelId: titleModelId,
          providerType: context.providerType,
          messages,
        });

        if (!result.title || result.title === DEFAULT_THREAD_TITLE) {
          return;
        }

        if (result.source === "fallback") {
          console.info("[thread-title] fallback used", {
            threadId,
            reason: result.reason,
          });
        }

        await renameChatThread(threadId, result.title);
        notifyThreadsChanged();
      })().catch(() => undefined);
    },
    [renameChatThread, threadId],
  );

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions): Promise<boolean> => {
      const turn = beginTurn();
      const isFirstTurn = stateRef.current.messages.length === 0;

      try {
        const context = await resolveChatContext(options);
        ensureTurnActive(turn);

        const userMessage: BananaUIMessage = {
          id: uuidv4(),
          role: "user",
          parts: [{ type: "text", text: content }],
          metadata: {
            threadId,
            modelId: context.modelId,
            providerId: context.providerId,
            createdAt: new Date().toISOString(),
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

        await persistIfActive(turn, nextMessages);

        const finalMessages = await runAssistantTurn(nextMessages, turn, options, context);

        if (isFirstTurn) {
          updateThreadTitleInBackground(context, finalMessages);
        }
        return true;
      } catch (error) {
        handleTurnFailure(turn, error);
        return false;
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
      persistIfActive,
      resolveChatContext,
      runAssistantTurn,
      threadId,
      updateThreadTitleInBackground,
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
        await persistIfActive(turn, boundaryMessages);
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
      handleTurnFailure,
      persistIfActive,
      runAssistantTurn,
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
        await persistIfActive(turn, nextMessages);
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
      handleTurnFailure,
      persistIfActive,
      runAssistantTurn,
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
