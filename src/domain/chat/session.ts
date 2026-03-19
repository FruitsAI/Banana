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
      type: "HYDRATE_START";
      threadId: string;
    }
  | {
      type: "HYDRATE_SUCCESS";
      threadId: string;
      messages: BananaUIMessage[];
    }
  | {
      type: "SEND_MESSAGE";
      messageId: string;
      messages?: BananaUIMessage[];
    }
  | {
      type: "MESSAGES_UPDATED";
      messages: BananaUIMessage[];
    }
  | {
      type: "STATUS_CHANGED";
      status: BananaChatStatus;
    }
  | {
      type: "ERROR";
      error: string;
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
    status: "hydrating",
    messages: [],
  };
}

export function reduceChatSession(
  state: ChatSessionState,
  event: ChatSessionEvent,
): ChatSessionState {
  if (event.type === "HYDRATE_START") {
    return {
      ...state,
      activeThreadId: event.threadId,
      status: "hydrating",
      error: undefined,
    };
  }

  if (event.type === "HYDRATE_SUCCESS") {
    return {
      ...state,
      activeThreadId: event.threadId,
      status: "ready",
      messages: event.messages,
      error: undefined,
    };
  }

  if (event.type === "SEND_MESSAGE") {
    return {
      ...state,
      status: "submitting",
      messages: event.messages ?? state.messages,
      lastSubmittedMessageId: event.messageId,
      error: undefined,
    };
  }

  if (event.type === "MESSAGES_UPDATED") {
    return {
      ...state,
      messages: event.messages,
      error: undefined,
    };
  }

  if (event.type === "STATUS_CHANGED") {
    return {
      ...state,
      status: event.status,
      error: event.status === "error" ? state.error : undefined,
    };
  }

  if (event.type === "ERROR") {
    return {
      ...state,
      status: "error",
      error: event.error,
    };
  }

  return state;
}
