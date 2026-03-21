import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/test-connection/route";

const { mockGenerateText, mockCreateOpenAI } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
  mockCreateOpenAI: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    generateText: mockGenerateText,
  };
});

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: mockCreateOpenAI,
}));

describe("POST /api/test-connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const openaiProvider = Object.assign(
      vi.fn((modelId: string) => ({ kind: "responses", modelId })),
      {
        chat: vi.fn((modelId: string) => ({ kind: "chat", modelId })),
      },
    );

    mockCreateOpenAI.mockReturnValue(openaiProvider);
    mockGenerateText.mockResolvedValue({
      text: "pong",
    });
  });

  it("does not use the openai-compatible client for anthropic providers", async () => {
    const request = new Request("http://localhost/api/test-connection", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "anthropic-key",
        baseURL: "https://api.anthropic.com/v1",
        modelId: "claude-3-5-sonnet",
        providerType: "anthropic",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockCreateOpenAI).not.toHaveBeenCalled();
  });

  it("uses a minimal token budget and timeout-aware abort signal for connection probes", async () => {
    const request = new Request("http://localhost/api/test-connection", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "openai-key",
        baseURL: "https://api.openai.com/v1",
        modelId: "gpt-4o-mini",
        providerType: "openai",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        maxOutputTokens: 1,
        abortSignal: expect.any(AbortSignal),
      }),
    );
  });

  it("returns a timeout-specific message when the probe exceeds its budget", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("Probe timed out after 5000ms"));

    const request = new Request("http://localhost/api/test-connection", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "openai-key",
        baseURL: "https://api.openai.com/v1",
        modelId: "gpt-4o-mini",
        providerType: "openai",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("连接超时: 模型平台未在限定时间内响应，请检查 API 地址、网络或代理设置。");
  });
});
