import { NextRequest, NextResponse } from "next/server";

/**
 * 获取提供商支持的模型列表
 * @description 支持标准的 OpenAI /v1/models 协议，并针对不同提供商进行适配。
 */
export async function POST(req: NextRequest) {
  try {
    const { apiKey, baseURL, providerType } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    // 格式化 Base URL
    let url = baseURL || "https://api.openai.com/v1";
    if (!url.endsWith("/")) url += "/";
    url += "models";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `Failed to fetch models from provider (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 统一处理模型数据格式
    // 标准 OpenAI 返回是 { data: [{ id: "...", ... }] }
    let rawModels = [];
    if (Array.isArray(data)) {
      rawModels = data;
    } else if (data && Array.isArray(data.data)) {
      rawModels = data.data;
    } else if (data && typeof data === 'object') {
      // 某些非标准接口可能直接返回对象数组
      rawModels = Object.values(data).filter(v => typeof v === 'object' && (v as any).id);
    }

    const formattedModels = rawModels.map((m: any) => ({
      id: m.id,
      name: m.id, // 默认 ID 作为 Name，前端可进一步匹配
      created: m.created,
      owned_by: m.owned_by,
    }));

    return NextResponse.json({ models: formattedModels });
  } catch (error) {
    console.error("[Models API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
