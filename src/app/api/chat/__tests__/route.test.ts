import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";
import { POST } from "@/app/api/chat/route";

const {
  mockValidateUIMessages,
  mockConvertToModelMessages,
  mockStreamText,
  mockCreateOpenAI,
} = vi.hoisted(() => ({
  mockValidateUIMessages: vi.fn(),
  mockConvertToModelMessages: vi.fn(),
  mockStreamText: vi.fn(),
  mockCreateOpenAI: vi.fn(),
}));

vi.mock("ai", () => ({
  validateUIMessages: mockValidateUIMessages,
  convertToModelMessages: mockConvertToModelMessages,
  streamText: mockStreamText,
  tool: vi.fn((definition: unknown) => definition),
  jsonSchema: vi.fn((schema: unknown) => schema),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: mockCreateOpenAI,
}));

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const openaiProvider = Object.assign(
      vi.fn((modelId: string) => ({ kind: "responses", modelId })),
      {
        chat: vi.fn((modelId: string) => ({ kind: "chat", modelId })),
      },
    );

    mockCreateOpenAI.mockReturnValue(openaiProvider);

    mockValidateUIMessages.mockImplementation(
      async ({ messages }: { messages: unknown }) => messages,
    );
    mockConvertToModelMessages.mockImplementation(
      async (messages: Array<Omit<UIMessage, "id">>) => messages,
    );
    mockStreamText.mockResolvedValue({
      toUIMessageStreamResponse: () => new Response("ok"),
    });
  });

  it("validates ui messages and returns a ui message stream response", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }],
        apiKey: "test-key",
        modelId: "gpt-4o-mini",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockValidateUIMessages).toHaveBeenCalledTimes(1);
    expect(mockConvertToModelMessages).toHaveBeenCalledTimes(1);
    expect(mockStreamText).toHaveBeenCalledTimes(1);
  });
});
