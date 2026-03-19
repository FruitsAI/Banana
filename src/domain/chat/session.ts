import type { BananaUIMessage } from "./ui-message";

export type BananaChatStatus =
  | "hydrating"
  | "ready"
  | "submitting"
  | "streaming"
  | "tool-running"
  | "error";

export type ChatSessionEvent =
  | {
      type: "SEND_MESSAGE";
      messageId: string;
    };

export interface ChatSessionState {
  activeThreadId: string;
  status: BananaChatStatus;
  messages: BananaUIMessage[];
  lastSubmittedMessageId?: string;
  error?: string;
}

export function createInitialChatSessionState(threadId: string): ChatSessionState {
  return {
    activeThreadId: threadId,
    status: "ready",
    messages: [],
  };
}

export function reduceChatSession(
  state: ChatSessionState,
  event: ChatSessionEvent,
): ChatSessionState {
  if (event.type === "SEND_MESSAGE") {
    return {
      ...state,
      status: "submitting",
      lastSubmittedMessageId: event.messageId,
      error: undefined,
    };
  }

  return state;
}
