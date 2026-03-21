import { DefaultChatTransport, readUIMessageStream, type UIMessage } from "ai";
import type { BananaUIMessage } from "@/domain/chat/types";
import { summarizeMessageText } from "@/domain/chat/ui-message";

const DEFAULT_THREAD_TITLE = "新会话";
const MAX_THREAD_TITLE_LENGTH = 33;
const MAX_TRANSCRIPT_CHARS = 1200;
const GENERIC_TITLE_LABELS = new Set(["title", "标题", "对话标题", "会话标题"]);

const TITLE_SYSTEM_PROMPT =
  "你是一个会话标题生成器。请根据对话内容生成一个简洁准确的标题。要求：1. 标题控制在10字以内，必要时可略长但保持简短。2. 不要使用标点、引号、书名号或多余说明。3. 只输出标题本身。";

const TITLE_USER_PROMPT_PREFIX = "请为这段对话生成标题：\n\n";

interface GenerateConversationTitleOptions {
  apiKey: string;
  baseURL?: string;
  fetchImpl?: typeof fetch;
  messages: BananaUIMessage[];
  modelId: string;
  providerType?: string;
}

export type GeneratedTitleReason =
  | "ok"
  | "empty-stream"
  | "invalid-title"
  | "http-error"
  | "network-error";

export interface GeneratedTitleResult {
  title: string | null;
  source: "ai" | "fallback" | "none";
  reason?: GeneratedTitleReason;
}

interface TitleChatRequestBody {
  apiKey: string;
  baseURL?: string;
  isSearch: false;
  isThink: false;
  modelId: string;
  providerType?: string;
  tools: [];
}

function normalizeInlineWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripGenericTitlePrefix(value: string): string {
  return normalizeInlineWhitespace(
    value.replace(/^(?:title|标题|对话标题|会话标题)\s*[:：]\s*/iu, ""),
  );
}

function isGenericTitleLabel(value: string): boolean {
  return GENERIC_TITLE_LABELS.has(value.trim().toLowerCase());
}

export function deriveFallbackThreadTitle(messages: BananaUIMessage[]): string | null {
  const firstUserText = messages
    .filter((message) => message.role === "user")
    .map((message) => summarizeMessageText(message))
    .map(normalizeInlineWhitespace)
    .find((value) => value.length > 0);

  if (!firstUserText) {
    return null;
  }

  if (firstUserText.length <= MAX_THREAD_TITLE_LENGTH) {
    return firstUserText;
  }

  return `${firstUserText.slice(0, MAX_THREAD_TITLE_LENGTH - 3).trimEnd()}...`;
}

export function sanitizeGeneratedThreadTitle(value: string): string | null {
  const normalized = value
    .replace(/<think>[\s\S]*?<\/think>/gi, " ")
    .replace(/[#*`]/g, " ")
    .replace(/[“”"'‘’「」『』《》<>]/g, " ")
    .split(/\r?\n/u)
    .map(normalizeInlineWhitespace)
    .map(stripGenericTitlePrefix)
    .find((line) => line.length > 0 && !isGenericTitleLabel(line)) ?? "";

  if (!normalized || normalized === DEFAULT_THREAD_TITLE) {
    return null;
  }

  if (normalized.length <= MAX_THREAD_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_THREAD_TITLE_LENGTH - 3).trimEnd()}...`;
}

function buildConversationTranscript(messages: BananaUIMessage[]): string {
  const transcript = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => {
      const text = normalizeInlineWhitespace(summarizeMessageText(message));
      if (!text) {
        return null;
      }

      return `${message.role === "user" ? "用户" : "助手"}：${text}`;
    })
    .filter((line): line is string => typeof line === "string")
    .join("\n");

  if (transcript.length <= MAX_TRANSCRIPT_CHARS) {
    return transcript;
  }

  return transcript.slice(0, MAX_TRANSCRIPT_CHARS).trimEnd();
}

function createPromptMessages(transcript: string): UIMessage[] {
  return [
    {
      id: "thread-title-system",
      role: "system",
      parts: [{ type: "text", text: TITLE_SYSTEM_PROMPT }],
    },
    {
      id: "thread-title-user",
      role: "user",
      parts: [{ type: "text", text: `${TITLE_USER_PROMPT_PREFIX}${transcript}` }],
    },
  ];
}

function buildTitleRequestBody(
  options: GenerateConversationTitleOptions,
): TitleChatRequestBody {
  return {
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    modelId: options.modelId,
    providerType: options.providerType,
    isSearch: false,
    isThink: false,
    tools: [],
  };
}

function createTitleTransport(fetchImpl?: typeof fetch) {
  return new DefaultChatTransport<UIMessage>({
    api: "/api/chat",
    fetch: fetchImpl,
    prepareSendMessagesRequest({ api, body, messages, credentials, trigger, messageId }) {
      return {
        api,
        headers: { "Content-Type": "application/json" },
        credentials,
        body: {
          ...(body as TitleChatRequestBody),
          messages,
          trigger,
          messageId,
        },
      };
    },
  });
}

function classifyTitleTransportError(error: unknown): Exclude<GeneratedTitleReason, "ok" | "empty-stream" | "invalid-title"> {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("http") ||
      message.includes("status") ||
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("bad request") ||
      message.includes("not found") ||
      message.includes("internal server error") ||
      /\b[45]\d{2}\b/u.test(message)
    ) {
      return "http-error";
    }
  }

  return "network-error";
}

export async function generateConversationTitle(
  options: GenerateConversationTitleOptions,
): Promise<GeneratedTitleResult> {
  const transcript = buildConversationTranscript(options.messages);
  const fallbackTitle = deriveFallbackThreadTitle(options.messages);

  const toFallbackResult = (reason: Exclude<GeneratedTitleReason, "ok">): GeneratedTitleResult => {
    if (fallbackTitle) {
      return {
        title: fallbackTitle,
        source: "fallback",
        reason,
      };
    }

    return {
      title: null,
      source: "none",
      reason,
    };
  };

  if (!transcript) {
    return toFallbackResult("empty-stream");
  }

  const transport = createTitleTransport(options.fetchImpl ?? fetch);
  const promptMessages = createPromptMessages(transcript);
  const requestBody = buildTitleRequestBody(options);

  try {
    const stream = await transport.sendMessages({
      trigger: "submit-message",
      chatId: "thread-title",
      messageId: "thread-title-user",
      messages: promptMessages,
      abortSignal: undefined,
      body: requestBody,
    });

    let assistantMessage: UIMessage | null = null;
    for await (const message of readUIMessageStream({ stream })) {
      assistantMessage = message;
    }

    const generatedTitle = assistantMessage
      ? sanitizeGeneratedThreadTitle(summarizeMessageText(assistantMessage as BananaUIMessage))
      : null;

    if (generatedTitle) {
      return {
        title: generatedTitle,
        source: "ai",
        reason: "ok",
      };
    }

    return toFallbackResult(assistantMessage ? "invalid-title" : "empty-stream");
  } catch (error) {
    return toFallbackResult(classifyTitleTransportError(error));
  }
}
