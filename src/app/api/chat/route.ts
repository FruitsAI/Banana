import {
  convertToModelMessages,
  streamText,
  tool,
  validateUIMessages,
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

function buildRuntimeTools(clientTools: unknown): Record<string, ReturnType<typeof tool>> {
  const runtimeTools: Record<string, ReturnType<typeof tool>> = {};

  if (!Array.isArray(clientTools)) {
    return runtimeTools;
  }

  for (const candidate of clientTools) {
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      typeof (candidate as ClientToolDescriptor).name !== "string"
    ) {
      continue;
    }

    const descriptor = candidate as ClientToolDescriptor;
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
      return new Response(JSON.stringify({ error: "API key is required." }), {
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

    const runtimeTools = buildRuntimeTools(clientTools);
    const validatedMessages = await validateUIMessages<UIMessage>({
      messages,
      tools: runtimeTools,
    });
    const modelMessages = await convertToModelMessages(
      validatedMessages.map(({ id: _id, ...messageWithoutId }) => messageWithoutId),
      { tools: runtimeTools },
    );

    const result = await streamText({
      model,
      system: buildSystemInstructions({ isSearch, isThink }),
      messages: modelMessages,
      tools: runtimeTools,
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
