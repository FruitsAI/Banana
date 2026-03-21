import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BananaUIMessage } from "@/domain/chat/types";
import {
  deriveFallbackThreadTitle,
  generateConversationTitle,
  sanitizeGeneratedThreadTitle,
} from "@/services/chat/title";

const { mockReadUIMessageStream } = vi.hoisted(() => ({
  mockReadUIMessageStream: vi.fn(),
}));

const { mockDefaultChatTransport, mockSendMessages } = vi.hoisted(() => ({
  mockDefaultChatTransport: vi.fn(),
  mockSendMessages: vi.fn(),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: mockDefaultChatTransport,
  readUIMessageStream: mockReadUIMessageStream,
}));

function createMessage(role: "user" | "assistant", text: string): BananaUIMessage {
  return {
    id: `${role}-${text}`,
    role,
    parts: [{ type: "text", text }],
  };
}

describe("chat title service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDefaultChatTransport.mockImplementation(function () {
      return {
      sendMessages: mockSendMessages,
      };
    });
    mockSendMessages.mockResolvedValue(new ReadableStream());
  });

  it("uses the AI-generated title when the summary stream returns text", async () => {
    mockReadUIMessageStream.mockImplementation(async function* () {
      yield {
        id: "title-assistant",
        role: "assistant",
        parts: [{ type: "text", text: "北京日期" }],
      };
    });

    const fetchImpl = vi.fn();

    const titleResult = await generateConversationTitle({
      apiKey: "test-key",
      baseURL: "https://api.openai.com/v1",
      modelId: "gpt-4o-mini",
      providerType: "openai",
      messages: [
        createMessage("user", "北京今天日期"),
        createMessage("assistant", "今天是 2026年3月21日"),
      ],
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(titleResult).toEqual({
      title: "北京日期",
      source: "ai",
      reason: "ok",
    });
    expect(mockDefaultChatTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        api: "/api/chat",
        fetch: fetchImpl,
      }),
    );
    expect(mockSendMessages).toHaveBeenCalledTimes(1);
  });

  it("falls back to the first user message when title generation fails", async () => {
    mockSendMessages.mockRejectedValueOnce(new Error("HTTP 500"));

    const titleResult = await generateConversationTitle({
      apiKey: "test-key",
      modelId: "gpt-4o-mini",
      messages: [
        createMessage("user", "北京今天日期"),
        createMessage("assistant", "今天是 2026年3月21日"),
      ],
      fetchImpl: vi.fn() as typeof fetch,
    });

    expect(titleResult).toEqual({
      title: "北京今天日期",
      source: "fallback",
      reason: "http-error",
    });
  });

  it("marks fallback as invalid-title when AI output sanitizes to empty", async () => {
    mockReadUIMessageStream.mockImplementation(async function* () {
      yield {
        id: "title-assistant",
        role: "assistant",
        parts: [{ type: "text", text: "“新会话”" }],
      };
    });

    const titleResult = await generateConversationTitle({
      apiKey: "test-key",
      modelId: "gpt-4o-mini",
      messages: [
        createMessage("user", "北京今天日期"),
        createMessage("assistant", "今天是 2026年3月21日"),
      ],
      fetchImpl: vi.fn() as typeof fetch,
    });

    expect(titleResult).toEqual({
      title: "北京今天日期",
      source: "fallback",
      reason: "invalid-title",
    });
  });

  it("sanitizes generated titles and keeps them short", () => {
    expect(sanitizeGeneratedThreadTitle('“北京今天日期”')).toBe("北京今天日期");
    expect(
      sanitizeGeneratedThreadTitle(
        "<think>先思考一下</think>\n\n**9.11与9.9数值大小比较**",
      ),
    ).toBe("9.11与9.9数值大小比较");
    expect(
      sanitizeGeneratedThreadTitle(
        "<think>analyze</think>\n\n# 对话标题\n\n**小数比较：9.11和9.9哪个更大？**",
      ),
    ).toBe("小数比较：9.11和9.9哪个更大？");
    expect(
      deriveFallbackThreadTitle([createMessage("user", "第一行\n第二行第三行第四行第五行第六行第七行")]),
    ).toBe("第一行 第二行第三行第四行第五行第六行第七行");
  });
});
