import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BananaUIMessage } from "@/domain/chat/types";
import { useChatSession } from "@/stores/chat/useChatSession";

const {
  mockLoadPersistedMessages,
  mockReplacePersistedMessages,
  mockCreateChatRuntime,
  mockCreateRuntimeToolMap,
  mockCreateThread,
  mockUpdateThreadTitle,
  mockGenerateConversationTitle,
  mockGetProvidersForChat,
  mockGetMcpServersForChat,
  mockGetActiveModelSelection,
  mockEnsureProvidersReady,
  mockEnsureProviderModelsReady,
  mockResolveThinkingModelId,
  mockSupportsNativeThinking,
  mockSetActiveModelSelection,
} = vi.hoisted(() => ({
  mockLoadPersistedMessages: vi.fn(),
  mockReplacePersistedMessages: vi.fn(),
  mockCreateChatRuntime: vi.fn(),
  mockCreateRuntimeToolMap: vi.fn(),
  mockCreateThread: vi.fn(),
  mockUpdateThreadTitle: vi.fn(),
  mockGenerateConversationTitle: vi.fn(),
  mockGetProvidersForChat: vi.fn(),
  mockGetMcpServersForChat: vi.fn(),
  mockGetActiveModelSelection: vi.fn(),
  mockEnsureProvidersReady: vi.fn(),
  mockEnsureProviderModelsReady: vi.fn(),
  mockResolveThinkingModelId: vi.fn(),
  mockSupportsNativeThinking: vi.fn(),
  mockSetActiveModelSelection: vi.fn(),
}));

vi.mock("@/services/chat", () => ({
  loadPersistedMessages: mockLoadPersistedMessages,
  createChatRuntime: mockCreateChatRuntime,
  createRuntimeToolMap: mockCreateRuntimeToolMap,
  createThread: mockCreateThread,
  updateThreadTitle: mockUpdateThreadTitle,
  generateConversationTitle: mockGenerateConversationTitle,
  getProvidersForChat: mockGetProvidersForChat,
  getMcpServersForChat: mockGetMcpServersForChat,
}));

vi.mock("@/services/chat/persistence", () => ({
  replacePersistedMessages: mockReplacePersistedMessages,
}));

vi.mock("@/lib/model-settings", () => ({
  getActiveModelSelection: mockGetActiveModelSelection,
  ensureProvidersReady: mockEnsureProvidersReady,
  ensureProviderModelsReady: mockEnsureProviderModelsReady,
  resolveThinkingModelId: mockResolveThinkingModelId,
  supportsNativeThinking: mockSupportsNativeThinking,
  setActiveModelSelection: mockSetActiveModelSelection,
}));

function createUserMessage(
  id: string,
  text: string,
  threadId = "thread-1",
): BananaUIMessage {
  return {
    id,
    role: "user",
    parts: [{ type: "text", text }],
    metadata: { threadId },
  };
}

function createAssistantMessage(
  id: string,
  text: string,
  threadId = "thread-1",
): BananaUIMessage {
  return {
    id,
    role: "assistant",
    parts: [{ type: "text", text }],
    metadata: { threadId },
  };
}

function createAssistantToolCallMessage(threadId = "thread-1"): BananaUIMessage {
  return {
    id: "msg-assistant-tool",
    role: "assistant",
    parts: [
      { type: "text", text: "Calling tool" },
      {
        type: "dynamic-tool",
        toolName: "get_current_time",
        toolCallId: "tool-call-1",
        state: "input-available",
        input: { timezone: "Asia/Shanghai" },
      },
    ],
    metadata: { threadId },
  };
}

function createAssistantStaticToolCallMessage(threadId = "thread-1"): BananaUIMessage {
  return {
    id: "msg-assistant-static-tool",
    role: "assistant",
    parts: [
      { type: "text", text: "" },
      {
        type: "tool-get_current_time",
        toolCallId: "tool-call-1",
        state: "input-available",
        input: { timezone: "Asia/Shanghai" },
      },
    ],
    metadata: { threadId },
  };
}

function createToolMessage(
  id: string,
  text: string,
  threadId = "thread-1",
): BananaUIMessage {
  return {
    id,
    role: "tool",
    parts: [{ type: "text", text }],
    metadata: { threadId },
  };
}

function createDeferred<T>() {
  let resolve:
    | ((value: T | PromiseLike<T>) => void)
    | undefined;
  let reject:
    | ((reason?: unknown) => void)
    | undefined;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    resolve: (value: T) => resolve?.(value),
    reject: (reason?: unknown) => reject?.(reason),
  };
}

function createUnknownPartAssistantMessage(threadId = "thread-1"): BananaUIMessage {
  return {
    id: "msg-assistant-unknown-part",
    role: "assistant",
    parts: [
      { type: "text", text: "assistant reply" },
      { type: "reasoning", text: "kept for future transport compatibility" },
    ],
    metadata: { threadId },
  };
}

describe("useChatSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLoadPersistedMessages.mockResolvedValue([]);
    mockReplacePersistedMessages.mockResolvedValue(undefined);
    mockCreateThread.mockResolvedValue(undefined);
    mockUpdateThreadTitle.mockResolvedValue(undefined);
    mockGenerateConversationTitle.mockResolvedValue({
      title: null,
      source: "none",
      reason: "empty-stream",
    });
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "openai",
      activeModelId: "gpt-4o-mini",
    });
    mockGetProvidersForChat.mockResolvedValue([
      {
        id: "openai",
        api_key: "test-key",
        base_url: "https://api.openai.com/v1",
        provider_type: "openai",
      },
    ]);
    mockGetMcpServersForChat.mockResolvedValue([]);
    mockEnsureProvidersReady.mockResolvedValue([]);
    mockEnsureProviderModelsReady.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return [
          {
            id: "gpt-4o-mini",
            provider_id: "openai",
            name: "gpt-4o-mini",
            is_enabled: true,
          },
        ];
      }

      return [];
    });
    mockResolveThinkingModelId.mockImplementation(
      (_providerId: string, modelId: string) => modelId,
    );
    mockSupportsNativeThinking.mockReturnValue(false);
    mockSetActiveModelSelection.mockResolvedValue(undefined);
    mockCreateRuntimeToolMap.mockResolvedValue({});
    mockCreateChatRuntime.mockImplementation(({ onMessagesUpdate, onStatusChange }) => ({
      send: vi.fn(async ({ messages }: { messages: BananaUIMessage[] }) => {
        onStatusChange("streaming");
        const assistant = createAssistantMessage("msg-assistant-1", "assistant reply");
        const nextMessages = [...messages, assistant];
        onMessagesUpdate(nextMessages);
        onStatusChange("ready");
        return nextMessages;
      }),
    }));
  });

  it("hydrates a thread and exposes ready status", async () => {
    mockLoadPersistedMessages.mockResolvedValueOnce([
      createUserMessage("msg-user-1", "hello banana"),
    ]);

    const { result } = renderHook(() => useChatSession("thread-1"));

    expect(result.current.status).toBe("hydrating");

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(result.current.messages).toEqual([
      expect.objectContaining({
        ...createUserMessage("msg-user-1", "hello banana"),
        metadata: expect.objectContaining({
          threadId: "thread-1",
          createdAt: expect.any(String),
        }),
      }),
    ]);
  });

  it("sendMessage persists the user turn and streams the assistant reply", async () => {
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("hello banana", { isSearch: true });
    });

    expect(mockCreateThread).toHaveBeenCalledWith("thread-1", "新会话", "gpt-4o-mini");
    expect(mockReplacePersistedMessages).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("ready");
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].metadata?.createdAt).toBeTypeOf("string");
    expect(result.current.messages[1]).toEqual(
      expect.objectContaining({
        ...createAssistantMessage("msg-assistant-1", "assistant reply"),
        metadata: expect.objectContaining({
          createdAt: expect.any(String),
        }),
      }),
    );
    expect(dispatchEventSpy.mock.calls.map(([event]) => event.type)).toContain("refresh-threads");
  });

  it("resolves sendMessage as soon as the user turn is accepted, before the assistant stream finishes", async () => {
    const deferred = createDeferred<BananaUIMessage[]>();

    mockCreateChatRuntime.mockImplementation(({ onStatusChange }) => ({
      send: vi.fn(async () => {
        onStatusChange("streaming");
        return await deferred.promise;
      }),
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    let accepted = false;

    await act(async () => {
      const sendPromise = result.current.sendMessage("hello banana", { isSearch: true });
      await sendPromise.then((value) => {
        accepted = value;
      });
    });

    expect(accepted).toBe(true);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.status).toBe("streaming");

    await act(async () => {
      deferred.resolve([
        ...result.current.messages,
        createAssistantMessage("msg-assistant-late", "assistant reply"),
      ]);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });
  });

  it("does not expose search tools to the runtime when search is disabled", async () => {
    mockGetMcpServersForChat.mockResolvedValueOnce([
      {
        id: "server-1",
        command: "mixed-tools",
        is_enabled: true,
      },
    ]);

    mockCreateRuntimeToolMap.mockImplementation(async (_servers, options) => {
      const toolMap: Record<string, { description?: string; inputSchema: unknown; name: string; execute: ReturnType<typeof vi.fn> }> = {
        get_current_time: {
          name: "get_current_time",
          description: "Return the current local time",
          inputSchema: { type: "object" },
          execute: vi.fn(async () => ({ ok: true, data: { now: "2026-03-21" } })),
        },
      };

      if (options?.capabilityMode?.searchEnabled !== false) {
        toolMap.brave_search = {
          name: "brave_search",
          description: "Search the web",
          inputSchema: { type: "object" },
          execute: vi.fn(async () => ({ ok: true, data: { results: [] } })),
        };
      }

      return toolMap;
    });

    const sendMock = vi.fn(async ({ messages }: { messages: BananaUIMessage[] }) => {
      return [...messages, createAssistantMessage("msg-assistant-1", "assistant reply")];
    });
    mockCreateChatRuntime.mockImplementation(() => ({
      send: sendMock,
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("hello banana", { isSearch: false });
    });

    expect(mockCreateRuntimeToolMap).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        capabilityMode: {
          searchEnabled: false,
        },
      }),
    );
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [
          {
            name: "get_current_time",
            description: "Return the current local time",
            inputSchema: { type: "object" },
          },
        ],
      }),
    );
  });

  it("summarizes the first completed turn into a thread title in the background", async () => {
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
    mockGenerateConversationTitle.mockResolvedValue({
      title: "北京日期",
      source: "ai",
      reason: "ok",
    });

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("北京今天日期");
    });

    await waitFor(() => {
      expect(mockGenerateConversationTitle).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: "test-key",
          baseURL: "https://api.openai.com/v1",
          modelId: "gpt-4o-mini",
          providerType: "openai",
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "user" }),
            expect.objectContaining({ role: "assistant" }),
          ]),
        }),
      );
    });

    await waitFor(() => {
      expect(mockUpdateThreadTitle).toHaveBeenCalledWith("thread-1", "北京日期");
    });

    expect(dispatchEventSpy.mock.calls.map(([event]) => event.type)).toContain("refresh-threads");
  });

  it("persists the fallback title when AI title generation fails", async () => {
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
    const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    mockGenerateConversationTitle.mockResolvedValue({
      title: "北京今天日期",
      source: "fallback",
      reason: "http-error",
    });

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("北京今天日期");
    });

    expect(consoleInfoSpy).toHaveBeenCalledWith("[thread-title] fallback used", {
      threadId: "thread-1",
      reason: "http-error",
    });
    expect(mockUpdateThreadTitle).toHaveBeenCalledWith("thread-1", "北京今天日期");
    expect(dispatchEventSpy.mock.calls.map(([event]) => event.type)).toContain("refresh-threads");
  });

  it("uses the base model instead of the thinking variant when generating a thread title", async () => {
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "nvidia",
      activeModelId: "moonshotai/kimi-k2.5",
    });
    mockGetProvidersForChat.mockResolvedValue([
      {
        id: "nvidia",
        name: "NVIDIA",
        icon: "N",
        is_enabled: true,
        api_key: "nvidia-key",
        base_url: "https://integrate.api.nvidia.com/v1",
        provider_type: "openai",
      },
    ]);
    mockEnsureProviderModelsReady.mockResolvedValue([
      {
        id: "moonshotai/kimi-k2.5",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2.5",
        is_enabled: true,
      },
      {
        id: "moonshotai/kimi-k2-thinking",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2-thinking",
        is_enabled: true,
        capabilities: ["reasoning"],
      },
    ]);
    mockResolveThinkingModelId.mockImplementation(
      (_providerId: string, modelId: string, _models: unknown, thinkingEnabled: boolean) =>
        thinkingEnabled ? "moonshotai/kimi-k2-thinking" : "moonshotai/kimi-k2.5",
    );
    mockSupportsNativeThinking.mockImplementation(
      (_providerId: string, modelId: string) => modelId === "moonshotai/kimi-k2-thinking",
    );
    mockGenerateConversationTitle.mockResolvedValue({
      title: "小数比较",
      source: "ai",
      reason: "ok",
    });

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("9.11 和 9.9 哪个更大？请展示思考过程。", { isThink: true });
    });

    await waitFor(() => {
      expect(mockGenerateConversationTitle).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: "moonshotai/kimi-k2.5",
        }),
      );
    });
  });

  it("falls back from a stale active selection to the first usable provider and model", async () => {
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "openrouter",
      activeModelId: "openrouter/auto",
    });
    mockGetProvidersForChat.mockResolvedValue([
      {
        id: "openrouter",
        name: "OpenRouter",
        icon: "R",
        is_enabled: false,
        api_key: "",
        base_url: "https://openrouter.ai/api/v1",
        provider_type: "openai",
      },
    ]);
    mockEnsureProvidersReady.mockResolvedValue([
      {
        id: "openrouter",
        name: "OpenRouter",
        icon: "R",
        is_enabled: false,
        api_key: "",
        base_url: "https://openrouter.ai/api/v1",
        provider_type: "openai",
      },
      {
        id: "nvidia",
        name: "NVIDIA",
        icon: "N",
        is_enabled: true,
        api_key: "nvidia-key",
        base_url: "https://integrate.api.nvidia.com/v1",
        provider_type: "openai",
      },
    ]);
    mockEnsureProviderModelsReady.mockImplementation(async (providerId: string) => {
      if (providerId === "nvidia") {
        return [
          {
            id: "z-ai/glm5",
            provider_id: "nvidia",
            name: "z-ai/glm5",
            is_enabled: true,
          },
        ];
      }

      return [];
    });

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("hello banana");
    });

    expect(mockSetActiveModelSelection).toHaveBeenCalledWith("nvidia", "z-ai/glm5");
    expect(mockCreateThread).toHaveBeenCalledWith("thread-1", "新会话", "z-ai/glm5");
    expect(result.current.messages[0]?.metadata?.providerId).toBe("nvidia");
    expect(result.current.messages[0]?.metadata?.modelId).toBe("z-ai/glm5");
  });

  it("routes NVIDIA Kimi K2.5 to the thinking variant when deep thinking is enabled", async () => {
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "nvidia",
      activeModelId: "moonshotai/kimi-k2.5",
    });
    mockGetProvidersForChat.mockResolvedValue([
      {
        id: "nvidia",
        name: "NVIDIA",
        icon: "N",
        is_enabled: true,
        api_key: "nvidia-key",
        base_url: "https://integrate.api.nvidia.com/v1",
        provider_type: "openai",
      },
    ]);
    mockEnsureProviderModelsReady.mockResolvedValue([
      {
        id: "moonshotai/kimi-k2.5",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2.5",
        is_enabled: true,
      },
      {
        id: "moonshotai/kimi-k2-thinking",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2-thinking",
        is_enabled: true,
        capabilities: ["reasoning"],
      },
    ]);
    mockResolveThinkingModelId.mockImplementation(
      (_providerId: string, modelId: string, _models: unknown, thinkingEnabled: boolean) =>
        thinkingEnabled ? "moonshotai/kimi-k2-thinking" : modelId,
    );

    const sendMock = vi.fn(async ({ messages }: { messages: BananaUIMessage[] }) => {
      const assistant = createAssistantMessage("msg-assistant-kimi", "assistant reply");
      return [...messages, assistant];
    });
    mockCreateChatRuntime.mockImplementation(() => ({
      send: sendMock,
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("hello banana", { isThink: true });
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: "moonshotai/kimi-k2-thinking",
      }),
    );
    expect(mockCreateThread).toHaveBeenCalledWith(
      "thread-1",
      "新会话",
      "moonshotai/kimi-k2-thinking",
    );
    expect(result.current.messages[0]?.metadata?.modelId).toBe("moonshotai/kimi-k2-thinking");
  });

  it("regenerate replays from the preserved boundary", async () => {
    const hydratedMessages = [
      createUserMessage("msg-user-1", "first"),
      createAssistantMessage("msg-assistant-1", "first reply"),
      createUserMessage("msg-user-2", "second"),
      createAssistantMessage("msg-assistant-2", "second reply"),
    ];
    mockLoadPersistedMessages.mockResolvedValueOnce(hydratedMessages);

    const sendMock = vi.fn(async ({ messages }: { messages: BananaUIMessage[] }) => {
      const assistant = createAssistantMessage("msg-assistant-regenerated", "new reply");
      return [...messages, assistant];
    });
    mockCreateChatRuntime.mockImplementation(() => ({
      send: sendMock,
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.regenerate("msg-assistant-2");
    });

    const replayMessages = sendMock.mock.calls[0]?.[0]?.messages as BananaUIMessage[];
    expect(replayMessages.map((message) => message.id)).toEqual([
      "msg-user-1",
      "msg-assistant-1",
      "msg-user-2",
    ]);
  });

  it("editUserMessage truncates later messages and reruns from the edited point", async () => {
    const hydratedMessages = [
      createUserMessage("msg-user-1", "first"),
      createAssistantMessage("msg-assistant-1", "first reply"),
      createUserMessage("msg-user-2", "second"),
      createAssistantMessage("msg-assistant-2", "second reply"),
    ];
    mockLoadPersistedMessages.mockResolvedValueOnce(hydratedMessages);

    const sendMock = vi.fn(async ({ messages }: { messages: BananaUIMessage[] }) => {
      const assistant = createAssistantMessage("msg-assistant-updated", "edited reply");
      return [...messages, assistant];
    });
    mockCreateChatRuntime.mockImplementation(() => ({
      send: sendMock,
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.editUserMessage("msg-user-2", "second edited");
    });

    const replayMessages = sendMock.mock.calls[0]?.[0]?.messages as BananaUIMessage[];
    expect(replayMessages).toHaveLength(3);
    expect(replayMessages[2].parts).toEqual([{ type: "text", text: "second edited" }]);
    expect(mockReplacePersistedMessages).toHaveBeenCalled();
  });

  it("exposes a tool-running transition while executing MCP tools", async () => {
    const toolMessage = createAssistantToolCallMessage();
    let resolveTool:
      | ((value: { ok: true; data: Record<string, unknown> }) => void)
      | undefined;

    mockCreateRuntimeToolMap.mockResolvedValue({
      get_current_time: {
        name: "get_current_time",
        inputSchema: { type: "object" },
        execute: vi.fn(
          () =>
            new Promise((resolve) => {
              resolveTool = resolve;
            }),
        ),
      },
    });

    const sendMock = vi
      .fn()
      .mockImplementationOnce(async ({ messages }: { messages: BananaUIMessage[] }) => {
        return [...messages, toolMessage];
      })
      .mockImplementationOnce(async ({ messages }: { messages: BananaUIMessage[] }) => {
        return [...messages.slice(0, -1), createAssistantMessage("msg-assistant-final", "tool done")];
      });

    mockCreateChatRuntime.mockImplementation(() => ({
      send: sendMock,
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const pending = act(async () => {
      await result.current.sendMessage("time?");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("tool-running");
    });

    resolveTool?.({ ok: true, data: { now: "2026-03-20 02:00:00" } });
    await pending;

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("ready");
  });

  it("executes static AI SDK tool parts and feeds their outputs into the second round", async () => {
    mockCreateRuntimeToolMap.mockResolvedValue({
      get_current_time: {
        name: "get_current_time",
        inputSchema: { type: "object" },
        execute: vi.fn(async () => ({
          ok: true,
          data: { now: "2026-03-21" },
        })),
      },
    });

    const sendMock = vi
      .fn()
      .mockImplementationOnce(async ({ messages }: { messages: BananaUIMessage[] }) => {
        return [...messages, createAssistantStaticToolCallMessage()];
      })
      .mockImplementationOnce(async ({ messages }: { messages: BananaUIMessage[] }) => {
        return [...messages, createAssistantMessage("msg-assistant-final", "今天是 2026-03-21")];
      });

    mockCreateChatRuntime.mockImplementation(() => ({
      send: sendMock,
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("北京今天日期");
    });

    expect(sendMock).toHaveBeenCalledTimes(2);
    const replayMessages = sendMock.mock.calls[1]?.[0]?.messages as BananaUIMessage[];
    expect(replayMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "msg-assistant-static-tool",
          parts: expect.arrayContaining([
            expect.objectContaining({
              type: "tool-get_current_time",
              toolCallId: "tool-call-1",
              state: "output-available",
              output: { now: "2026-03-21" },
            }),
          ]),
        }),
      ]),
    );
    expect(result.current.messages.at(-1)?.id).toBe("msg-assistant-final");
  });

  it("surfaces persistence failures before runtime callbacks fire", async () => {
    mockReplacePersistedMessages.mockRejectedValueOnce(new Error("persist failed"));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("hello banana");
    });

    expect(mockCreateChatRuntime).not.toHaveBeenCalled();
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("persist failed");
    expect(result.current.messages[0]?.role).toBe("user");
  });

  it("stops the active turn and ignores late runtime updates", async () => {
    let releaseTurn:
      | (() => void)
      | undefined;
    let seenAbortSignal: AbortSignal | undefined;

    mockCreateChatRuntime.mockImplementation(({ onMessagesUpdate, onStatusChange }) => ({
      send: vi.fn(
        ({ messages, abortSignal }: { messages: BananaUIMessage[]; abortSignal?: AbortSignal }) =>
          new Promise<BananaUIMessage[]>((resolve, reject) => {
            seenAbortSignal = abortSignal;
            releaseTurn = () => {
              if (abortSignal?.aborted) {
                const abortError = new Error("aborted");
                abortError.name = "AbortError";
                reject(abortError);
                return;
              }

              const assistant = createAssistantMessage("msg-assistant-late", "late reply");
              const nextMessages = [...messages, assistant];
              onMessagesUpdate(nextMessages);
              onStatusChange("ready");
              resolve(nextMessages);
            };
          }),
      ),
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    let pending: Promise<boolean> | undefined;
    act(() => {
      pending = result.current.sendMessage("hello banana");
    });

    await waitFor(() => {
      expect(releaseTurn).toBeTypeOf("function");
    });

    act(() => {
      result.current.stop();
    });

    await act(async () => {
      releaseTurn?.();
      await pending;
    });

    expect(seenAbortSignal).toBeDefined();
    expect(seenAbortSignal?.aborted).toBe(true);
    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeUndefined();
    expect(result.current.messages).toHaveLength(1);
    expect(mockReplacePersistedMessages).toHaveBeenCalledTimes(1);
  });

  it("does not let an aborted stale turn reset the replacement turn status", async () => {
    let sendCount = 0;
    let releaseFirstTurn:
      | (() => void)
      | undefined;
    let resolveSecondTurn:
      | (() => void)
      | undefined;

    mockCreateChatRuntime.mockImplementation(({ onMessagesUpdate, onStatusChange }) => ({
      send: vi.fn(
        ({ messages, abortSignal }: { messages: BananaUIMessage[]; abortSignal?: AbortSignal }) =>
          new Promise<BananaUIMessage[]>((resolve, reject) => {
            sendCount += 1;

            if (sendCount === 1) {
              releaseFirstTurn = () => {
                if (abortSignal?.aborted) {
                  const abortError = new Error("aborted");
                  abortError.name = "AbortError";
                  reject(abortError);
                  return;
                }

                resolve(messages);
              };
              return;
            }

            onStatusChange("streaming");
            resolveSecondTurn = () => {
              const assistant = createAssistantMessage("msg-assistant-second", "second reply");
              const nextMessages = [...messages, assistant];
              onMessagesUpdate(nextMessages);
              onStatusChange("ready");
              resolve(nextMessages);
            };
          }),
      ),
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    let firstPending: Promise<boolean> | undefined;
    act(() => {
      firstPending = result.current.sendMessage("first");
    });

    await waitFor(() => {
      expect(releaseFirstTurn).toBeTypeOf("function");
    });

    let secondPending: Promise<boolean> | undefined;
    act(() => {
      secondPending = result.current.sendMessage("second");
    });

    await waitFor(() => {
      expect(resolveSecondTurn).toBeTypeOf("function");
    });

    expect(result.current.status).toBe("streaming");

    await act(async () => {
      releaseFirstTurn?.();
      await firstPending;
    });

    expect(result.current.status).toBe("streaming");

    await act(async () => {
      resolveSecondTurn?.();
      await secondPending;
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeUndefined();
  });

  it("serializes canonical writes so a lagging older turn cannot overwrite a newer turn", async () => {
    const firstFinalWrite = createDeferred<void>();
    const persistedSnapshots: string[][] = [];
    let replaceCallCount = 0;

    mockReplacePersistedMessages.mockImplementation(
      async (_threadId: string, messages: BananaUIMessage[]) => {
        replaceCallCount += 1;
        const snapshot = messages.map((message) => message.id);

        if (replaceCallCount === 2) {
          await firstFinalWrite.promise;
        }

        persistedSnapshots.push(snapshot);
      },
    );

    let sendCount = 0;
    let releaseFirstTurn:
      | (() => void)
      | undefined;

    mockCreateChatRuntime.mockImplementation(({ onMessagesUpdate, onStatusChange }) => ({
      send: vi.fn(
        ({ messages }: { messages: BananaUIMessage[] }) =>
          new Promise<BananaUIMessage[]>((resolve) => {
            sendCount += 1;

            const complete = () => {
              onStatusChange("streaming");
              const assistant = createAssistantMessage(
                sendCount === 1 ? "msg-assistant-first" : "msg-assistant-second",
                sendCount === 1 ? "first reply" : "second reply",
              );
              const nextMessages = [...messages, assistant];
              onMessagesUpdate(nextMessages);
              onStatusChange("ready");
              resolve(nextMessages);
            };

            if (sendCount === 1) {
              releaseFirstTurn = complete;
              return;
            }

            complete();
          }),
      ),
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    let firstPending: Promise<boolean> | undefined;
    act(() => {
      firstPending = result.current.sendMessage("first");
    });

    await waitFor(() => {
      expect(releaseFirstTurn).toBeTypeOf("function");
    });

    act(() => {
      releaseFirstTurn?.();
    });

    await waitFor(() => {
      expect(mockReplacePersistedMessages).toHaveBeenCalledTimes(2);
    });

    let secondPending: Promise<boolean> | undefined;
    act(() => {
      secondPending = result.current.sendMessage("second");
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCreateChatRuntime).toHaveBeenCalledTimes(1);

    firstFinalWrite.resolve(undefined);

    await act(async () => {
      await firstPending;
      await secondPending;
    });

    expect(mockCreateChatRuntime).toHaveBeenCalledTimes(2);
    expect(persistedSnapshots.at(-1)).toHaveLength(4);
    expect(persistedSnapshots.at(-1)?.[1]).toBe("msg-assistant-first");
    expect(persistedSnapshots.at(-1)?.[3]).toBe("msg-assistant-second");
  });

  it("does not start a new persistence write after stop lands between runtime resolution and snapshot persistence", async () => {
    mockCreateChatRuntime.mockImplementation(({ onMessagesUpdate, onStatusChange }) => ({
      send: vi.fn(
        ({ messages }: { messages: BananaUIMessage[] }) =>
          ({
            then(resolve: (value: BananaUIMessage[]) => void) {
              const assistant = createAssistantMessage("msg-assistant-race", "race reply");
              const nextMessages = [...messages, assistant];
              onMessagesUpdate(nextMessages);
              onStatusChange("streaming");
              result.current.stop();
              resolve(nextMessages);
            },
          }) as PromiseLike<BananaUIMessage[]>,
      ),
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("hello banana");
    });

    expect(mockReplacePersistedMessages).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("ready");
    expect(result.current.messages).toHaveLength(2);
  });

  it("does not start the post-runtime persistence write when stop lands after runtime resolves but before persistence begins", async () => {
    let stopTriggered = false;

    mockCreateChatRuntime.mockImplementation(() => ({
      send: vi.fn(async ({ messages }: { messages: BananaUIMessage[] }) => {
        const assistant: BananaUIMessage = {
          id: "msg-assistant-gated",
          role: "assistant",
          parts: [{ type: "text", text: "gated reply" }],
          get metadata() {
            if (!stopTriggered) {
              stopTriggered = true;
              result.current.stop();
            }

            return { threadId: "thread-1" };
          },
        };

        return [...messages, assistant];
      }),
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("hello banana");
    });

    expect(mockReplacePersistedMessages).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeUndefined();
  });

  it("ignores stale hydrate success after switching threads", async () => {
    const threadOne = createDeferred<BananaUIMessage[]>();
    const threadTwo = createDeferred<BananaUIMessage[]>();

    mockLoadPersistedMessages.mockImplementation((requestedThreadId: string) => {
      if (requestedThreadId === "thread-1") {
        return threadOne.promise;
      }

      return threadTwo.promise;
    });

    const { result, rerender } = renderHook(
      ({ activeThreadId }: { activeThreadId: string }) => useChatSession(activeThreadId),
      {
        initialProps: { activeThreadId: "thread-1" },
      },
    );

    expect(result.current.status).toBe("hydrating");

    rerender({ activeThreadId: "thread-2" });

    threadTwo.resolve([createUserMessage("msg-user-thread-2", "thread two", "thread-2")]);

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(result.current.messages).toEqual([
      expect.objectContaining({
        ...createUserMessage("msg-user-thread-2", "thread two", "thread-2"),
        metadata: expect.objectContaining({
          threadId: "thread-2",
          createdAt: expect.any(String),
        }),
      }),
    ]);

    threadOne.resolve([createUserMessage("msg-user-thread-1", "thread one", "thread-1")]);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.messages).toEqual([
      expect.objectContaining({
        ...createUserMessage("msg-user-thread-2", "thread two", "thread-2"),
        metadata: expect.objectContaining({
          threadId: "thread-2",
          createdAt: expect.any(String),
        }),
      }),
    ]);
    expect(result.current.error).toBeUndefined();
  });

  it("ignores stale hydrate errors after a newer thread load succeeds", async () => {
    const threadOne = createDeferred<BananaUIMessage[]>();
    const threadTwo = createDeferred<BananaUIMessage[]>();

    mockLoadPersistedMessages.mockImplementation((requestedThreadId: string) => {
      if (requestedThreadId === "thread-1") {
        return threadOne.promise;
      }

      return threadTwo.promise;
    });

    const { result, rerender } = renderHook(
      ({ activeThreadId }: { activeThreadId: string }) => useChatSession(activeThreadId),
      {
        initialProps: { activeThreadId: "thread-1" },
      },
    );

    rerender({ activeThreadId: "thread-2" });
    threadTwo.resolve([createUserMessage("msg-user-thread-2", "thread two", "thread-2")]);

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    threadOne.reject(new Error("thread one failed"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.messages).toEqual([
      expect.objectContaining({
        ...createUserMessage("msg-user-thread-2", "thread two", "thread-2"),
        metadata: expect.objectContaining({
          threadId: "thread-2",
          createdAt: expect.any(String),
        }),
      }),
    ]);
    expect(result.current.error).toBeUndefined();
  });

  it("filters tool-role messages before crossing the runtime transport boundary", async () => {
    mockLoadPersistedMessages.mockResolvedValueOnce([
      createUserMessage("msg-user-1", "hello"),
      createAssistantToolCallMessage(),
      createToolMessage("msg-tool-1", "12:00"),
    ]);

    const sendMock = vi.fn(async ({ messages }: { messages: BananaUIMessage[] }) => {
      const assistant = createAssistantMessage("msg-assistant-1", "assistant reply");
      return [...messages, assistant];
    });
    mockCreateChatRuntime.mockImplementation(() => ({
      send: sendMock,
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("follow up");
    });

    const runtimeMessages = sendMock.mock.calls[0]?.[0]?.messages as BananaUIMessage[];
    expect(runtimeMessages.map((message) => message.role)).toEqual(["user", "assistant", "user"]);
  });

  it("preserves unknown assistant parts across the runtime transport boundary", async () => {
    mockLoadPersistedMessages.mockResolvedValueOnce([
      createUserMessage("msg-user-1", "hello"),
      createUnknownPartAssistantMessage(),
    ]);

    const sendMock = vi.fn(async ({ messages }: { messages: BananaUIMessage[] }) => {
      const assistant = createAssistantMessage("msg-assistant-1", "assistant reply");
      return [...messages, assistant];
    });
    mockCreateChatRuntime.mockImplementation(() => ({
      send: sendMock,
    }));

    const { result } = renderHook(() => useChatSession("thread-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.sendMessage("follow up");
    });

    const runtimeMessages = sendMock.mock.calls[0]?.[0]?.messages as BananaUIMessage[];
    expect(runtimeMessages[1]?.parts).toEqual([
      { type: "text", text: "assistant reply" },
      { type: "reasoning", text: "kept for future transport compatibility" },
    ]);
  });
});
