import { describe, expect, it } from "vitest";
import {
  createLegacyRow,
  createToolAssistantMessage,
} from "@/domain/chat/__tests__/fixtures";
import {
  fromStoredMessageRecord,
  toStoredMessageRecord,
} from "@/services/chat/persistence";

describe("chat persistence", () => {
  it("stores assistant tool parts in ui_message_json while keeping plain-text content", () => {
    const record = toStoredMessageRecord("thread-1", createToolAssistantMessage());

    expect(record.content).toContain("final answer");
    expect(record.ui_message_json).toContain("\"toolName\"");
  });

  it("hydrates legacy rows without ui_message_json", () => {
    const message = fromStoredMessageRecord(createLegacyRow());

    expect(message.role).toBe("user");
    expect(message.parts[0]).toEqual({ type: "text", text: "hello banana" });
  });
});
