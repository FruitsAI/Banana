import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/domain/chat/types";
import {
  buildCopyableMessageContent,
  extractThoughtContent,
  formatMessageTime,
  isToolInvocationError,
} from "@/components/layout/stage-message-utils";

describe("stage-message-utils", () => {
  it("returns an empty string for invalid message timestamps", () => {
    expect(formatMessageTime("not-a-real-date")).toBe("");
    expect(formatMessageTime(undefined)).toBe("");
  });

  it("detects tool invocation errors from explicit flags or error payloads", () => {
    expect(isToolInvocationError({ isError: true })).toBe(true);
    expect(isToolInvocationError({ error: "tool failed" })).toBe(true);
    expect(isToolInvocationError({ now: "2026-03-21 00:00:00" })).toBe(false);
    expect(isToolInvocationError(null)).toBe(false);
  });

  it("extracts multiple think blocks and preserves the visible answer", () => {
    expect(
      extractThoughtContent(
        "<think>先判断时区</think>\n\n<think>读取工具结果</think>\n\n纽约今天的日期是 2026年3月21日。",
      ),
    ).toEqual({
      thought: "先判断时区\n\n读取工具结果",
      mainContent: "纽约今天的日期是 2026年3月21日。",
      isThinking: false,
    });
  });

  it("treats an unclosed think block as streaming reasoning", () => {
    expect(extractThoughtContent("<think>还在思考")).toEqual({
      thought: "还在思考",
      mainContent: "",
      isThinking: true,
    });
  });

  it("builds copyable content from visible assistant segments before falling back to think parsing", () => {
    const segmentedMessage: ChatMessage = {
      id: "assistant-segmented",
      role: "assistant",
      content: "ignored",
      segments: [
        { type: "reasoning", content: "思考内容" },
        { type: "tool", toolInvocation: { state: "result", toolCallId: "t1", toolName: "clock", args: {}, result: {} } },
        { type: "content", content: "第一段答案" },
        { type: "content", content: "第二段答案" },
      ],
    };

    const legacyMessage: ChatMessage = {
      id: "assistant-legacy",
      role: "assistant",
      content: "<think>隐藏思考</think>\n\n最终答案",
    };

    expect(buildCopyableMessageContent(segmentedMessage)).toBe("第一段答案\n\n第二段答案");
    expect(buildCopyableMessageContent(legacyMessage)).toBe("最终答案");
  });
});
