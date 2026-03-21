import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { summarizeMessageReasoning, summarizeMessageText } from "@/domain/chat/ui-message";
import type {
  BananaUIMessage,
  ChatMessage,
  ChatMessageSegment,
  ToolInvocation,
} from "@/domain/chat/types";
import { useChatSession } from "@/stores/chat/useChatSession";

interface BananaChatOptions {
  isSearch?: boolean;
  isThink?: boolean;
}

type StageMessage = ChatMessage | Omit<ChatMessage, "id">;
type MessagePart = BananaUIMessage["parts"][number];

interface DynamicToolPart extends Record<string, unknown> {
  type: "dynamic-tool";
  toolCallId: string;
  toolName: string;
  state: "input-available" | "output-available";
  input?: unknown;
  output?: unknown;
}

interface StaticToolPart extends Record<string, unknown> {
  type: `tool-${string}`;
  toolCallId: string;
  state: "input-available" | "output-available";
  input?: unknown;
  output?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStaticToolName(type: string): string | null {
  if (!type.startsWith("tool-")) {
    return null;
  }

  const toolName = type.slice(5);
  return toolName.length > 0 ? toolName : null;
}

function isDynamicToolPart(part: MessagePart): part is DynamicToolPart {
  const candidate = part as unknown as Record<string, unknown>;
  return (
    isObject(part) &&
    candidate.type === "dynamic-tool" &&
    typeof candidate.toolCallId === "string" &&
    typeof candidate.toolName === "string" &&
    (candidate.state === "input-available" || candidate.state === "output-available")
  );
}

function isStaticToolPart(part: MessagePart): part is StaticToolPart {
  const candidate = part as unknown as Record<string, unknown>;
  return (
    isObject(part) &&
    typeof candidate.type === "string" &&
    getStaticToolName(candidate.type) !== null &&
    typeof candidate.toolCallId === "string" &&
    (candidate.state === "input-available" || candidate.state === "output-available")
  );
}

function isToolPart(part: MessagePart): part is DynamicToolPart | StaticToolPart {
  return isDynamicToolPart(part) || isStaticToolPart(part);
}

function getToolPartName(part: DynamicToolPart | StaticToolPart): string {
  if (part.type === "dynamic-tool") {
    return part.toolName;
  }

  return getStaticToolName(part.type) ?? "";
}

function toToolInvocation(part: DynamicToolPart | StaticToolPart): ToolInvocation {
  return {
    state: part.state === "output-available" ? "result" : "call",
    toolCallId: part.toolCallId,
    toolName: getToolPartName(part),
    args: isObject(part.input) ? part.input : {},
    result: part.output,
  };
}

function isTextPart(part: MessagePart): part is Extract<MessagePart, { type: "text"; text: string }> {
  return isObject(part) && part.type === "text" && typeof (part as { text?: unknown }).text === "string";
}

function isReasoningPart(part: MessagePart): part is Extract<MessagePart, { type: "reasoning"; text: string }> {
  return isObject(part) && part.type === "reasoning" && typeof (part as { text?: unknown }).text === "string";
}

const THINK_PATTERNS = [
  { end: "</think>", start: "<think>" },
  { end: "</思考>", start: "<思考>" },
] as const;

function pushContentSegment(segments: ChatMessageSegment[], content: string): void {
  const normalized = content.trim();
  if (!normalized) {
    return;
  }

  segments.push({
    type: "content",
    content: normalized,
  });
}

function pushReasoningSegment(
  segments: ChatMessageSegment[],
  content: string,
  isStreaming = false,
): void {
  const normalized = content.trim();
  if (!normalized) {
    return;
  }

  segments.push({
    type: "reasoning",
    content: normalized,
    ...(isStreaming ? { isStreaming: true } : {}),
  });
}

function toOrderedTextSegments(text: string): ChatMessageSegment[] {
  const segments: ChatMessageSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const nextMatch = THINK_PATTERNS
      .map((pattern) => ({
        ...pattern,
        index: text.indexOf(pattern.start, cursor),
      }))
      .filter((candidate) => candidate.index !== -1)
      .sort((left, right) => left.index - right.index)[0];

    if (!nextMatch) {
      pushContentSegment(segments, text.slice(cursor));
      break;
    }

    pushContentSegment(segments, text.slice(cursor, nextMatch.index));

    const thoughtStart = nextMatch.index + nextMatch.start.length;
    const thoughtEnd = text.indexOf(nextMatch.end, thoughtStart);

    if (thoughtEnd === -1) {
      pushReasoningSegment(segments, text.slice(thoughtStart), true);
      break;
    }

    pushReasoningSegment(segments, text.slice(thoughtStart, thoughtEnd));
    cursor = thoughtEnd + nextMatch.end.length;
  }

  return segments;
}

function toOrderedSegments(message: BananaUIMessage): ChatMessageSegment[] {
  const segments: ChatMessageSegment[] = [];

  message.parts.forEach((part) => {
    if (isReasoningPart(part)) {
      pushReasoningSegment(segments, part.text);
      return;
    }

    if (isTextPart(part)) {
      segments.push(...toOrderedTextSegments(part.text));
      return;
    }

    if (isToolPart(part)) {
      segments.push({
        type: "tool",
        toolInvocation: toToolInvocation(part),
      });
    }
  });

  return segments;
}

function summarizeSegmentContent(segments: ChatMessageSegment[]): string {
  return segments
    .filter((segment): segment is Extract<ChatMessageSegment, { type: "content" }> => segment.type === "content")
    .map((segment) => segment.content.trim())
    .filter((segment) => segment.length > 0)
    .join("\n\n");
}

function summarizeSegmentReasoning(segments: ChatMessageSegment[]): string | undefined {
  const reasoning = segments
    .filter((segment): segment is Extract<ChatMessageSegment, { type: "reasoning" }> => segment.type === "reasoning")
    .map((segment) => segment.content.trim())
    .filter((segment) => segment.length > 0)
    .join("\n\n")
    .trim();

  return reasoning.length > 0 ? reasoning : undefined;
}

function summarizeSegmentTools(segments: ChatMessageSegment[]): ToolInvocation[] {
  return segments
    .filter((segment): segment is Extract<ChatMessageSegment, { type: "tool" }> => segment.type === "tool")
    .map((segment) => segment.toolInvocation);
}

function toStageMessage(message: BananaUIMessage): ChatMessage | null {
  if (message.role === "tool") {
    return null;
  }

  const segments = message.role === "assistant" ? toOrderedSegments(message) : undefined;
  const toolInvocations = segments ? summarizeSegmentTools(segments) : [];
  const content = segments ? summarizeSegmentContent(segments) : summarizeMessageText(message);
  const reasoning = segments ? summarizeSegmentReasoning(segments) : summarizeMessageReasoning(message);

  return {
    id: message.id,
    role: message.role,
    content,
    ...(reasoning ? { reasoning } : {}),
    modelId: message.metadata?.modelId,
    providerId: message.metadata?.providerId,
    createdAt: message.metadata?.createdAt,
    ...(segments && segments.length > 0 ? { segments } : {}),
    ...(toolInvocations.length > 0 ? { toolInvocations } : {}),
  };
}

function mergeAssistantMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.reduce<ChatMessage[]>((items, message) => {
    const previous = items.at(-1);

    if (!previous || previous.role !== "assistant" || message.role !== "assistant") {
      items.push(message);
      return items;
    }

    const mergedSegments = [
      ...(previous.segments ?? []),
      ...(message.segments ?? []),
    ];
    const mergedToolInvocations = [
      ...(previous.toolInvocations ?? []),
      ...(message.toolInvocations ?? []),
    ];
    const mergedContent = [previous.content, message.content]
      .map((content) => content.trim())
      .filter((content) => content.length > 0)
      .join("\n\n");
    const mergedReasoning = [previous.reasoning, message.reasoning]
      .map((reasoning) => reasoning?.trim())
      .filter((reasoning): reasoning is string => Boolean(reasoning))
      .join("\n\n");

    items[items.length - 1] = {
      ...previous,
      content: mergedContent,
      ...(mergedReasoning.length > 0 ? { reasoning: mergedReasoning } : {}),
      modelId: previous.modelId ?? message.modelId,
      providerId: previous.providerId ?? message.providerId,
      createdAt: previous.createdAt ?? message.createdAt,
      ...(mergedSegments.length > 0 ? { segments: mergedSegments } : {}),
      ...(mergedToolInvocations.length > 0 ? { toolInvocations: mergedToolInvocations } : {}),
    };
    return items;
  }, []);
}

function isUserStageMessage(message: StageMessage): message is StageMessage & { role: "user"; content: string } {
  return message.role === "user" && typeof message.content === "string";
}

function resolveActiveThreadId(threadId: string): string {
  if (threadId !== "default-thread" || typeof window === "undefined") {
    return threadId;
  }

  return new URL(window.location.href).searchParams.get("thread") ?? "default-thread";
}

export function useBananaChat(threadId: string) {
  const [, forceThreadSync] = useState(0);
  const activeThreadId = resolveActiveThreadId(threadId);

  const session = useChatSession(activeThreadId);
  const sessionRef = useRef(session);

  useLayoutEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const messages = mergeAssistantMessages(
    session.messages
    .map(toStageMessage)
    .filter((message): message is ChatMessage => message !== null),
  );
  const isLoading =
    session.status === "submitting" ||
    session.status === "streaming" ||
    session.status === "tool-running";
  const error = session.error ?? null;

  const promoteDefaultThread = useCallback((): string => {
    const nextThreadId = uuidv4();

    flushSync(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("thread", nextThreadId);
      window.history.replaceState(null, "", url.toString());
      forceThreadSync((value) => value + 1);
    });

    return nextThreadId;
  }, []);

  const append = useCallback(
    async (message: StageMessage, options?: BananaChatOptions): Promise<boolean> => {
      if (!isUserStageMessage(message)) {
        return false;
      }

      const content = message.content.trim();
      if (!content) {
        return false;
      }

      if (activeThreadId === "default-thread") {
        promoteDefaultThread();
      }

      return await sessionRef.current.sendMessage(content, options);
    },
    [activeThreadId, promoteDefaultThread],
  );

  const loadMessages = useCallback(async (): Promise<void> => {
    await session.loadThread(activeThreadId);
  }, [activeThreadId, session]);

  const reload = useCallback((): void => {
    void loadMessages();
  }, [loadMessages]);

  const updateMessageContent = useCallback(
    async (id: string, content: string, options?: BananaChatOptions): Promise<void> => {
      await sessionRef.current.editUserMessage(id, content, options);
    },
    [],
  );

  const regenerate = useCallback(
    async (messageId: string, options?: BananaChatOptions): Promise<void> => {
      const targetMessage = sessionRef.current.messages.find((message) => message.id === messageId);
      if (!targetMessage) {
        return;
      }

      if (targetMessage.role === "assistant") {
        await sessionRef.current.regenerate(messageId, options);
        return;
      }

      if (targetMessage.role === "user") {
        await sessionRef.current.editUserMessage(
          messageId,
          summarizeMessageText(targetMessage),
          options,
        );
      }
    },
    [],
  );

  return {
    messages,
    isLoading,
    error,
    append,
    reload,
    loadMessages,
    regenerate,
    updateMessageContent,
    retry: session.retry,
    stop: session.stop,
  };
}
