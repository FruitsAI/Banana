import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * 不同供应商类型对应的 API 路径后缀（仅用于日志）。
 */
const PROVIDER_TYPE_API_SUFFIXES: Record<string, string> = {
  openai: "/chat/completions",
  "openai-response": "/responses",
  gemini: "/chat/completions",
  anthropic: "/messages",
  "new-api": "/chat/completions",
  ollama: "/chat/completions",
};

/**
 * 判断是否应使用 OpenAI 兼容模式（/chat/completions）。
 * @description 只有 openai-response 类型才使用 Responses API（/responses），
 *              其余所有类型均强制走 /chat/completions 路径。
 * @param providerType - 供应商类型标识
 * @returns 是否使用兼容模式
 */
function shouldUseCompatibleMode(providerType: string): boolean {
  return providerType !== "openai-response";
}

export async function POST(req: Request) {
  try {
    const { messages, apiKey, baseURL, modelId, providerType } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key 未提供" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resolvedType = providerType ?? "openai";
    const resolvedBaseURL = baseURL || "https://api.openai.com/v1";
    const useCompatible = shouldUseCompatibleMode(resolvedType);

    const openai = createOpenAI({
      apiKey,
      baseURL: resolvedBaseURL,
    });

    console.log("[API /chat] 🚀 请求配置:", {
      providerType: resolvedType,
      baseURL: resolvedBaseURL,
      apiSuffix: PROVIDER_TYPE_API_SUFFIXES[resolvedType] ?? "/chat/completions",
      modelId: modelId || "gpt-4o-mini",
    });

    const modelParams = useCompatible 
      ? openai.chat(modelId || "gpt-4o-mini") 
      : openai(modelId || "gpt-4o-mini");

    console.log(`[API /chat] 🛠️ 分支选择: ${useCompatible ? "COMPATIBLE (/chat/completions)" : "STRICT (/responses)"}`);

    const result = streamText({
      model: modelParams,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /chat] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
