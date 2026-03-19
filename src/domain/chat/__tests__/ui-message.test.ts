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
});
