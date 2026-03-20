import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * API 连接性测试路由
 * @description 通过发送一个极轻量的请求 (maxTokens: 1) 来验证 API Key 和 Base URL 的有效性。
 */
export async function POST(req: Request) {
  try {
    const { apiKey, baseURL, modelId, providerType } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key 未提供" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resolvedType = providerType ?? "openai";
    const resolvedBaseURL = baseURL || "https://api.openai.com/v1";
    
    // 只有 openai-response 类型才使用特定 client，其余走兼容模式
    const useCompatible = resolvedType !== "openai-response";

    const openai = createOpenAI({
      apiKey,
      baseURL: resolvedBaseURL,
    });

    const modelParams = useCompatible 
      ? openai.chat(modelId || "gpt-4o-mini") 
      : openai(modelId || "gpt-4o-mini");

    const request = {
      model: modelParams,
      messages: [{ role: "user", content: "ping" }],
    } satisfies Parameters<typeof generateText>[0];

    await generateText(request);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /test-connection] Error:", message);
    
    // 提取更有意义的错误信息
    let userFriendlyMessage = message;
    if (message.includes("401")) userFriendlyMessage = "身份验证失败 (401): 请检查您的 API Key 是否正确。";
    if (message.includes("404")) userFriendlyMessage = "接口未找到 (404): 请检查 API 地址或模型 ID 是否正确。";
    if (message.includes("FETCH_ERROR")) userFriendlyMessage = "连接失败: 无法访问 API 地址，请检查网络或代理设置。";

    return new Response(JSON.stringify({ error: userFriendlyMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
