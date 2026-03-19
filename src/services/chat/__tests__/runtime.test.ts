import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BananaUIMessage } from "@/domain/chat/types";
import { createRuntimeToolMap } from "@/services/chat/mcp-tools";
import { buildChatRequestBody, createChatRuntime } from "@/services/chat/runtime";

const {
  mockListMcpTools,
  mockCallMcpTool,
  mockFetch,
} = vi.hoisted(() => ({
  mockListMcpTools: vi.fn(),
  mockCallMcpTool: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("@/services/mcp", () => ({
  listMcpTools: mockListMcpTools,
  callMcpTool: mockCallMcpTool,
}));

const sampleMessages: BananaUIMessage[] = [
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
});

describe("chat runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("notifies callbacks around a successful turn request", async () => {
    mockFetch.mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const onMessagesUpdate = vi.fn();
    const onStatusChange = vi.fn();
    const onError = vi.fn();
    const runtime = createChatRuntime({
      onMessagesUpdate,
      onStatusChange,
      onError,
      fetchImpl: mockFetch,
    });

    const response = await runtime.send({
      messages: sampleMessages,
      apiKey: "test-key",
      modelId: "gpt-4o-mini",
    });

    expect(response.status).toBe(200);
    expect(onMessagesUpdate).toHaveBeenCalledWith(sampleMessages);
    expect(onStatusChange).toHaveBeenNthCalledWith(1, "submitting");
    expect(onStatusChange).toHaveBeenNthCalledWith(2, "streaming");
    expect(onError).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("notifies callbacks around a failed turn request", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "route failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

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

    expect(onMessagesUpdate).toHaveBeenCalledWith(sampleMessages);
    expect(onStatusChange).toHaveBeenNthCalledWith(1, "submitting");
    expect(onStatusChange).toHaveBeenNthCalledWith(2, "error");
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
