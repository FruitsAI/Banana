import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";
import {
  POST,
  patchCompatibleThinkingRequestBody,
  rewriteCompatibleReasoningSsePayload,
  shouldUseCompatibleReasoningBridge,
} from "@/app/api/chat/route";

type MockToolDefinition = {
  inputSchema?: unknown;
};

type MockUIMessageStreamOptions = {
  generateMessageId?: () => string;
};

const {
  mockValidateUIMessages,
  mockConvertToModelMessages,
  mockStreamText,
  mockToUIMessageStreamResponse,
  mockTool,
  mockDynamicTool,
  mockCreateOpenAI,
} = vi.hoisted(() => ({
  mockValidateUIMessages: vi.fn(),
  mockConvertToModelMessages: vi.fn(),
  mockStreamText: vi.fn(),
  mockToUIMessageStreamResponse: vi.fn((options?: MockUIMessageStreamOptions) => {
    void options;
    return new Response("ok");
  }),
  mockTool: vi.fn((definition: MockToolDefinition) => definition),
  mockDynamicTool: vi.fn((definition: MockToolDefinition) => definition),
  mockCreateOpenAI: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    validateUIMessages: mockValidateUIMessages,
    convertToModelMessages: mockConvertToModelMessages,
    streamText: mockStreamText,
    tool: mockTool,
    dynamicTool: mockDynamicTool,
  };
});

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
      toUIMessageStreamResponse: mockToUIMessageStreamResponse,
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

  it("wraps raw JSON tool schemas before passing them to AI SDK tools", async () => {
    const rawSchema = {
      type: "object",
      properties: {
        timezone: { type: "string" },
      },
      required: ["timezone"],
    };

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ id: "ui-1", role: "user", parts: [{ type: "text", text: "现在几点" }] }],
        apiKey: "test-key",
        modelId: "gpt-4o-mini",
        tools: [
          {
            name: "get_current_time",
            description: "Return the current local time",
            inputSchema: rawSchema,
          },
        ],
      }),
    });

    const response = await POST(request);
    const actualAi = await vi.importActual<typeof import("ai")>("ai");
    const wrappedValidationSchema = mockDynamicTool.mock.calls[0]?.[0]?.inputSchema as
      | Parameters<typeof actualAi.asSchema>[0]
      | undefined;
    const wrappedStreamSchema = mockTool.mock.calls[0]?.[0]?.inputSchema as
      | Parameters<typeof actualAi.asSchema>[0]
      | undefined;
    const validationSchema = actualAi.asSchema(
      wrappedValidationSchema,
    );
    const streamSchema = actualAi.asSchema(
      wrappedStreamSchema,
    );

    expect(response.status).toBe(200);
    expect(validationSchema.jsonSchema).toMatchObject(rawSchema);
    expect(streamSchema.jsonSchema).toMatchObject(rawSchema);
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

  it("provides a generated response message id to the UI stream response", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ id: "ui-1", role: "user", parts: [{ type: "text", text: "hello" }] }],
        apiKey: "test-key",
        modelId: "gpt-4o-mini",
      }),
    });

    const response = await POST(request);
    const options = mockToUIMessageStreamResponse.mock.calls[0]?.[0];

    expect(response.status).toBe(200);
    expect(options).toBeDefined();
    expect(options?.generateMessageId).toEqual(expect.any(Function));
    const generateMessageId = options?.generateMessageId;
    if (typeof generateMessageId !== "function") {
      throw new Error("generateMessageId should be defined");
    }
    expect(generateMessageId()).toEqual(expect.any(String));
    expect(generateMessageId()).not.toBe("");
  });

  it("guides the model to avoid unnecessary tool calls for pure reasoning tasks", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ id: "ui-1", role: "user", parts: [{ type: "text", text: "9.11 和 9.9 哪个更大？" }] }],
        apiKey: "test-key",
        modelId: "z-ai/glm5",
        baseURL: "https://integrate.api.nvidia.com/v1",
        providerType: "openai",
      }),
    });

    const response = await POST(request);
    const streamCall = mockStreamText.mock.calls.at(-1)?.[0];

    expect(response.status).toBe(200);
    expect(streamCall.system).toContain("Only use tools when the user asks for real-world, current, or external information");
    expect(streamCall.system).toContain("Do NOT use tools for pure reasoning, math, writing, translation, or summarization");
    expect(streamCall.system).not.toContain("like get_current_time");
  });

  it("does not route anthropic requests through the openai-compatible client", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ id: "ui-1", role: "user", parts: [{ type: "text", text: "hello" }] }],
        apiKey: "test-key",
        baseURL: "https://api.anthropic.com/v1",
        modelId: "claude-3-5-sonnet",
        providerType: "anthropic",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockCreateOpenAI).not.toHaveBeenCalled();
  });

  it("detects NVIDIA-compatible reasoning models that need a reasoning bridge", () => {
    expect(
      shouldUseCompatibleReasoningBridge({
        baseURL: "https://integrate.api.nvidia.com/v1",
        modelId: "z-ai/glm5",
        providerType: "openai",
      }),
    ).toBe(true);

    expect(
      shouldUseCompatibleReasoningBridge({
        baseURL: "https://api.openai.com/v1",
        modelId: "gpt-4o-mini",
        providerType: "openai",
      }),
    ).toBe(false);
  });

  it("injects thinking disabled for NVIDIA-compatible requests when the thinking toggle is off", () => {
    const patchedBody = patchCompatibleThinkingRequestBody(
      JSON.stringify({
        model: "z-ai/glm5",
        stream: true,
        messages: [{ role: "user", content: "hello" }],
      }),
      {
        baseURL: "https://integrate.api.nvidia.com/v1",
        modelId: "z-ai/glm5",
        providerType: "openai",
        isThink: false,
      },
    );

    expect(JSON.parse(patchedBody)).toMatchObject({
      thinking: {
        type: "disabled",
      },
    });
  });

  it("injects thinking enabled for NVIDIA-compatible requests when the thinking toggle is on", () => {
    const patchedBody = patchCompatibleThinkingRequestBody(
      JSON.stringify({
        model: "z-ai/glm5",
        stream: true,
        messages: [{ role: "user", content: "hello" }],
      }),
      {
        baseURL: "https://integrate.api.nvidia.com/v1",
        modelId: "z-ai/glm5",
        providerType: "openai",
        isThink: true,
      },
    );

    expect(JSON.parse(patchedBody)).toMatchObject({
      thinking: {
        type: "enabled",
      },
    });
  });

  it("adds GLM chat_template_kwargs when enabling thinking on NVIDIA-compatible z-ai models", () => {
    const patchedBody = patchCompatibleThinkingRequestBody(
      JSON.stringify({
        model: "z-ai/glm5",
        stream: true,
        messages: [{ role: "user", content: "hello" }],
      }),
      {
        baseURL: "https://integrate.api.nvidia.com/v1",
        modelId: "z-ai/glm5",
        providerType: "openai",
        isThink: true,
      },
    );

    expect(JSON.parse(patchedBody)).toMatchObject({
      chat_template_kwargs: {
        enable_thinking: true,
        clear_thinking: false,
      },
    });
  });

  it("adds GLM chat_template_kwargs when disabling thinking on NVIDIA-compatible z-ai models", () => {
    const patchedBody = patchCompatibleThinkingRequestBody(
      JSON.stringify({
        model: "z-ai/glm5",
        stream: true,
        messages: [{ role: "user", content: "hello" }],
      }),
      {
        baseURL: "https://integrate.api.nvidia.com/v1",
        modelId: "z-ai/glm5",
        providerType: "openai",
        isThink: false,
      },
    );

    expect(JSON.parse(patchedBody)).toMatchObject({
      chat_template_kwargs: {
        enable_thinking: false,
      },
    });
  });

  it("rewrites compatible reasoning deltas into think-tagged text deltas", () => {
    const state = { inReasoning: false };

    const first = rewriteCompatibleReasoningSsePayload(
      JSON.stringify({
        id: "chatcmpl-1",
        choices: [{ index: 0, delta: { reasoning_content: "先判断时区" }, finish_reason: null }],
      }),
      state,
    );
    const second = rewriteCompatibleReasoningSsePayload(
      JSON.stringify({
        id: "chatcmpl-1",
        choices: [{ index: 0, delta: { content: "北京今天是 2026年3月21日" }, finish_reason: null }],
      }),
      state,
    );

    expect(first.map((payload) => JSON.parse(payload))).toEqual([
      {
        id: "chatcmpl-1",
        choices: [{ index: 0, delta: { content: "<think>先判断时区" }, finish_reason: null }],
      },
    ]);
    expect(second.map((payload) => JSON.parse(payload))).toEqual([
      {
        id: "chatcmpl-1",
        choices: [{ index: 0, delta: { content: "</think>北京今天是 2026年3月21日" }, finish_reason: null }],
      },
    ]);
  });

  it("closes an unfinished compatible reasoning block before the SSE done marker", () => {
    const state = { inReasoning: true };

    expect(rewriteCompatibleReasoningSsePayload("[DONE]", state)).toEqual([
      JSON.stringify({
        choices: [{ index: 0, delta: { content: "</think>" }, finish_reason: null }],
      }),
      "[DONE]",
    ]);
    expect(state.inReasoning).toBe(false);
  });
});
