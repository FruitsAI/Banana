/**
 * 此文件已被重构为返回 @lobehub/icons 兼容的 Provider 标识符。
 * 这些标识符将被传递给 ProviderIcon 组件以显示彩色官方图标。
 */

export const iconMap: Record<string, string> = {
  openai: "openai",
  anthropic: "anthropic",
  claude: "anthropic",
  gemini: "google",
  google: "google",
  ollama: "ollama",
  minimax: "minimax",
  zhipu: "zhipu",
  zhipuai: "zhipu",
  moonshot: "moonshot",
  kimi: "moonshot",
  deepseek: "deepseek",
  mistral: "mistral",
  perplexity: "perplexity",
  groq: "groq",
  nvidia: "nvidia",
  navidia: "nvidia",
};

export function getProviderIcon(id: string): string | null {
  const normId = id.toLowerCase();
  
  if (normId.includes('openai') || normId.includes('gpt')) return "openai";
  if (normId.includes('anthropic') || normId.includes('claude')) return "anthropic";
  if (normId.includes('google') || normId.includes('gemini')) return "google";
  if (normId.includes('ollama')) return "ollama";
  if (normId.includes('minimax') || normId.includes('abab')) return "minimax";
  if (normId.includes('zhipu') || normId.includes('glm') || normId.startsWith('z-ai')) return "zhipu";
  if (normId.includes('moonshot') || normId.includes('kimi')) return "moonshot";
  if (normId.includes('deepseek')) return "deepseek";
  if (normId.includes('mistral')) return "mistral";
  if (normId.includes('perplexity')) return "perplexity";
  if (normId.includes('groq')) return "groq";
  if (normId.includes('nvidia') || normId.includes('navidia')) return "nvidia";

  return iconMap[normId] || null;
}
