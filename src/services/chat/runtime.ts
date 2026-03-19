import { DefaultChatTransport, readUIMessageStream, type UIMessage } from "ai";
import type { BananaChatStatus, BananaMessageMetadata } from "@/domain/chat/types";
import { AppError, normalizeError } from "@/shared/errors";
import type { RuntimeToolDescriptor } from "./mcp-tools";

export interface ChatRuntimeRequest {
  messages: RuntimeTransportMessage[];
  apiKey: string;
  baseURL?: string;
  modelId: string;
  providerType?: string;
  isSearch?: boolean;
  isThink?: boolean;
  tools?: RuntimeToolDescriptor[];
}

export interface ChatRuntimeCallbacks {
  onMessagesUpdate(messages: RuntimeTransportMessage[]): void;
  onStatusChange(status: BananaChatStatus): void;
  onError(error: Error): void;
}

export interface ChatRuntime {
  send(request: ChatRuntimeRequest): Promise<RuntimeTransportMessage[]>;
}

type FetchLike = typeof fetch;

interface CreateChatRuntimeOptions extends ChatRuntimeCallbacks {
  fetchImpl?: FetchLike;
}

export type RuntimeTransportMessage = UIMessage<Partial<BananaMessageMetadata>>;

function wrapError(operation: string, error: unknown): AppError {
  return normalizeError(error, {
    domain: "chat",
    operation,
    code: "SERVICE_ERROR",
  });
}

function getThreadId(message: RuntimeTransportMessage): string | undefined {
  const metadata = message.metadata;
  const threadId = metadata?.threadId;
  return typeof threadId === "string" && threadId.trim().length > 0 ? threadId : undefined;
}

function resolveChatId(messages: RuntimeTransportMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const threadId = getThreadId(messages[index]);
    if (threadId) {
      return threadId;
    }
  }

  return "default-thread";
}

function resolveMessageId(messages: RuntimeTransportMessage[]): string | undefined {
  return messages[messages.length - 1]?.id;
}

export function buildChatRequestBody(request: ChatRuntimeRequest) {
  return {
    messages: request.messages,
    apiKey: request.apiKey,
    baseURL: request.baseURL,
    modelId: request.modelId,
    providerType: request.providerType,
    isSearch: request.isSearch,
    isThink: request.isThink,
    tools: request.tools,
  };
}

export function createChatRuntime(options: CreateChatRuntimeOptions): ChatRuntime {
  const transport = new DefaultChatTransport<RuntimeTransportMessage>({
    api: "/api/chat",
    fetch: options.fetchImpl,
    prepareSendMessagesRequest({ api, body, messages, credentials, trigger, messageId }) {
      const request = buildChatRequestBody(body as ChatRuntimeRequest);

      return {
        api,
        headers: { "Content-Type": "application/json" },
        credentials,
        body: {
          ...request,
          messages,
          trigger,
          messageId,
        },
      };
    },
  });

  return {
    async send(request: ChatRuntimeRequest): Promise<RuntimeTransportMessage[]> {
      options.onStatusChange("submitting");

      let stream;
      try {
        stream = await transport.sendMessages({
          trigger: "submit-message",
          chatId: resolveChatId(request.messages),
          messageId: resolveMessageId(request.messages),
          messages: request.messages,
          abortSignal: undefined,
          body: request,
        });
      } catch (error) {
        const wrappedError = wrapError("createChatRuntime.send", error);
        options.onStatusChange("error");
        options.onError(wrappedError);
        throw wrappedError;
      }

      options.onStatusChange("streaming");
      let latestMessages = request.messages;

      try {
        for await (const assistantMessage of readUIMessageStream<RuntimeTransportMessage>({
          stream,
        })) {
          latestMessages = [...request.messages, assistantMessage];
          options.onMessagesUpdate(latestMessages);
        }
      } catch (error) {
        const wrappedError = wrapError("createChatRuntime.send", error);
        options.onStatusChange("error");
        options.onError(wrappedError);
        throw wrappedError;
      }

      options.onStatusChange("ready");
      return latestMessages;
    },
  };
}
