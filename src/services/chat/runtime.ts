import type { BananaChatStatus, BananaUIMessage } from "@/domain/chat/types";
import { AppError, getErrorMessage, normalizeError } from "@/shared/errors";
import type { RuntimeToolDescriptor } from "./mcp-tools";

export interface ChatRuntimeRequest {
  messages: BananaUIMessage[];
  apiKey: string;
  baseURL?: string;
  modelId: string;
  providerType?: string;
  isSearch?: boolean;
  isThink?: boolean;
  tools?: RuntimeToolDescriptor[];
}

export interface ChatRuntimeCallbacks {
  onMessagesUpdate(messages: BananaUIMessage[]): void;
  onStatusChange(status: BananaChatStatus): void;
  onError(error: Error): void;
}

export interface ChatRuntime {
  send(request: ChatRuntimeRequest): Promise<Response>;
}

type FetchLike = typeof fetch;

interface CreateChatRuntimeOptions extends ChatRuntimeCallbacks {
  fetchImpl?: FetchLike;
}

function wrapError(operation: string, error: unknown): AppError {
  return normalizeError(error, {
    domain: "chat",
    operation,
    code: "SERVICE_ERROR",
  });
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.clone().json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
  } catch {
    // Fall through to the default HTTP error message.
  }

  return `API 错误 ${response.status}`;
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
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async send(request: ChatRuntimeRequest): Promise<Response> {
      options.onMessagesUpdate(request.messages);
      options.onStatusChange("submitting");

      let response: Response;
      try {
        response = await fetchImpl("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildChatRequestBody(request)),
        });
      } catch (error) {
        const wrappedError = wrapError("createChatRuntime.send", error);
        options.onStatusChange("error");
        options.onError(wrappedError);
        throw wrappedError;
      }

      if (!response.ok) {
        const wrappedError = wrapError(
          "createChatRuntime.send",
          new Error(await readErrorMessage(response)),
        );
        options.onStatusChange("error");
        options.onError(wrappedError);
        throw wrappedError;
      }

      options.onStatusChange("streaming");
      return response;
    },
  };
}

export function createRuntimeError(message: string): AppError {
  return wrapError("createRuntimeError", new Error(message));
}

export function normalizeRuntimeError(error: unknown): Error {
  return error instanceof Error
    ? error
    : createRuntimeError(getErrorMessage(error));
}
