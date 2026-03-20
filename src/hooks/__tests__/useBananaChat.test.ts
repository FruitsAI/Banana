import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BananaUIMessage, ChatMessage } from "@/domain/chat/types";
import { useBananaChat } from "@/hooks/useBananaChat";

const { mockUseChatSession, mockUuidV4 } = vi.hoisted(() => ({
  mockUseChatSession: vi.fn(),
  mockUuidV4: vi.fn(() => "thread-generated"),
}));

vi.mock("@/stores/chat/useChatSession", () => ({
  useChatSession: mockUseChatSession,
}));

vi.mock("uuid", () => ({
  v4: mockUuidV4,
}));

interface MockChatSession {
  editUserMessage: ReturnType<typeof vi.fn>;
  error?: string;
  loadThread: ReturnType<typeof vi.fn>;
  messages: BananaUIMessage[];
  regenerate: ReturnType<typeof vi.fn>;
  retry: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  status: "error" | "hydrating" | "ready" | "streaming" | "submitting" | "tool-running";
  stop: ReturnType<typeof vi.fn>;
}

function createSession(overrides: Partial<MockChatSession> = {}): MockChatSession {
  return {
    status: "ready",
    messages: [],
    error: undefined,
    loadThread: vi.fn(),
    sendMessage: vi.fn(async () => {}),
    regenerate: vi.fn(async () => {}),
    editUserMessage: vi.fn(async () => {}),
    retry: vi.fn(async () => {}),
    stop: vi.fn(),
    ...overrides,
  };
}

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

function createAssistantMessageWithTool(threadId = "thread-1"): BananaUIMessage {
  return {
    id: "msg-assistant-1",
    role: "assistant",
    parts: [
      { type: "text", text: "assistant reply" },
      {
        type: "dynamic-tool",
        toolName: "get_current_time",
        toolCallId: "tool-call-1",
        state: "output-available",
        input: { timezone: "Asia/Shanghai" },
        output: { now: "2026-03-20 12:00:00" },
      },
    ],
    metadata: { threadId, modelId: "gpt-4o-mini", createdAt: "2026-03-20T12:00:00.000Z" },
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

describe("useBananaChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("maps chat-session messages into the legacy stage shape and filters raw tool rows", () => {
    mockUseChatSession.mockReturnValue(
      createSession({
        status: "tool-running",
        error: "stream failed",
        messages: [
          createUserMessage("msg-user-1", "hello banana"),
          createAssistantMessageWithTool(),
          createToolMessage("msg-tool-1", "12:00"),
        ],
      }),
    );

    const { result } = renderHook(() => useBananaChat("thread-1"));

    expect(result.current.messages).toEqual<ChatMessage[]>([
      {
        id: "msg-user-1",
        role: "user",
        content: "hello banana",
        modelId: undefined,
        createdAt: undefined,
      },
      {
        id: "msg-assistant-1",
        role: "assistant",
        content: "assistant reply",
        modelId: "gpt-4o-mini",
        createdAt: "2026-03-20T12:00:00.000Z",
        toolInvocations: [
          {
            state: "result",
            toolCallId: "tool-call-1",
            toolName: "get_current_time",
            args: { timezone: "Asia/Shanghai" },
            result: { now: "2026-03-20 12:00:00" },
          },
        ],
      },
    ]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe("stream failed");
  });

  it("promotes default-thread sends to a generated thread id and delegates to that session", async () => {
    const defaultSession = createSession();
    const promotedSession = createSession();
    mockUseChatSession.mockImplementation((activeThreadId: string) => {
      return activeThreadId === "thread-generated" ? promotedSession : defaultSession;
    });
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    const { result } = renderHook(() => useBananaChat("default-thread"));

    await act(async () => {
      await result.current.append(
        { role: "user", content: "hello banana" },
        { isSearch: true, isThink: false },
      );
    });

    expect(mockUseChatSession).toHaveBeenCalledWith("thread-generated");
    expect(promotedSession.sendMessage).toHaveBeenCalledWith("hello banana", {
      isSearch: true,
      isThink: false,
    });
    expect(defaultSession.sendMessage).not.toHaveBeenCalled();
    expect(replaceStateSpy).toHaveBeenCalled();
    expect(window.location.search).toContain("thread=thread-generated");
  });

  it("returns to default-thread when the route really clears the thread param", async () => {
    const defaultSession = createSession();
    const activeSession = createSession();
    mockUseChatSession.mockImplementation((activeThreadId: string) => {
      return activeThreadId === "default-thread" ? defaultSession : activeSession;
    });

    window.history.replaceState(null, "", "/?thread=thread-1");
    const { rerender } = renderHook(({ threadId }: { threadId: string }) => useBananaChat(threadId), {
      initialProps: { threadId: "thread-1" },
    });

    expect(mockUseChatSession).toHaveBeenLastCalledWith("thread-1");

    window.history.replaceState(null, "", "/");
    rerender({ threadId: "default-thread" });

    await waitFor(() => {
      expect(mockUseChatSession).toHaveBeenLastCalledWith("default-thread");
    });
  });

  it("regenerate routes user messages through editUserMessage with existing content", async () => {
    const session = createSession({
      messages: [createUserMessage("msg-user-1", "first draft")],
    });
    mockUseChatSession.mockReturnValue(session);

    const { result } = renderHook(() => useBananaChat("thread-1"));

    await act(async () => {
      await result.current.regenerate("msg-user-1", {
        isSearch: false,
        isThink: true,
      });
    });

    expect(session.editUserMessage).toHaveBeenCalledWith("msg-user-1", "first draft", {
      isSearch: false,
      isThink: true,
    });
    expect(session.regenerate).not.toHaveBeenCalled();
  });

  it("updateMessageContent delegates to editUserMessage so the stage can save and rerun in one action", async () => {
    const session = createSession();
    mockUseChatSession.mockReturnValue(session);

    const { result } = renderHook(() => useBananaChat("thread-1"));

    await act(async () => {
      await result.current.updateMessageContent("msg-user-1", "edited text", {
        isSearch: true,
        isThink: true,
      });
    });

    expect(session.editUserMessage).toHaveBeenCalledWith("msg-user-1", "edited text", {
      isSearch: true,
      isThink: true,
    });
  });
});
