import type { ChatMessage, ChatMessageSegment } from "@/domain/chat/types";

export function formatMessageTime(dateStr?: string): string {
  if (!dateStr) {
    return "";
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function isToolInvocationError(result: unknown): boolean {
  if (!result || typeof result !== "object") {
    return false;
  }

  const candidate = result as { error?: unknown; isError?: unknown };
  return candidate.isError === true || candidate.error !== undefined;
}

export function extractThoughtContent(content: string): {
  isThinking: boolean;
  mainContent: string;
  thought: string;
} {
  const thinkPatterns = [
    { start: "<think>", end: "</think>" },
    { start: "<思考>", end: "</思考>" },
  ] as const;

  const thoughts: string[] = [];
  const mainChunks: string[] = [];
  let cursor = 0;
  let isThinking = false;

  while (cursor < content.length) {
    const nextMatch = thinkPatterns
      .map((pattern) => ({
        ...pattern,
        index: content.indexOf(pattern.start, cursor),
      }))
      .filter((match) => match.index !== -1)
      .sort((left, right) => left.index - right.index)[0];

    if (!nextMatch) {
      mainChunks.push(content.slice(cursor));
      break;
    }

    mainChunks.push(content.slice(cursor, nextMatch.index));

    const thoughtStart = nextMatch.index + nextMatch.start.length;
    const thoughtEnd = content.indexOf(nextMatch.end, thoughtStart);

    if (thoughtEnd === -1) {
      const trailingThought = content.slice(thoughtStart).trim();
      if (trailingThought) {
        thoughts.push(trailingThought);
      }
      isThinking = true;
      cursor = content.length;
      break;
    }

    const thought = content.slice(thoughtStart, thoughtEnd).trim();
    if (thought) {
      thoughts.push(thought);
    }
    cursor = thoughtEnd + nextMatch.end.length;
  }

  return {
    thought: thoughts.join("\n\n").trim(),
    mainContent: mainChunks.join("").trim(),
    isThinking,
  };
}

export function buildCopyableMessageContent(message: ChatMessage): string {
  if (message.segments) {
    return message.segments
      .filter(
        (segment): segment is Extract<ChatMessageSegment, { type: "content" }> =>
          segment.type === "content",
      )
      .map((segment) => segment.content.trim())
      .filter((segment) => segment.length > 0)
      .join("\n\n");
  }

  const parsed = extractThoughtContent(message.content);
  return parsed.mainContent || parsed.thought || message.content;
}
