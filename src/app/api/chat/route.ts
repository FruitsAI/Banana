import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * 不同供应商类型对应的 API 路径后缀（仅用于日志）。
 */

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
    const { messages, apiKey, baseURL, modelId, providerType, isSearch, isThink } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key 未提供" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resolvedType = providerType ?? "openai";
    const resolvedBaseURL = baseURL || "https://api.openai.com/v1";
    const useCompatible = shouldUseCompatibleMode(resolvedType);

    console.log("[API /chat] 🚀 收到请求:", {
      modelId: modelId || "gpt-4o-mini",
      isSearch,
      isThink,
    });

    const openai = createOpenAI({
      apiKey,
      baseURL: resolvedBaseURL,
    });

    const modelParams = useCompatible 
      ? openai.chat(modelId || "gpt-4o-mini") 
      : openai(modelId || "gpt-4o-mini");

    // 构造增强的消息列表
    const finalMessages = [...messages];
    
    // 如果开启了搜索或思考，且模型可能支持（或者通过提示词引导）
    // 注意：这里可以根据具体的 Provider 类型做更精细的处理
    if (isSearch) {
      finalMessages.push({
        role: "system",
        content: "[System Instruction: Network Search is ENABLED. You MUST use internet search to verify facts and provide the most current information.]"
      });
    } else {
      finalMessages.push({
        role: "system",
        content: "[System Instruction: Network Search is DISABLED. Do NOT use any search tools. Answer based on your existing knowledge only.]"
      });
    }

    if (isThink) {
      finalMessages.push({
        role: "system",
        content: "[System Instruction: Deep Thinking is ENABLED. You MUST show your reasoning process inside <think> tags.]"
      });
    } else {
      // 更加强力的禁止指令
      finalMessages.push({
        role: "system",
        content: "[System Instruction: Deep Thinking is DISABLED. Do NOT generate a <think> block. Go straight to providing your response.]"
      });
    }

    const result = streamText({
      model: modelParams,
      messages: finalMessages,
      // 针对深思等供应商的专有参数透传（如支持）
      providerOptions: {
        openai: {
          // 如果后端检测到供应商是 deepseek，可以尝试传参数
          // ...(resolvedType.includes('deepseek') ? { reasoning_effort: isThink ? 'high' : 'off' } : {})
        }
      }
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
