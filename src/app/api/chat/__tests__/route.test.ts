import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";
import { POST } from "@/app/api/chat/route";

const {
  mockValidateUIMessages,
  mockConvertToModelMessages,
  mockStreamText,
  mockTool,
  mockDynamicTool,
  mockCreateOpenAI,
} = vi.hoisted(() => ({
  mockValidateUIMessages: vi.fn(),
  mockConvertToModelMessages: vi.fn(),
  mockStreamText: vi.fn(),
  mockTool: vi.fn((definition: unknown) => definition),
  mockDynamicTool: vi.fn((definition: unknown) => definition),
  mockCreateOpenAI: vi.fn(),
}));

vi.mock("ai", () => ({
  validateUIMessages: mockValidateUIMessages,
  convertToModelMessages: mockConvertToModelMessages,
  streamText: mockStreamText,
  tool: mockTool,
  dynamicTool: mockDynamicTool,
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

  it("strips ids before model conversion and uses the default compatible provider path", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ id: "ui-1", role: "user", parts: [{ type: "text", text: "hello" }] }],
        apiKey: "test-key",
        modelId: "gpt-4o-mini",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockValidateUIMessages).toHaveBeenCalledWith({
      messages: [{ id: "ui-1", role: "user", parts: [{ type: "text", text: "hello" }] }],
      tools: {},
    });
    expect(mockConvertToModelMessages).toHaveBeenCalledWith(
      [{ role: "user", parts: [{ type: "text", text: "hello" }] }],
      { tools: {} },
    );

    const openaiProvider = mockCreateOpenAI.mock.results[0]?.value;
    expect(openaiProvider.chat).toHaveBeenCalledWith("gpt-4o-mini");
    expect(openaiProvider).not.toHaveBeenCalled();

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { kind: "chat", modelId: "gpt-4o-mini" },
        messages: [{ role: "user", parts: [{ type: "text", text: "hello" }] }],
        system: expect.any(String),
        tools: {},
      }),
    );

    const streamCall = mockStreamText.mock.calls[0]?.[0];
    expect(streamCall.system).toContain("[IMPORTANT Context]");
    expect(streamCall.system).toContain("Local timezone: Asia/Shanghai");
    expect(streamCall.system).toContain("timezone");
    expect((streamCall.system.match(/\[IMPORTANT Context\]/g) ?? []).length).toBe(1);
  });

  it("normalizes legacy message history before validation", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { role: "user", content: "hello from legacy" },
          {
            role: "assistant",
            content: [
              { type: "text", text: "calling tool" },
              {
                type: "tool-call",
                toolCallId: "call-1",
                toolName: "get_current_time",
                args: { timezone: "Asia/Shanghai" },
              },
            ],
          },
          {
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolCallId: "call-1",
                toolName: "get_current_time",
                output: { now: "2026-03-19 23:00:00" },
              },
            ],
          },
        ],
        apiKey: "test-key",
        modelId: "gpt-4o-mini",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockValidateUIMessages).toHaveBeenCalledWith({
      messages: [
        {
          id: "legacy-message-1",
          role: "user",
          parts: [{ type: "text", text: "hello from legacy" }],
        },
        {
          id: "legacy-message-2",
          role: "assistant",
          parts: [
            { type: "text", text: "calling tool" },
            {
              type: "dynamic-tool",
              toolCallId: "call-1",
              toolName: "get_current_time",
              state: "output-available",
              input: { timezone: "Asia/Shanghai" },
              output: { now: "2026-03-19 23:00:00" },
            },
          ],
        },
      ],
      tools: {},
    });
  });

  it("returns the legacy Chinese error when apiKey is missing", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "API Key 未提供" });
  });
});
