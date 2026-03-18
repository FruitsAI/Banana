import { streamText, tool, jsonSchema } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

type OpenAICompatOptions = Parameters<typeof createOpenAI>[0] & {
  compatibility?: "strict" | "compatible";
};

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
    const { messages, apiKey, baseURL, modelId, providerType, isSearch, isThink, tools: clientTools } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key 未提供" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resolvedType = providerType ?? "openai";
    const resolvedBaseURL = baseURL || "https://api.openai.com/v1";
    const useCompatible = shouldUseCompatibleMode(resolvedType);

    console.log("[API /chat] \ud83d\ude80 收到请求:", {
      modelId: modelId || "gpt-4o-mini",
      isSearch,
      isThink,
      hasTools: !!clientTools?.length,
    });

    const openai = createOpenAI({
      apiKey,
      baseURL: resolvedBaseURL,
      compatibility: "strict" // forces strict completions path avoiding /v1/responses
    } as OpenAICompatOptions);

    const modelParams = useCompatible 
      ? openai.chat(modelId || "gpt-4o-mini") 
      : openai(modelId || "gpt-4o-mini");

    // 构造增强的消息列表: System 提示词必须放在对话的最前面，绝对不能放在用户提问的后面！
    const finalMessages = [...messages];
    
    // 自动添加当前时间与时区上下文，防止某些依赖时间的 MCP 工具缺少参数
    const now = new Date();
    finalMessages.unshift({
      role: "system",
      content: `[IMPORTANT Context]
Current local time: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
Local timezone: Asia/Shanghai

When using any tool (like get_current_time), you MUST explicitly provide the 'timezone' parameter as "Asia/Shanghai" unless the user asks for a different one. DO NOT leave required parameters empty.`
    });
    
    // 如果开启了搜索或思考，且模型可能支持（或者通过提示词引导）
    if (isThink) {
      finalMessages.unshift({
        role: "system",
        content: "[System Instruction: Deep Thinking is ENABLED. You MUST show your reasoning process inside <think> tags.]"
      });
    }

    if (isSearch) {
      finalMessages.unshift({
        role: "system",
        content: "[System Instruction: Network Search is ENABLED. You MUST use internet search to verify facts and provide the most current information.]"
      });
    }

    // 转换客户端工具定义为 AI SDK 格式
    const sdkTools: Record<string, any> = {};
    if (clientTools && Array.isArray(clientTools)) {
      clientTools.forEach((t: { name: string; description?: string; inputSchema: any }) => {
        const schema = jsonSchema(t.inputSchema);
        // @ai-sdk/openai older versions expect a `.schema` property on the parameters object
        // jsonSchema() from ai returns an object with `{ type: "object", jsonSchema: {...}, validate: ... }`
        // We shim the `.schema` property to bypass the `schema is not a function` error
        (schema as any).schema = (schema as any).jsonSchema;
        
        sdkTools[t.name] = tool({
          description: t.description,
          parameters: schema,
        } as unknown as Parameters<typeof tool>[0]);
      });
    }

    let result;
    try {
      result = await streamText({
        model: modelParams,
        messages: finalMessages,
        tools: sdkTools as any,
      });
    } catch (e: any) {
      console.error("[API /chat] streamText ERROR:", e.message, e.stack);
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }

    // Use the native UI Message Stream Response from ai@6
    if (typeof (result as any).toUIMessageStreamResponse === 'function') {
      const originalResponse = (result as any).toUIMessageStreamResponse();
      
      const debugTransform = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          console.log("[DEBUG API] Stream emitting chunk =>", text.substring(0, 150));
          // pass it along intact
          controller.enqueue(chunk);
        }
      });
      
      const newBody = originalResponse.body.pipeThrough(debugTransform);
      return new Response(newBody, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: originalResponse.headers
      });
    }

    throw new Error("Unable to create stream response from AI SDK result (missing toUIMessageStreamResponse)");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /chat] Error in /api/chat:", message);
    if (err instanceof Error && err.stack) console.error(err.stack);
    
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
