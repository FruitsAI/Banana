type TextPart = {
  type: "text";
  text: string;
};

type MessagePart = TextPart | Record<string, unknown>;

type ChatRole = "user" | "assistant" | "system" | "tool";

export interface BananaMessageMetadata {
  threadId: string;
  modelId?: string;
  providerId?: string;
  createdAt?: string;
  searchEnabled?: boolean;
  thinkEnabled?: boolean;
}

export interface BananaUIMessage {
  id: string;
  role: ChatRole;
  parts: MessagePart[];
  metadata?: BananaMessageMetadata;
}

export interface StoredChatMessageRow {
  id: string;
  role: ChatRole;
  content?: string;
  ui_message_json?: string | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatRole(value: unknown): value is ChatRole {
  return value === "user" || value === "assistant" || value === "system" || value === "tool";
}

function toTextPartFromContent(content?: string): TextPart {
  return { type: "text", text: content ?? "" };
}

function coerceMetadata(value: unknown): BananaMessageMetadata | undefined {
  if (!isObject(value) || typeof value.threadId !== "string") {
    return undefined;
  }

  return {
    threadId: value.threadId,
    modelId: typeof value.modelId === "string" ? value.modelId : undefined,
    providerId: typeof value.providerId === "string" ? value.providerId : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
    searchEnabled: typeof value.searchEnabled === "boolean" ? value.searchEnabled : undefined,
    thinkEnabled: typeof value.thinkEnabled === "boolean" ? value.thinkEnabled : undefined,
  };
}

export function coerceStoredMessageToUIMessage(message: StoredChatMessageRow): BananaUIMessage {
  if (typeof message.ui_message_json === "string" && message.ui_message_json.trim().length > 0) {
    try {
      const parsed: unknown = JSON.parse(message.ui_message_json);

      if (isObject(parsed) && isChatRole(parsed.role) && Array.isArray(parsed.parts)) {
        return {
          id: typeof parsed.id === "string" ? parsed.id : message.id,
          role: parsed.role,
          parts: parsed.parts as MessagePart[],
          metadata: coerceMetadata(parsed.metadata),
        };
      }
    } catch {
      // Fall back to legacy row fields when serialized payload is invalid.
    }
  }

  return {
    id: message.id,
    role: message.role,
    parts: [toTextPartFromContent(message.content)],
  };
}

export function serializeUIMessage(message: BananaUIMessage): string {
  return JSON.stringify(message);
}

export function summarizeMessageText(message: BananaUIMessage): string {
  return message.parts
    .filter((part): part is TextPart => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}
