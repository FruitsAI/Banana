import { testProviderConnection } from "@/services/providers";

function toUserFriendlyConnectionError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("timed out") || normalized.includes("timeout")) {
    return "连接超时: 模型平台未在限定时间内响应，请检查 API 地址、网络或代理设置。";
  }

  if (normalized.includes("401")) {
    return "身份验证失败 (401): 请检查您的 API Key 是否正确。";
  }

  if (normalized.includes("404")) {
    return "接口未找到 (404): 请检查 API 地址或模型 ID 是否正确。";
  }

  if (normalized.includes("fetch_error")) {
    return "连接失败: 无法访问 API 地址，请检查网络或代理设置。";
  }

  return message;
}

/**
 * API 连接性测试路由
 * @description 通过一个极轻量、带超时预算的探测请求验证 API Key 和 Base URL 的有效性。
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

    await testProviderConnection({
      apiKey,
      baseURL,
      modelId: modelId || "gpt-4o-mini",
      providerType,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /test-connection] Error:", message);

    return new Response(JSON.stringify({ error: toUserFriendlyConnectionError(message) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
