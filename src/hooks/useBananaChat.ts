import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { summarizeMessageText } from "@/domain/chat/ui-message";
import type { BananaUIMessage, ChatMessage, ToolInvocation } from "@/domain/chat/types";
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function toToolInvocation(part: DynamicToolPart): ToolInvocation {
  return {
    state: part.state === "output-available" ? "result" : "call",
    toolCallId: part.toolCallId,
    toolName: part.toolName,
    args: isObject(part.input) ? part.input : {},
    result: part.output,
  };
}

function toStageMessage(message: BananaUIMessage): ChatMessage | null {
  if (message.role === "tool") {
    return null;
  }

  const toolInvocations = message.parts.reduce<ToolInvocation[]>((items, part) => {
    if (isDynamicToolPart(part)) {
      items.push(toToolInvocation(part));
    }

    return items;
  }, []);

  return {
    id: message.id,
    role: message.role,
    content: summarizeMessageText(message),
    modelId: message.metadata?.modelId,
    createdAt: message.metadata?.createdAt,
    ...(toolInvocations.length > 0 ? { toolInvocations } : {}),
  };
}

function isUserStageMessage(message: StageMessage): message is StageMessage & { role: "user"; content: string } {
  return message.role === "user" && typeof message.content === "string";
}

export function useBananaChat(threadId: string) {
  const [activeThreadId, setActiveThreadId] = useState(threadId);

  useEffect(() => {
    const resolvedThreadId =
      threadId === "default-thread"
        ? new URL(window.location.href).searchParams.get("thread") ?? "default-thread"
        : threadId;

    // Prefer the actual location so first-send promotion survives searchParams lag,
    // but real navigations back to the blank composer still reset correctly.
    setActiveThreadId((currentThreadId) =>
      currentThreadId === resolvedThreadId ? currentThreadId : resolvedThreadId,
    );
  }, [threadId]);

  const session = useChatSession(activeThreadId);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const messages = session.messages
    .map(toStageMessage)
    .filter((message): message is ChatMessage => message !== null);
  const isLoading =
    session.status === "submitting" ||
    session.status === "streaming" ||
    session.status === "tool-running";
  const error = session.error ?? null;

  const promoteDefaultThread = useCallback((): string => {
    const nextThreadId = uuidv4();

    flushSync(() => {
      setActiveThreadId(nextThreadId);
    });

    const url = new URL(window.location.href);
    url.searchParams.set("thread", nextThreadId);
    window.history.replaceState(null, "", url.toString());

    return nextThreadId;
  }, []);

  const append = useCallback(
    async (message: StageMessage, options?: BananaChatOptions): Promise<void> => {
      if (!isUserStageMessage(message)) {
        return;
      }

      const content = message.content.trim();
      if (!content) {
        return;
      }

      if (activeThreadId === "default-thread") {
        promoteDefaultThread();
      }

      await sessionRef.current.sendMessage(content, options);
    },
    [activeThreadId, promoteDefaultThread],
  );

  const loadMessages = useCallback(async (): Promise<void> => {
    await session.loadThread(activeThreadId);
  }, [activeThreadId, session]);

  const reload = useCallback((): void => {
    void loadMessages();
  }, [loadMessages]);

  const deleteMessage = useCallback(async (_id: string): Promise<void> => {
    // The current stage no longer deletes local messages directly.
  }, []);

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
    deleteMessage,
    regenerate,
    updateMessageContent,
    retry: session.retry,
    stop: session.stop,
  };
}
