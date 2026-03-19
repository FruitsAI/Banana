import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntimeToolMap } from "@/services/chat/mcp-tools";
import {
  buildChatRequestBody,
  createChatRuntime,
  type RuntimeTransportMessage,
} from "@/services/chat/runtime";

const {
  mockListMcpTools,
  mockCallMcpTool,
  mockFetch,
  mockDefaultChatTransport,
  mockReadUIMessageStream,
} = vi.hoisted(() => ({
  mockListMcpTools: vi.fn(),
  mockCallMcpTool: vi.fn(),
  mockFetch: vi.fn(),
  mockDefaultChatTransport: vi.fn(),
  mockReadUIMessageStream: vi.fn(),
}));

vi.mock("@/services/mcp", () => ({
  listMcpTools: mockListMcpTools,
  callMcpTool: mockCallMcpTool,
}));

vi.mock("ai", () => ({
  DefaultChatTransport: mockDefaultChatTransport,
  readUIMessageStream: mockReadUIMessageStream,
}));

const sampleMessages: RuntimeTransportMessage[] = [
  {
    id: "msg-user-1",
    role: "user",
    parts: [{ type: "text", text: "hello banana" }],
    metadata: {
      threadId: "thread-1",
      modelId: "gpt-4o-mini",
      providerId: "openai",
      searchEnabled: true,
      thinkEnabled: false,
    },
  },
];

describe("chat runtime tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockListMcpTools.mockResolvedValue({
      tools: [
        {
          name: "get_current_time",
          description: "Return the current local time",
          inputSchema: {
            type: "object",
            properties: {
              timezone: { type: "string" },
            },
            required: ["timezone"],
          },
        },
      ],
    });
  });

  it("maps enabled MCP tools into executable chat tools", async () => {
    const tools = await createRuntimeToolMap([
      {
        id: "server-1",
        command: "clock",
        is_enabled: true,
      },
    ]);

    expect(typeof tools.get_current_time.execute).toBe("function");
  });

  it("normalizes successful MCP tool execution", async () => {
    mockCallMcpTool.mockResolvedValueOnce({ now: "2026-03-20 00:00:00" });

    const tools = await createRuntimeToolMap([
      {
        id: "server-1",
        command: "clock",
        is_enabled: true,
      },
    ]);

    await expect(
      tools.get_current_time.execute?.({ timezone: "Asia/Shanghai" }),
    ).resolves.toEqual({
      ok: true,
      data: { now: "2026-03-20 00:00:00" },
    });
  });

  it("normalizes MCP tool execution failures", async () => {
    mockCallMcpTool.mockRejectedValueOnce(new Error("tool exploded"));

    const tools = await createRuntimeToolMap([
      {
        id: "server-1",
        command: "clock",
        is_enabled: true,
      },
    ]);

    await expect(
      tools.get_current_time.execute?.({ timezone: "Asia/Shanghai" }),
    ).resolves.toEqual({
      ok: false,
      error: {
        category: "tool-error",
        message: "tool exploded",
      },
    });
  });

  it("surfaces MCP discovery failures through an optional callback", async () => {
    const onDiscoveryError = vi.fn();
    mockListMcpTools.mockRejectedValueOnce(new Error("discovery failed"));

    const tools = await createRuntimeToolMap(
      [
        {
          id: "server-1",
          command: "clock",
          is_enabled: true,
        },
      ],
      { onDiscoveryError },
    );

    expect(tools).toEqual({});
    expect(onDiscoveryError).toHaveBeenCalledWith({
      serverId: "server-1",
      error: expect.any(Error),
    });
  });
});

describe("chat runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDefaultChatTransport.mockImplementation(function () {
      return {
        sendMessages: vi.fn(async () => new ReadableStream()),
      };
    });
    mockReadUIMessageStream.mockImplementation(async function* () {});
  });

  it("builds the /api/chat request body from canonical messages and runtime options", () => {
    const body = buildChatRequestBody({
      messages: sampleMessages,
      apiKey: "test-key",
      baseURL: "https://api.openai.com/v1",
      modelId: "gpt-4o-mini",
      providerType: "openai",
      isSearch: true,
      isThink: false,
      tools: [
        {
          name: "get_current_time",
          description: "Return the current local time",
          inputSchema: { type: "object" },
        },
      ],
    });

    expect(body).toEqual({
      messages: sampleMessages,
      apiKey: "test-key",
      baseURL: "https://api.openai.com/v1",
      modelId: "gpt-4o-mini",
      providerType: "openai",
      isSearch: true,
      isThink: false,
      tools: [
        {
          name: "get_current_time",
          description: "Return the current local time",
          inputSchema: { type: "object" },
        },
      ],
    });
  });

  it("streams assistant message updates through onMessagesUpdate", async () => {
    const streamedAssistantStates: RuntimeTransportMessage[] = [
      {
        id: "msg-assistant-1",
        role: "assistant",
        parts: [{ type: "text", text: "Hel" }],
      },
      {
        id: "msg-assistant-1",
        role: "assistant",
        parts: [{ type: "text", text: "Hello banana" }],
      },
    ];

    mockReadUIMessageStream.mockImplementation(async function* () {
      for (const message of streamedAssistantStates) {
        yield message;
      }
    });

    const onMessagesUpdate = vi.fn();
    const onStatusChange = vi.fn();
    const onError = vi.fn();
    const runtime = createChatRuntime({
      onMessagesUpdate,
      onStatusChange,
      onError,
      fetchImpl: mockFetch,
    });

    const messages = await runtime.send({
      messages: sampleMessages,
      apiKey: "test-key",
      modelId: "gpt-4o-mini",
    });

    expect(messages).toEqual([...sampleMessages, streamedAssistantStates[1]]);
    expect(onMessagesUpdate).toHaveBeenNthCalledWith(1, [...sampleMessages, streamedAssistantStates[0]]);
    expect(onMessagesUpdate).toHaveBeenNthCalledWith(2, [...sampleMessages, streamedAssistantStates[1]]);
    expect(onStatusChange).toHaveBeenNthCalledWith(1, "submitting");
    expect(onStatusChange).toHaveBeenNthCalledWith(2, "streaming");
    expect(onStatusChange).toHaveBeenNthCalledWith(3, "ready");
    expect(onError).not.toHaveBeenCalled();
    expect(mockDefaultChatTransport).toHaveBeenCalledTimes(1);
    expect(mockReadUIMessageStream).toHaveBeenCalledTimes(1);
  });

  it("uses the request builder through DefaultChatTransport prepareSendMessagesRequest", async () => {
    let prepareSendMessagesRequest:
      | ((options: {
          id: string;
          messages: RuntimeTransportMessage[];
          requestMetadata: unknown;
          body: Record<string, unknown> | undefined;
          credentials: RequestCredentials | undefined;
          headers: HeadersInit | undefined;
          api: string;
          trigger: "submit-message" | "regenerate-message";
          messageId: string | undefined;
        }) => { body: object; headers?: HeadersInit; credentials?: RequestCredentials; api?: string })
      | undefined;

    mockDefaultChatTransport.mockImplementation(function (
      options: { prepareSendMessagesRequest?: typeof prepareSendMessagesRequest },
    ) {
      prepareSendMessagesRequest = options.prepareSendMessagesRequest;
      return {
        sendMessages: vi.fn(async () => new ReadableStream()),
      };
    });

    const runtime = createChatRuntime({
      onMessagesUpdate: vi.fn(),
      onStatusChange: vi.fn(),
      onError: vi.fn(),
      fetchImpl: mockFetch,
    });

    await runtime.send({
      messages: sampleMessages,
      apiKey: "test-key",
      modelId: "gpt-4o-mini",
      isSearch: true,
    });

    expect(prepareSendMessagesRequest).toBeTypeOf("function");
    expect(
      prepareSendMessagesRequest?.({
        id: "thread-1",
        messages: sampleMessages,
        requestMetadata: undefined,
        body: {
          messages: sampleMessages,
          apiKey: "test-key",
          modelId: "gpt-4o-mini",
          isSearch: true,
        },
        credentials: undefined,
        headers: undefined,
        api: "/api/chat",
        trigger: "submit-message",
        messageId: "msg-user-1",
      }),
    ).toEqual({
      body: {
        messages: sampleMessages,
        apiKey: "test-key",
        baseURL: undefined,
        modelId: "gpt-4o-mini",
        providerType: undefined,
        isSearch: true,
        isThink: undefined,
        tools: undefined,
        trigger: "submit-message",
        messageId: "msg-user-1",
      },
      headers: { "Content-Type": "application/json" },
      credentials: undefined,
      api: "/api/chat",
    });
  });

  it("notifies callbacks around a failed turn request", async () => {
    const streamError = new Error("stream failed");
    mockReadUIMessageStream.mockImplementation(async function* () {
      throw streamError;
    });

    const onMessagesUpdate = vi.fn();
    const onStatusChange = vi.fn();
    const onError = vi.fn();
    const runtime = createChatRuntime({
      onMessagesUpdate,
      onStatusChange,
      onError,
      fetchImpl: mockFetch,
    });

    await expect(
      runtime.send({
        messages: sampleMessages,
        apiKey: "test-key",
        modelId: "gpt-4o-mini",
      }),
    ).rejects.toThrow("stream failed");

    expect(onMessagesUpdate).not.toHaveBeenCalled();
    expect(onStatusChange).toHaveBeenNthCalledWith(1, "submitting");
    expect(onStatusChange).toHaveBeenNthCalledWith(2, "streaming");
    expect(onStatusChange).toHaveBeenNthCalledWith(3, "error");
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("reports transport request failures through onError", async () => {
    const transportError = new Error("route failed");
    mockDefaultChatTransport.mockImplementation(function () {
      return {
        sendMessages: vi.fn(async () => {
          throw transportError;
        }),
      };
    });

    const onMessagesUpdate = vi.fn();
    const onStatusChange = vi.fn();
    const onError = vi.fn();
    const runtime = createChatRuntime({
      onMessagesUpdate,
      onStatusChange,
      onError,
      fetchImpl: mockFetch,
    });

    await expect(
      runtime.send({
        messages: sampleMessages,
        apiKey: "test-key",
        modelId: "gpt-4o-mini",
      }),
    ).rejects.toThrow("route failed");

    expect(onMessagesUpdate).not.toHaveBeenCalled();
    expect(onStatusChange).toHaveBeenNthCalledWith(1, "submitting");
    expect(onStatusChange).toHaveBeenNthCalledWith(2, "error");
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("keeps the request body builder stable", () => {
    const body = buildChatRequestBody({
      messages: sampleMessages,
      apiKey: "test-key",
      baseURL: "https://api.openai.com/v1",
      modelId: "gpt-4o-mini",
      providerType: "openai",
      isSearch: true,
      isThink: false,
      tools: [
        {
          name: "get_current_time",
          description: "Return the current local time",
          inputSchema: { type: "object" },
        },
      ],
    });

    expect(body).toEqual({
      messages: sampleMessages,
      apiKey: "test-key",
      baseURL: "https://api.openai.com/v1",
      modelId: "gpt-4o-mini",
      providerType: "openai",
      isSearch: true,
      isThink: false,
      tools: [
        {
          name: "get_current_time",
          description: "Return the current local time",
          inputSchema: { type: "object" },
        },
      ],
    });
  });
});
