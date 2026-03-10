import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { messages, apiKey, baseURL, modelId } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key 未提供" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openai = createOpenAI({
      apiKey,
      baseURL: baseURL || "https://api.openai.com/v1",
    });

    const result = streamText({
      model: openai(modelId || "gpt-4o-mini"),
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
