import {
  type Model,
  type Provider,
  getConfig,
  getModelsByProvider,
  getProviders,
  setConfig,
  upsertModel,
  upsertProvider,
} from "@/lib/db";

interface ProviderSeed {
  id: string;
  name: string;
  icon: string;
}

interface ModelSeed {
  id: string;
  name: string;
}

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
      const baseUrl = seedProvider.id === "openai" ? "https://api.openai.com/v1" : undefined;
      await upsertProvider({
        id: seedProvider.id,
        name: seedProvider.name,
        icon: seedProvider.icon,
        is_enabled: seedProvider.id === "openai",
        base_url: baseUrl,
        api_key: undefined,
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
    return currentModels;
  }

  const modelSeeds = DEFAULT_MODEL_SEEDS[providerId] ?? [];
  if (modelSeeds.length === 0) {
    return [];
  }

  for (const seedModel of modelSeeds) {
    await upsertModel({
      id: seedModel.id,
      provider_id: providerId,
      name: seedModel.name,
      is_enabled: true,
    });
  }

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
  const [activeProviderId, activeModelId] = await Promise.all([
    getConfig("active_provider_id"),
    getConfig("active_model_id"),
  ]);

  return {
    activeProviderId,
    activeModelId,
  };
}

/**
 * 保存当前默认模型选择。
 * @param providerId - 默认 Provider id
 * @param modelId - 默认 Model id
 */
export async function setActiveModelSelection(providerId: string, modelId: string): Promise<void> {
  await Promise.all([setConfig("active_provider_id", providerId), setConfig("active_model_id", modelId)]);
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

