import { NextRequest, NextResponse } from "next/server";
import { listProviderModels } from "@/services/providers";

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

    const formattedModels = await listProviderModels({
      apiKey,
      baseURL,
      providerType,
    });

    return NextResponse.json({ models: formattedModels });
  } catch (error) {
    console.error("[Models API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
