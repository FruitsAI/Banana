import { describe, expect, it } from "vitest";
import { createInitialChatSessionState, reduceChatSession } from "@/domain/chat/session";

describe("chat session reducer", () => {
  it("moves from ready to submitting when a message is sent", () => {
    const initial = createInitialChatSessionState("thread-1");
    const next = reduceChatSession(initial, {
      type: "SEND_MESSAGE",
      messageId: "msg-user-2",
    });

    expect(next.status).toBe("submitting");
    expect(next.activeThreadId).toBe("thread-1");
  });
});
