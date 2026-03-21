import {
  createIdGenerator,
  convertToModelMessages,
  dynamicTool,
  extractReasoningMiddleware,
  jsonSchema,
  streamText,
  tool,
  validateUIMessages,
  wrapLanguageModel,
  type FlexibleSchema,
  type Tool,
  type UIMessage,
} from "ai";
import { createProviderLanguageModel } from "@/services/providers";

interface ClientToolDescriptor {
  name: string;
  description?: string;
  inputSchema: unknown;
}

interface ChatRequestBody {
  messages: unknown;
  apiKey?: string;
  baseURL?: string;
  modelId?: string;
  providerType?: string;
  isSearch?: boolean;
  isThink?: boolean;
  tools?: unknown;
}

type LegacyRole = "system" | "user" | "assistant" | "tool";

type ValidationToolMap = Record<string, Tool<unknown, unknown>>;
type StreamToolMap = Record<string, ReturnType<typeof tool>>;
type DynamicToolPart = Extract<UIMessage["parts"][number], { type: "dynamic-tool" }>;
type DynamicToolOutputPart = Extract<DynamicToolPart, { state: "output-available" }>;
const AI_SDK_SCHEMA_SYMBOL = Symbol.for("vercel.ai.schema");
const generateResponseMessageId = createIdGenerator({
  prefix: "banana-msg",
  size: 24,
});
const NVIDIA_COMPAT_BASE_URL_TOKEN = "integrate.api.nvidia.com";
const NVIDIA_REASONING_MODEL_PREFIXES = ["z-ai/", "moonshotai/"] as const;

interface CompatibleReasoningBridgeOptions {
  baseURL?: string;
  isThink?: boolean;
  modelId?: string;
  providerType?: string;
}

interface CompatibleReasoningRewriteState {
  inReasoning: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFlexibleSchemaLike(value: unknown): value is FlexibleSchema<unknown> {
  if (typeof value === "function") {
    return true;
  }

  if (!isObject(value)) {
    return false;
  }

  return AI_SDK_SCHEMA_SYMBOL in value || "~standard" in value;
}

function normalizeToolInputSchema(inputSchema: unknown): FlexibleSchema<unknown> {
  if (isFlexibleSchemaLike(inputSchema)) {
    return inputSchema;
  }

  if (isObject(inputSchema)) {
    return jsonSchema(inputSchema);
  }

  return jsonSchema({
    type: "object",
    properties: {},
    additionalProperties: false,
  });
}

function isLegacyRole(value: unknown): value is LegacyRole {
  return value === "system" || value === "user" || value === "assistant" || value === "tool";
}

function isClientToolDescriptor(value: unknown): value is ClientToolDescriptor {
  return isObject(value) && typeof value.name === "string" && "inputSchema" in value;
}

function isUIMessageLike(value: unknown): value is UIMessage {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    (value.role === "system" || value.role === "user" || value.role === "assistant") &&
    Array.isArray(value.parts)
  );
}

function isTextPart(value: unknown): value is { type: "text"; text: string } {
  return isObject(value) && value.type === "text" && typeof value.text === "string";
}

function isLegacyToolCallPart(value: unknown): value is {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args?: unknown;
  input?: unknown;
} {
  return (
    isObject(value) &&
    value.type === "tool-call" &&
    typeof value.toolCallId === "string" &&
    typeof value.toolName === "string"
  );
}

function isLegacyToolResultPart(value: unknown): value is {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  output: unknown;
} {
  return (
    isObject(value) &&
    value.type === "tool-result" &&
    typeof value.toolCallId === "string" &&
    typeof value.toolName === "string" &&
    "output" in value
  );
}

function isDynamicToolPart(value: unknown): value is DynamicToolPart {
  return (
    isObject(value) &&
    value.type === "dynamic-tool" &&
    typeof value.toolCallId === "string" &&
    typeof value.toolName === "string"
  );
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cloneJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function shouldUseCompatibleReasoningBridge(
  options: CompatibleReasoningBridgeOptions,
): boolean {
  const normalizedType = (options.providerType ?? "openai").trim().toLowerCase();
  const normalizedBaseURL = (options.baseURL ?? "").trim().toLowerCase();
  const normalizedModelId = (options.modelId ?? "").trim().toLowerCase();

  return (
    normalizedType === "openai" &&
    normalizedBaseURL.includes(NVIDIA_COMPAT_BASE_URL_TOKEN) &&
    NVIDIA_REASONING_MODEL_PREFIXES.some((prefix) => normalizedModelId.startsWith(prefix))
  );
}

export function patchCompatibleThinkingRequestBody(
  bodyText: string,
  options: CompatibleReasoningBridgeOptions,
): string {
  if (!shouldUseCompatibleReasoningBridge(options) || options.isThink === undefined) {
    return bodyText;
  }

  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (!isObjectRecord(parsed)) {
      return bodyText;
    }

    if ("thinking" in parsed) {
      return bodyText;
    }

    const normalizedModelId = (options.modelId ?? "").trim().toLowerCase();
    const glmThinkingControls = normalizedModelId.startsWith("z-ai/")
      ? {
          chat_template_kwargs: options.isThink
            ? {
                enable_thinking: true,
                clear_thinking: false,
              }
            : {
                enable_thinking: false,
              },
        }
      : {};

    return JSON.stringify({
      ...parsed,
      ...glmThinkingControls,
      thinking: {
        type: options.isThink ? "enabled" : "disabled",
      },
    });
  } catch {
    return bodyText;
  }
}

function createCompatibleTextDeltaPayload(
  template: Record<string, unknown>,
  content: string,
): string {
  const nextPayload = cloneJsonValue(template);
  const choices = Array.isArray(nextPayload.choices)
    ? nextPayload.choices as Array<Record<string, unknown>>
    : [];
  const firstChoice = choices[0];

  if (!firstChoice) {
    return JSON.stringify({
      choices: [{ index: 0, delta: { content }, finish_reason: null }],
    });
  }

  const nextChoice = firstChoice;
  const nextDelta = isObjectRecord(nextChoice.delta)
    ? cloneJsonValue(nextChoice.delta)
    : {};

  delete nextDelta.reasoning_content;
  nextDelta.content = content;

  nextChoice.delta = nextDelta;
  nextChoice.finish_reason = null;

  return JSON.stringify(nextPayload);
}

export function rewriteCompatibleReasoningSsePayload(
  payload: string,
  state: CompatibleReasoningRewriteState,
): string[] {
  if (payload === "[DONE]") {
    if (!state.inReasoning) {
      return [payload];
    }

    state.inReasoning = false;
    return [
      JSON.stringify({
        choices: [{ index: 0, delta: { content: "</think>" }, finish_reason: null }],
      }),
      payload,
    ];
  }

  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    const choices = Array.isArray(parsed.choices)
      ? parsed.choices as Array<Record<string, unknown>>
      : [];
    const firstChoice = choices[0];
    const delta = firstChoice && isObjectRecord(firstChoice.delta)
      ? firstChoice.delta
      : null;

    if (!delta) {
      return [payload];
    }

    const reasoningContent =
      typeof delta.reasoning_content === "string" ? delta.reasoning_content : "";
    const content = typeof delta.content === "string" ? delta.content : "";
    const rewrittenPayloads: string[] = [];

    if (reasoningContent.length > 0) {
      const prefix = state.inReasoning ? "" : "<think>";
      rewrittenPayloads.push(
        createCompatibleTextDeltaPayload(parsed, `${prefix}${reasoningContent}`),
      );
      state.inReasoning = true;
    }

    if (content.length > 0) {
      const prefix = state.inReasoning ? "</think>" : "";
      rewrittenPayloads.push(
        createCompatibleTextDeltaPayload(parsed, `${prefix}${content}`),
      );
      state.inReasoning = false;
    }

    if (rewrittenPayloads.length === 0) {
      return [payload];
    }

    return rewrittenPayloads;
  } catch {
    return [payload];
  }
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function isChatCompletionsRequest(url: string): boolean {
  try {
    return new URL(url).pathname.endsWith("/chat/completions");
  } catch {
    return url.includes("/chat/completions");
  }
}

function transformCompatibleReasoningResponse(response: Response): Response {
  if (!response.body) {
    return response;
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const state: CompatibleReasoningRewriteState = { inReasoning: false };
  let buffer = "";

  const transformedBody = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = response.body!.getReader();

      const flushLine = (rawLine: string) => {
        const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
        if (!line.startsWith("data: ")) {
          controller.enqueue(encoder.encode(`${line}\n`));
          return;
        }

        const payload = line.slice(6);
        const nextPayloads = rewriteCompatibleReasoningSsePayload(payload, state);
        for (const nextPayload of nextPayloads) {
          controller.enqueue(encoder.encode(`data: ${nextPayload}\n`));
        }
      };

      const pump = async (): Promise<void> => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.length > 0) {
              flushLine(buffer);
            }
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            flushLine(line);
            newlineIndex = buffer.indexOf("\n");
          }
        }
      };

      void pump().catch((error) => {
        controller.error(error);
      });
    },
  });

  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(transformedBody, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function createCompatibleReasoningFetch(
  options: CompatibleReasoningBridgeOptions & { fetchImpl: typeof fetch },
): typeof fetch {
  return async (input, init) => {
    const requestUrl = resolveRequestUrl(input);
    const nextInit = { ...init };

    if (isChatCompletionsRequest(requestUrl) && typeof nextInit.body === "string") {
      nextInit.body = patchCompatibleThinkingRequestBody(nextInit.body, options);
    }

    const response = await options.fetchImpl(input, nextInit);

    if (
      !isChatCompletionsRequest(requestUrl) ||
      !response.body ||
      !response.headers.get("content-type")?.includes("text/event-stream")
    ) {
      return response;
    }

    return transformCompatibleReasoningResponse(response);
  };
}

function buildSystemInstructions(options: {
  isSearch?: boolean;
  isThink?: boolean;
}): string {
  const now = new Date();
  const instructions: string[] = [
    "[IMPORTANT Context]",
    `Current local time: ${now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    "Local timezone: Asia/Shanghai",
    "",
    "[Tool Rules]",
    "Only use tools when the user asks for real-world, current, or external information, or when a tool is strictly necessary to complete the request.",
    "Do NOT use tools for pure reasoning, math, writing, translation, or summarization tasks that you can answer directly.",
    "If you use a tool that requires a timezone parameter, you MUST explicitly provide it as \"Asia/Shanghai\" unless the user asks for a different timezone. DO NOT leave required parameters empty.",
  ];

  if (options.isThink) {
    instructions.push(
      "",
      "[System Instruction: Deep Thinking is ENABLED. You MUST show your reasoning process inside <think> tags.]",
    );
  }

  if (options.isSearch) {
    instructions.push(
      "",
      "[System Instruction: Network Search is ENABLED. You MUST use internet search to verify facts and provide the most current information.]",
    );
  }

  return instructions.join("\n");
}

function toTextParts(content: unknown): UIMessage["parts"] {
  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }

  if (!Array.isArray(content)) {
    return [];
  }

  return content.filter(isTextPart);
}

function toAssistantParts(content: unknown): UIMessage["parts"] {
  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }

  if (!Array.isArray(content)) {
    return [];
  }

  const parts: UIMessage["parts"] = [];

  for (const item of content) {
    if (isTextPart(item)) {
      parts.push(item);
      continue;
    }

    if (isLegacyToolCallPart(item)) {
      parts.push({
        type: "dynamic-tool",
        toolCallId: item.toolCallId,
        toolName: item.toolName,
        state: "input-available",
        input: item.input ?? item.args ?? {},
      });
    }
  }

  return parts;
}

function mergeLegacyToolResults(
  normalizedMessages: UIMessage[],
  content: unknown,
): void {
  if (!Array.isArray(content)) {
    return;
  }

  const assistantIndex = [...normalizedMessages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.role === "assistant")?.index;

  if (assistantIndex === undefined) {
    return;
  }

  const assistantMessage = normalizedMessages[assistantIndex];
  const nextParts = [...assistantMessage.parts];

  for (const item of content) {
    if (!isLegacyToolResultPart(item)) {
      continue;
    }

    const existingIndex = nextParts.findIndex(
      (part) => isDynamicToolPart(part) && part.toolCallId === item.toolCallId,
    );

    if (existingIndex >= 0) {
      const existingPart = nextParts[existingIndex];
      const outputPart: DynamicToolOutputPart = {
        state: "output-available",
        type: "dynamic-tool",
        toolCallId: item.toolCallId,
        toolName: item.toolName,
        input: isDynamicToolPart(existingPart) ? (existingPart.input ?? {}) : {},
        output: item.output,
      };
      nextParts[existingIndex] = outputPart;
      continue;
    }

    const outputPart: DynamicToolOutputPart = {
      type: "dynamic-tool",
      toolCallId: item.toolCallId,
      toolName: item.toolName,
      state: "output-available",
      input: {},
      output: item.output,
    };
    nextParts.push(outputPart);
  }

  normalizedMessages[assistantIndex] = {
    ...assistantMessage,
    parts: nextParts,
  };
}

function normalizeIncomingMessages(messages: unknown): UIMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const normalizedMessages: UIMessage[] = [];
  let legacyMessageCount = 0;

  for (const candidate of messages) {
    if (isUIMessageLike(candidate)) {
      normalizedMessages.push(candidate);
      continue;
    }

    if (!isObject(candidate) || !isLegacyRole(candidate.role)) {
      continue;
    }

    if (candidate.role === "tool") {
      mergeLegacyToolResults(normalizedMessages, candidate.content);
      continue;
    }

    legacyMessageCount += 1;
    const id =
      typeof candidate.id === "string"
        ? candidate.id
        : `legacy-message-${legacyMessageCount}`;

    normalizedMessages.push({
      id,
      role: candidate.role,
      parts:
        candidate.role === "assistant"
          ? toAssistantParts(candidate.content)
          : toTextParts(candidate.content),
    });
  }

  return normalizedMessages;
}

function buildValidationTools(clientTools: unknown): ValidationToolMap {
  const runtimeTools: ValidationToolMap = {};

  if (!Array.isArray(clientTools)) {
    return runtimeTools;
  }

  for (const candidate of clientTools) {
    if (!isClientToolDescriptor(candidate)) {
      continue;
    }

    const descriptor = candidate;

    runtimeTools[descriptor.name] = dynamicTool({
      description: descriptor.description,
      inputSchema: normalizeToolInputSchema(descriptor.inputSchema),
      execute: async () => {
        throw new Error(
          `Client-side MCP tool "${descriptor.name}" cannot be executed on the server.`,
        );
      },
    });
  }

  return runtimeTools;
}

function buildStreamTools(clientTools: unknown): StreamToolMap {
  const runtimeTools: StreamToolMap = {};

  if (!Array.isArray(clientTools)) {
    return runtimeTools;
  }

  for (const candidate of clientTools) {
    if (!isClientToolDescriptor(candidate)) {
      continue;
    }

    const descriptor = candidate;

    runtimeTools[descriptor.name] = tool({
      description: descriptor.description,
      inputSchema: normalizeToolInputSchema(
        descriptor.inputSchema,
      ) as Parameters<typeof tool>[0]["inputSchema"],
    });
  }

  return runtimeTools;
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      apiKey,
      baseURL,
      modelId,
      providerType,
      isSearch,
      isThink,
      tools: clientTools,
    } = (await req.json()) as ChatRequestBody;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key 未提供" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resolvedType = providerType ?? "openai";
    const resolvedBaseURL = baseURL || "https://api.openai.com/v1";
    const resolvedModelId = modelId || "gpt-4o-mini";
    const compatibleReasoningBridgeEnabled = shouldUseCompatibleReasoningBridge({
      baseURL: resolvedBaseURL,
      modelId: resolvedModelId,
      providerType: resolvedType,
    });

    const baseModel = createProviderLanguageModel({
      apiKey,
      baseURL: resolvedBaseURL,
      fetchImpl: compatibleReasoningBridgeEnabled
        ? createCompatibleReasoningFetch({
            baseURL: resolvedBaseURL,
            fetchImpl: fetch,
            isThink,
            modelId: resolvedModelId,
            providerType: resolvedType,
          })
        : undefined,
      modelId: resolvedModelId,
      providerType: resolvedType,
    });
    const model = compatibleReasoningBridgeEnabled
      ? wrapLanguageModel({
          model: baseModel,
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        })
      : baseModel;

    const normalizedMessages = normalizeIncomingMessages(messages);
    const validationTools = buildValidationTools(clientTools);
    const streamTools = buildStreamTools(clientTools);
    const validatedMessages = await validateUIMessages<UIMessage>({
      messages: normalizedMessages,
      tools: validationTools,
    });
    const modelMessages = await convertToModelMessages(
      validatedMessages.map(({ id, ...messageWithoutId }) => {
        void id;
        return messageWithoutId;
      }),
      { tools: validationTools },
    );

    const result = await streamText({
      model,
      system: buildSystemInstructions({ isSearch, isThink }),
      messages: modelMessages,
      tools: streamTools,
    });

    return result.toUIMessageStreamResponse({
      generateMessageId: generateResponseMessageId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /chat] Error in /api/chat:", message);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
