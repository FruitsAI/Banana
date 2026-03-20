import {
  convertToModelMessages,
  dynamicTool,
  streamText,
  tool,
  validateUIMessages,
  type FlexibleSchema,
  type Tool,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function shouldUseCompatibleMode(providerType: string): boolean {
  return providerType !== "openai-response";
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
    "When using any tool (like get_current_time), you MUST explicitly provide the 'timezone' parameter as \"Asia/Shanghai\" unless the user asks for a different one. DO NOT leave required parameters empty.",
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
      inputSchema: descriptor.inputSchema as FlexibleSchema<unknown>,
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
      inputSchema: descriptor.inputSchema as Parameters<typeof tool>[0]["inputSchema"],
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
    const useCompatibleMode = shouldUseCompatibleMode(resolvedType);

    const provider = createOpenAI({
      apiKey,
      baseURL: resolvedBaseURL,
    });

    const model = useCompatibleMode
      ? provider.chat(resolvedModelId)
      : provider(resolvedModelId);

    const normalizedMessages = normalizeIncomingMessages(messages);
    const validationTools = buildValidationTools(clientTools);
    const streamTools = buildStreamTools(clientTools);
    const validatedMessages = await validateUIMessages<UIMessage>({
      messages: normalizedMessages,
      tools: validationTools,
    });
    const modelMessages = await convertToModelMessages(
      validatedMessages.map(({ id: _id, ...messageWithoutId }) => messageWithoutId),
      { tools: validationTools },
    );

    const result = await streamText({
      model,
      system: buildSystemInstructions({ isSearch, isThink }),
      messages: modelMessages,
      tools: streamTools,
    });

    return result.toUIMessageStreamResponse();
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
