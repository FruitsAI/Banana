import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersistedMessageRecord } from "@/lib/db";
import {
  createLegacyRow,
  createToolAssistantMessage,
} from "@/domain/chat/__tests__/fixtures";
import {
  fromStoredMessageRecord,
  loadPersistedMessages,
  replacePersistedMessages,
  toStoredMessageRecord,
} from "@/services/chat/persistence";

const {
  mockGetPersistedMessages,
  mockDeleteMessagesAfter,
  mockAppendPersistedMessage,
} = vi.hoisted(() => ({
  mockGetPersistedMessages: vi.fn<
    (threadId: string) => Promise<PersistedMessageRecord[]>
  >(),
  mockDeleteMessagesAfter: vi.fn<
    (threadId: string, messageId: string) => Promise<void>
  >(),
  mockAppendPersistedMessage: vi.fn<
    (msg: Omit<PersistedMessageRecord, "created_at">) => Promise<void>
  >(),
}));

vi.mock("@/lib/db", () => ({
  getPersistedMessages: mockGetPersistedMessages,
  deleteMessagesAfter: mockDeleteMessagesAfter,
  appendPersistedMessage: mockAppendPersistedMessage,
}));

describe("chat persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores assistant tool parts in ui_message_json while keeping plain-text content", () => {
    const record = toStoredMessageRecord("thread-1", createToolAssistantMessage());

    expect(record.content).toContain("final answer");
    expect(record.ui_message_json).toContain("\"toolName\"");
  });

  it("keeps ui_message_json on stored records", () => {
    const record = toStoredMessageRecord("thread-1", createToolAssistantMessage());
    expect(record.ui_message_json).toBeTruthy();
  });

  it("hydrates legacy rows without ui_message_json", () => {
    const message = fromStoredMessageRecord({
      ...createLegacyRow(),
      thread_id: "thread-1",
      created_at: "2026-03-20T12:00:00.000Z",
    });

    expect(message.role).toBe("user");
    expect(message.parts[0]).toEqual({ type: "text", text: "hello banana" });
    expect(message.metadata).toEqual({
      threadId: "thread-1",
      createdAt: "2026-03-20T12:00:00.000Z",
      modelId: undefined,
      providerId: undefined,
      searchEnabled: undefined,
      thinkEnabled: undefined,
    });
  });

  it("replaces persisted messages by clearing existing records then appending new ones", async () => {
    mockGetPersistedMessages.mockResolvedValueOnce([
      {
        id: "old-1",
        thread_id: "thread-1",
        role: "user",
        content: "old message",
        model_id: undefined,
        ui_message_json: null,
      },
    ]);
    mockDeleteMessagesAfter.mockResolvedValue(undefined);
    mockAppendPersistedMessage.mockResolvedValue(undefined);

    await replacePersistedMessages("thread-1", [createToolAssistantMessage()]);

    expect(mockDeleteMessagesAfter).toHaveBeenCalledWith("thread-1", "old-1");
    expect(mockAppendPersistedMessage).toHaveBeenCalledTimes(1);
  });

  it("best-effort rollbacks to previous snapshot when replacement append fails", async () => {
    const existing: PersistedMessageRecord[] = [
      {
        id: "old-1",
        thread_id: "thread-1",
        role: "assistant",
        content: "previous answer",
        model_id: "gpt-4o-mini",
        ui_message_json: "{\"id\":\"old-1\"}",
      },
    ];

    mockGetPersistedMessages
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce([
        {
          id: "new-partial-1",
          thread_id: "thread-1",
          role: "assistant",
          content: "partial",
          model_id: undefined,
          ui_message_json: null,
        },
      ]);
    mockDeleteMessagesAfter.mockResolvedValue(undefined);
    mockAppendPersistedMessage
      .mockRejectedValueOnce(new Error("append failed"))
      .mockResolvedValueOnce(undefined);

    await expect(
      replacePersistedMessages("thread-1", [createToolAssistantMessage()]),
    ).rejects.toThrow("append failed");

    expect(mockDeleteMessagesAfter).toHaveBeenNthCalledWith(1, "thread-1", "old-1");
    expect(mockDeleteMessagesAfter).toHaveBeenNthCalledWith(2, "thread-1", "new-partial-1");
    expect(mockAppendPersistedMessage).toHaveBeenLastCalledWith({
      id: "old-1",
      thread_id: "thread-1",
      role: "assistant",
      content: "previous answer",
      model_id: "gpt-4o-mini",
      ui_message_json: "{\"id\":\"old-1\"}",
    });
  });

  it("cleans up partial new writes when replacement fails on an initially empty thread", async () => {
    const firstNew = createToolAssistantMessage();
    const secondNew = { ...createToolAssistantMessage(), id: "msg-assistant-2" };

    mockGetPersistedMessages
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "partial-new-1",
          thread_id: "thread-1",
          role: "assistant",
          content: "partial answer",
          model_id: undefined,
          ui_message_json: null,
        },
      ]);
    mockDeleteMessagesAfter.mockResolvedValue(undefined);
    mockAppendPersistedMessage
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("append failed"));

    await expect(
      replacePersistedMessages("thread-1", [firstNew, secondNew]),
    ).rejects.toThrow("append failed");

    expect(mockDeleteMessagesAfter).toHaveBeenCalledTimes(1);
    expect(mockDeleteMessagesAfter).toHaveBeenCalledWith("thread-1", "partial-new-1");
  });

  it("surfaces inconsistency risk when replacement and rollback both fail", async () => {
    mockGetPersistedMessages
      .mockResolvedValueOnce([
        {
          id: "old-1",
          thread_id: "thread-1",
          role: "assistant",
          content: "previous answer",
          model_id: "gpt-4o-mini",
          ui_message_json: "{\"id\":\"old-1\"}",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "partial-1",
          thread_id: "thread-1",
          role: "assistant",
          content: "partial answer",
          model_id: undefined,
          ui_message_json: null,
        },
      ]);
    mockDeleteMessagesAfter
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("rollback cleanup failed"));
    mockAppendPersistedMessage.mockRejectedValueOnce(new Error("append failed"));

    const run = replacePersistedMessages("thread-1", [createToolAssistantMessage()]);
    await expect(run).rejects.toThrow("thread may be inconsistent");
    await expect(run).rejects.toThrow("replacementError=append failed");
    await expect(run).rejects.toThrow("rollbackError=rollback cleanup failed");
  });

  it("loads persisted rows through legacy-aware normalization", async () => {
    mockGetPersistedMessages.mockResolvedValueOnce([
      {
        id: "legacy-1",
        thread_id: "thread-1",
        role: "user",
        content: "legacy content",
        model_id: undefined,
        ui_message_json: null,
      },
    ]);

    const messages = await loadPersistedMessages("thread-1");

    expect(messages).toHaveLength(1);
    expect(messages[0].parts[0]).toEqual({ type: "text", text: "legacy content" });
  });

  it("synthesizes a stable fallback id when persisted assistant rows contain blank ids", () => {
    const message = fromStoredMessageRecord({
      id: "",
      thread_id: "thread-1",
      role: "assistant",
      content: "hello from broken row",
      created_at: "2026-03-20T15:10:29.943Z",
      ui_message_json: JSON.stringify({
        id: "",
        role: "assistant",
        parts: [{ type: "text", text: "hello from broken row" }],
        metadata: {
          threadId: "thread-1",
          createdAt: "2026-03-20T15:10:29.943Z",
        },
      }),
    });

    expect(message.id).not.toBe("");
    expect(message.id).toContain("thread-1");
    expect(message.parts).toEqual([{ type: "text", text: "hello from broken row" }]);
  });
});
