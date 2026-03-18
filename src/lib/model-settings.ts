import type { Model, Provider } from "@/domain/models/types";
import {
  getActiveModelSelection as getActiveModelSelectionFromService,
  getModelsByProvider,
  getProviderModelsSeededState,
  getProviders,
  setProviderModelsSeededState,
  setActiveModelSelection as setActiveModelSelectionFromService,
  upsertModel,
  upsertProvider,
} from "@/services/models";

interface ProviderSeed {
  id: string;
  name: string;
  icon: string;
}

interface ModelSeed {
  id: string;
  name: string;
}

const DEFAULT_PROVIDER_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434/v1",
};
const LEGACY_PLACEHOLDER_BASE_URL = "https://api.example.com/v1";

const DEFAULT_PROVIDER_SEEDS: ProviderSeed[] = [
  { id: "openai", name: "OpenAI", icon: "O" },
  { id: "anthropic", name: "Anthropic", icon: "A" },
  { id: "gemini", name: "Gemini", icon: "G" },
  { id: "openrouter", name: "OpenRouter", icon: "R" },
  { id: "ollama", name: "Ollama", icon: "L" },
];

const DEFAULT_MODEL_SEEDS: Record<string, ModelSeed[]> = {
  openai: [
    { id: "gpt-4o-mini", name: "gpt-4o-mini" },
    { id: "gpt-4.1-mini", name: "gpt-4.1-mini" },
  ],
  anthropic: [
    { id: "claude-3-5-sonnet", name: "claude-3-5-sonnet" },
    { id: "claude-3-5-haiku", name: "claude-3-5-haiku" },
  ],
  gemini: [
    { id: "gemini-2.0-flash", name: "gemini-2.0-flash" },
    { id: "gemini-1.5-pro", name: "gemini-1.5-pro" },
  ],
  openrouter: [{ id: "openrouter/auto", name: "openrouter/auto" }],
  ollama: [{ id: "llama3.1:8b", name: "llama3.1:8b" }],
};

/**
 * 获取系统预设 Provider 的默认 Base URL。
 * @param providerId - 供应商 id
 * @returns 默认 URL；未知 provider 返回占位地址
 */
function resolveDefaultProviderBaseUrl(providerId: string): string {
  const normalizedProviderId = providerId.trim().toLowerCase();
  return DEFAULT_PROVIDER_BASE_URLS[normalizedProviderId] ?? LEGACY_PLACEHOLDER_BASE_URL;
}

/**
 * 初始化模型供应商列表（仅补齐缺失项，不覆盖已有用户配置）。
 * @returns Promise<Provider[]>
 */
export async function ensureProvidersReady(): Promise<Provider[]> {
  const providers = await getProviders();
  const providerIdSet = new Set(providers.map((provider) => provider.id));

  const missingProviders = DEFAULT_PROVIDER_SEEDS.filter(
    (seedProvider) => !providerIdSet.has(seedProvider.id)
  );

  if (missingProviders.length > 0) {
    for (const seedProvider of missingProviders) {
      await upsertProvider({
        id: seedProvider.id,
        name: seedProvider.name,
        icon: seedProvider.icon,
        is_enabled: seedProvider.id === "openai",
        base_url: resolveDefaultProviderBaseUrl(seedProvider.id),
        api_key: undefined,
        provider_type: seedProvider.id === "openrouter" ? "openai" : seedProvider.id,
      });
    }
  }

  // 对已有 provider 做一次默认地址补齐（仅在 base_url 为空时，不覆盖用户配置）
  const providersWithMissingBaseUrl = providers.filter((provider) => {
    const normalizedBaseUrl = provider.base_url?.trim() ?? "";
    const hasUserBaseUrl = normalizedBaseUrl.length > 0;
    const isLegacyPlaceholderBaseUrl = normalizedBaseUrl === LEGACY_PLACEHOLDER_BASE_URL;
    const hasSystemDefaultBaseUrl = provider.id.toLowerCase() in DEFAULT_PROVIDER_BASE_URLS;
    return (!hasUserBaseUrl || isLegacyPlaceholderBaseUrl) && hasSystemDefaultBaseUrl;
  });

  if (providersWithMissingBaseUrl.length > 0) {
    for (const provider of providersWithMissingBaseUrl) {
      await upsertProvider({
        ...provider,
        base_url: resolveDefaultProviderBaseUrl(provider.id),
      });
    }
  }

  // 对已有 provider 做一次 provider_type 补齐（仅在 provider_type 为空时）
  const allProviders = await getProviders();
  const providersWithMissingType = allProviders.filter(
    (provider) => !provider.provider_type
  );

  if (providersWithMissingType.length > 0) {
    const KNOWN_TYPES: Record<string, string> = {
      openai: "openai",
      anthropic: "anthropic",
      gemini: "gemini",
      ollama: "ollama",
      openrouter: "openai",
    };

    for (const provider of providersWithMissingType) {
      const inferredType = KNOWN_TYPES[provider.id.toLowerCase()] ?? "openai";
      await upsertProvider({
        ...provider,
        provider_type: inferredType,
      });
    }
  }

  const normalizedProviders = await getProviders();
  return normalizedProviders;
}

/**
 * 按 Provider 读取模型列表；若数据库为空则写入默认模型种子。
 * @param providerId - 供应商 id
 * @returns Promise<Model[]>
 */
export async function ensureProviderModelsReady(providerId: string): Promise<Model[]> {
  const currentModels = await getModelsByProvider(providerId);
  if (currentModels.length > 0) {
    const seededState = await getProviderModelsSeededState(providerId);
    if (!seededState) {
      await setProviderModelsSeededState(providerId);
    }
    return currentModels;
  }

  const seededState = await getProviderModelsSeededState(providerId);
  if (seededState) {
    return [];
  }

  const modelSeeds = DEFAULT_MODEL_SEEDS[providerId] ?? [];
  if (modelSeeds.length === 0) {
    await setProviderModelsSeededState(providerId);
    return [];
  }

  for (const seedModel of modelSeeds) {
    const inferredCapabilities = inferModelCapabilities(providerId, seedModel.id);
    await upsertModel({
      id: seedModel.id,
      provider_id: providerId,
      name: seedModel.name,
      is_enabled: true,
      capabilities: inferredCapabilities,
      capabilities_source: "auto",
    });
  }

  await setProviderModelsSeededState(providerId);

  return getModelsByProvider(providerId);
}

/**
 * 获取当前默认的 Provider 与 Model 标识。
 * @returns Promise<{ activeProviderId: string | null; activeModelId: string | null }>
 */
export async function getActiveModelSelection(): Promise<{
  activeProviderId: string | null;
  activeModelId: string | null;
}> {
  return getActiveModelSelectionFromService();
}

/**
 * 保存当前默认模型选择。
 * @param providerId - 默认 Provider id
 * @param modelId - 默认 Model id
 */
export async function setActiveModelSelection(providerId: string, modelId: string): Promise<void> {
  await setActiveModelSelectionFromService(providerId, modelId);
}

/**
 * 统一的 Provider 标题过滤逻辑。
 * @param providers - 待过滤数据
 * @param keyword - 关键词
 * @returns 过滤后的 Provider 列表
 */
export function filterProviders(providers: Provider[], keyword: string): Provider[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return providers;
  }

  return providers.filter((provider) => {
    const providerName = provider.name.toLowerCase();
    const providerId = provider.id.toLowerCase();
    return providerName.includes(normalizedKeyword) || providerId.includes(normalizedKeyword);
  });
}

export function inferModelCapabilities(providerId: string, modelId: string): string[] {
  const source = `${providerId} ${modelId}`.toLowerCase();
  const capabilities = new Set<string>();
  const includesAny = (tokens: string[]): boolean => tokens.some((token) => source.includes(token));

  if (includesAny(["vision", "image", "multimodal", "mm"])) {
    capabilities.add("vision");
  }
  if (includesAny(["audio", "speech", "tts", "whisper"])) {
    capabilities.add("audio");
  }
  if (includesAny(["embedding", "embed"])) {
    capabilities.add("embedding");
  }
  if (includesAny(["tool", "function", "tools"])) {
    capabilities.add("tools");
  }
  if (includesAny(["reason", "o1", "o3", "r1"])) {
    capabilities.add("reasoning");
  }
  if (includesAny(["web", "browser", "search"])) {
    capabilities.add("web");
  }

  return Array.from(capabilities);
}
