export interface Thread {
  id: string;
  title: string;
  model_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  model_id?: string;
  created_at: string;
}

export interface ToolInvocation {
  state: "call" | "result";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ChatReasoningSegment {
  content: string;
  isStreaming?: boolean;
  type: "reasoning";
}

export interface ChatContentSegment {
  content: string;
  type: "content";
}

export interface ChatToolSegment {
  toolInvocation: ToolInvocation;
  type: "tool";
}

export type ChatMessageSegment =
  | ChatReasoningSegment
  | ChatContentSegment
  | ChatToolSegment;

export interface ChatMessage {
  segments?: ChatMessageSegment[];
  toolInvocations?: ToolInvocation[];
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  reasoning?: string;
  modelId?: string;
  providerId?: string;
  createdAt?: string;
}

export type {
  BananaMessageMetadata,
  BananaUIMessage,
  StoredChatMessageRow,
} from "./ui-message";

export type {
  BananaChatStatus,
  ChatSessionEvent,
  ChatSessionState,
} from "./session";
