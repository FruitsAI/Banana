type TextPart = {
  type: "text";
  text: string;
};

type MessagePart = TextPart | Record<string, unknown>;

export type BananaUIMessage = {
  id: string;
  role: string;
  parts: MessagePart[];
};

type LegacyStoredMessage = {
  id: string;
  role: string;
  content?: string;
};

export function coerceStoredMessageToUIMessage(message: LegacyStoredMessage): BananaUIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content ?? "" }],
  };
}

export function summarizeMessageText(message: BananaUIMessage): string {
  return message.parts
    .filter((part): part is TextPart => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}
