import { describe, expect, it } from "vitest";
import { createLegacyRow, createToolAssistantMessage } from "./fixtures";
import { coerceStoredMessageToUIMessage, summarizeMessageText } from "@/domain/chat/ui-message";

describe("chat ui message normalization", () => {
  it("maps a legacy stored row into a UI message", () => {
    const result = coerceStoredMessageToUIMessage(createLegacyRow());

    expect(result.id).toBe("msg-user-1");
    expect(result.role).toBe("user");
    expect(result.parts).toEqual([{ type: "text", text: "hello banana" }]);
  });

  it("extracts summary text from assistant parts", () => {
    const result = summarizeMessageText(createToolAssistantMessage());
    expect(result).toContain("final answer");
  });

  it("preserves banana metadata when normalizing serialized ui messages", () => {
    const result = coerceStoredMessageToUIMessage({
      id: "msg-assistant-1",
      role: "assistant",
      content: "fallback",
      ui_message_json: JSON.stringify({
        id: "msg-assistant-1",
        role: "assistant",
        parts: [{ type: "text", text: "streamed answer" }],
        metadata: { modelId: "gpt-4o-mini", threadId: "thread-1" },
      }),
    });

    expect(result.metadata?.modelId).toBe("gpt-4o-mini");
    expect(result.metadata?.threadId).toBe("thread-1");
    expect(summarizeMessageText(result)).toBe("streamed answer");
  });
});
