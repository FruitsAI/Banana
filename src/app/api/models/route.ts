import { NextRequest, NextResponse } from "next/server";

interface ProviderModel {
  id: string;
  created?: number;
  owned_by?: string;
  display_name?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProviderModel(value: unknown): value is ProviderModel {
  return isRecord(value) && typeof value.id === "string";
}

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

    const resolvedProviderType = providerType ?? "openai";

    // 格式化 Base URL
    let url = baseURL || "https://api.openai.com/v1";
    if (!url.endsWith("/")) url += "/";
    url += "models";

    const headers: HeadersInit =
      resolvedProviderType === "anthropic"
        ? {
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "x-api-key": apiKey,
          }
        : {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };

    const response = await fetch(url, {
      method: "GET",
      headers,
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
    let rawModels: ProviderModel[] = [];
    if (Array.isArray(data)) {
      rawModels = data.filter(isProviderModel);
    } else if (isRecord(data) && Array.isArray(data.data)) {
      rawModels = data.data.filter(isProviderModel);
    } else if (isRecord(data)) {
      // 某些非标准接口可能直接返回对象数组
      rawModels = Object.values(data).filter(isProviderModel);
    }

    const formattedModels = rawModels.map((m) => ({
      id: m.id,
      name: m.display_name || m.id,
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
