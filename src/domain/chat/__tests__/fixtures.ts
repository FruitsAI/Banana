export function createLegacyRow() {
  return {
    id: "msg-user-1",
    role: "user",
    content: "hello banana",
  };
}

export function createToolAssistantMessage() {
  return {
    id: "msg-assistant-1",
    role: "assistant",
    parts: [
      { type: "tool-call", toolName: "get_current_time", input: { timezone: "Asia/Shanghai" } },
      { type: "text", text: "final answer with tool result" },
    ],
  };
}
