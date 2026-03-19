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
  mockDeleteMessagesAfter,
  mockUpdateMessage,
  mockGetProvidersForChat,
  mockGetMcpServersForChat,
  mockGetActiveModelSelection,
  mockEnsureProvidersReady,
  mockEnsureProviderModelsReady,
} = vi.hoisted(() => ({
  mockLoadPersistedMessages: vi.fn(),
  mockReplacePersistedMessages: vi.fn(),
  mockCreateChatRuntime: vi.fn(),
  mockCreateRuntimeToolMap: vi.fn(),
  mockCreateThread: vi.fn(),
  mockDeleteMessagesAfter: vi.fn(),
  mockUpdateMessage: vi.fn(),
  mockGetProvidersForChat: vi.fn(),
  mockGetMcpServersForChat: vi.fn(),
  mockGetActiveModelSelection: vi.fn(),
  mockEnsureProvidersReady: vi.fn(),
  mockEnsureProviderModelsReady: vi.fn(),
}));

vi.mock("@/services/chat", () => ({
  loadPersistedMessages: mockLoadPersistedMessages,
  createChatRuntime: mockCreateChatRuntime,
  createRuntimeToolMap: mockCreateRuntimeToolMap,
  createThread: mockCreateThread,
  deleteMessagesAfter: mockDeleteMessagesAfter,
  updateMessage: mockUpdateMessage,
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

describe("useChatSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLoadPersistedMessages.mockResolvedValue([]);
    mockReplacePersistedMessages.mockResolvedValue(undefined);
    mockCreateThread.mockResolvedValue(undefined);
    mockDeleteMessagesAfter.mockResolvedValue(undefined);
    mockUpdateMessage.mockResolvedValue(undefined);
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
    mockEnsureProviderModelsReady.mockResolvedValue([]);
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
      createUserMessage("msg-user-1", "hello banana"),
    ]);
  });

  it("sendMessage persists the user turn and streams the assistant reply", async () => {
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
    expect(result.current.messages[1]).toEqual(
      createAssistantMessage("msg-assistant-1", "assistant reply"),
    );
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

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: hydratedMessages.slice(0, 3),
      }),
    );
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
});
