import type { Model, Provider } from "@/domain/models/types";
import {
  deleteModel,
  deleteProvider,
  getActiveModelSelection as getActiveModelSelectionFromService,
  getModelsByProvider,
  getProviderModelsSeededState,
  getProviderModelsSeedVersion,
  getProviderSeedDismissedState,
  getProviders,
  getSeedModelDismissedState,
  setProviderSeedDismissedState,
  setSeedModelDismissedState,
  setProviderModelsSeededState,
  setProviderModelsSeedVersion,
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

interface ModelSeedMigration {
  version: number;
  seeds: ModelSeed[];
}

interface ThinkingVariantMapping {
  baseModelId: string;
  thinkingModelId: string;
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

const BASELINE_MODEL_SEEDS: Record<string, ModelSeed[]> = {
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
  nvidia: [
    { id: "z-ai/glm5", name: "z-ai/glm5" },
    { id: "minimaxai/minimax-m2.5", name: "minimaxai/minimax-m2.5" },
    { id: "moonshotai/kimi-k2.5", name: "moonshotai/kimi-k2.5" },
  ],
};

const MODEL_SEED_MIGRATIONS: Record<string, ModelSeedMigration[]> = {
  nvidia: [
    {
      version: 2,
      seeds: [{ id: "moonshotai/kimi-k2-thinking", name: "moonshotai/kimi-k2-thinking" }],
    },
  ],
};

const THINKING_VARIANT_MAPPINGS: Record<string, ThinkingVariantMapping[]> = {
  nvidia: [
    {
      baseModelId: "moonshotai/kimi-k2.5",
      thinkingModelId: "moonshotai/kimi-k2-thinking",
    },
  ],
};

function getProviderSeedLookupKey(providerId: string): string {
  return providerId.trim().toLowerCase();
}

function getDefaultProviderSeed(providerId: string): ProviderSeed | undefined {
  const normalizedProviderId = getProviderSeedLookupKey(providerId);
  return DEFAULT_PROVIDER_SEEDS.find((seedProvider) => seedProvider.id === normalizedProviderId);
}

function resolveDefaultProviderType(providerId: string): string {
  return providerId === "openrouter" ? "openai" : providerId;
}

function getBaselineModelSeeds(providerId: string): ModelSeed[] {
  return BASELINE_MODEL_SEEDS[getProviderSeedLookupKey(providerId)] ?? [];
}

function isDefaultProviderSeed(providerId: string): boolean {
  return getDefaultProviderSeed(providerId) !== undefined;
}

function isSeedModel(providerId: string, modelId: string): boolean {
  const normalizedModelId = normalizeModelId(modelId);
  return getAllProviderSeedModels(providerId).some(
    (seedModel) => normalizeModelId(seedModel.id) === normalizedModelId,
  );
}

function getProviderSeedMigrations(providerId: string): ModelSeedMigration[] {
  return MODEL_SEED_MIGRATIONS[getProviderSeedLookupKey(providerId)] ?? [];
}

function getThinkingVariantMappings(providerId: string): ThinkingVariantMapping[] {
  return THINKING_VARIANT_MAPPINGS[getProviderSeedLookupKey(providerId)] ?? [];
}

function normalizeModelId(modelId: string): string {
  return modelId.trim().toLowerCase();
}

function getEnabledModels(models: Model[]): Model[] {
  return models.filter((model) => model.is_enabled !== false);
}

function findModelById(models: Model[], modelId: string): Model | undefined {
  const normalizedModelId = normalizeModelId(modelId);
  return models.find((model) => normalizeModelId(model.id) === normalizedModelId);
}

function getLatestProviderSeedVersion(providerId: string): number {
  const baselineVersion = getBaselineModelSeeds(providerId).length > 0 ? 1 : 0;
  return getProviderSeedMigrations(providerId).reduce(
    (latestVersion, migration) => Math.max(latestVersion, migration.version),
    baselineVersion
  );
}

function getAllProviderSeedModels(providerId: string): ModelSeed[] {
  return [
    ...getBaselineModelSeeds(providerId),
    ...getProviderSeedMigrations(providerId)
      .slice()
      .sort((left, right) => left.version - right.version)
      .flatMap((migration) => migration.seeds),
  ];
}

function getProviderSeedModelsIntroducedAfterVersion(
  providerId: string,
  version: number
): ModelSeed[] {
  const baselineSeeds = version < 1 ? getBaselineModelSeeds(providerId) : [];
  const migrationSeeds = getProviderSeedMigrations(providerId)
    .filter((migration) => migration.version > version)
    .sort((left, right) => left.version - right.version)
    .flatMap((migration) => migration.seeds);

  return [...baselineSeeds, ...migrationSeeds];
}

function getLegacyProviderSeedVersion(providerId: string, seededState: boolean): number {
  if (!seededState) {
    return 0;
  }

  return getBaselineModelSeeds(providerId).length > 0 ? 1 : 0;
}

async function backfillMissingSeedModels(
  providerId: string,
  currentModels: Model[],
  seedModels: ModelSeed[]
): Promise<boolean> {
  const existingModelIds = new Set(currentModels.map((model) => normalizeModelId(model.id)));
  const candidateSeedModels = seedModels.filter(
    (seedModel) => !existingModelIds.has(normalizeModelId(seedModel.id)),
  );
  const dismissedSeedModels = await Promise.all(
    candidateSeedModels.map(async (seedModel) => ({
      dismissed: await getSeedModelDismissedState(providerId, seedModel.id),
      seedModel,
    })),
  );
  const missingSeedModels = dismissedSeedModels
    .filter((candidate) => !candidate.dismissed)
    .map((candidate) => candidate.seedModel);

  if (missingSeedModels.length === 0) {
    return false;
  }

  for (const seedModel of missingSeedModels) {
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

  return true;
}

/**
 * 获取系统预设 Provider 的默认 Base URL。
 * @param providerId - 供应商 id
 * @returns 默认 URL；未知 provider 返回占位地址
 */
function resolveDefaultProviderBaseUrl(providerId: string): string {
  const normalizedProviderId = providerId.trim().toLowerCase();
  return DEFAULT_PROVIDER_BASE_URLS[normalizedProviderId] ?? LEGACY_PLACEHOLDER_BASE_URL;
}

async function canonicalizeDefaultProviders(providers: Provider[]): Promise<boolean> {
  let didMutate = false;
  let activeSelection = await getActiveModelSelectionFromService();

  for (const provider of providers) {
    const defaultSeed = getDefaultProviderSeed(provider.id);
    if (!defaultSeed || provider.id === defaultSeed.id) {
      continue;
    }

    const normalizedProvider: Provider = {
      ...provider,
      id: defaultSeed.id,
      name: provider.name || defaultSeed.name,
      icon: provider.icon || defaultSeed.icon,
      base_url: provider.base_url ?? resolveDefaultProviderBaseUrl(defaultSeed.id),
      provider_type: provider.provider_type ?? resolveDefaultProviderType(defaultSeed.id),
    };

    await upsertProvider(normalizedProvider);

    const targetModels = await getModelsByProvider(defaultSeed.id);
    const targetModelIds = new Set(targetModels.map((model) => normalizeModelId(model.id)));
    const legacyModels = await getModelsByProvider(provider.id);

    for (const legacyModel of legacyModels) {
      if (targetModelIds.has(normalizeModelId(legacyModel.id))) {
        continue;
      }

      await upsertModel({
        ...legacyModel,
        provider_id: defaultSeed.id,
      });
      targetModelIds.add(normalizeModelId(legacyModel.id));
    }

    if (activeSelection.activeProviderId === provider.id) {
      await setActiveModelSelectionFromService(defaultSeed.id, activeSelection.activeModelId ?? "");
      activeSelection = {
        ...activeSelection,
        activeProviderId: defaultSeed.id,
      };
    }

    await deleteProvider(provider.id);
    didMutate = true;
  }

  return didMutate;
}

/**
 * 初始化模型供应商列表（仅补齐缺失项，不覆盖已有用户配置）。
 * @returns Promise<Provider[]>
 */
export async function ensureProvidersReady(): Promise<Provider[]> {
  const providers = await getProviders();
  const didCanonicalize = await canonicalizeDefaultProviders(providers);
  const effectiveProviders = didCanonicalize ? await getProviders() : providers;
  const providerIdSet = new Set(
    effectiveProviders.map((provider) => getProviderSeedLookupKey(provider.id))
  );
  const providerDismissalStates = await Promise.all(
    DEFAULT_PROVIDER_SEEDS.map(async (seedProvider) => ({
      dismissed: await getProviderSeedDismissedState(seedProvider.id),
      seedProvider,
    })),
  );

  const missingProviders = providerDismissalStates
    .filter(
      ({ dismissed, seedProvider }) =>
        !dismissed && !providerIdSet.has(getProviderSeedLookupKey(seedProvider.id))
    )
    .map(({ seedProvider }) => seedProvider);

  if (missingProviders.length > 0) {
    for (const seedProvider of missingProviders) {
      await upsertProvider({
        id: seedProvider.id,
        name: seedProvider.name,
        icon: seedProvider.icon,
        is_enabled: seedProvider.id === "openai",
        base_url: resolveDefaultProviderBaseUrl(seedProvider.id),
        api_key: undefined,
        provider_type: resolveDefaultProviderType(seedProvider.id),
      });
    }
  }

  // 对已有 provider 做一次默认地址补齐（仅在 base_url 为空时，不覆盖用户配置）
  const providersWithMissingBaseUrl = effectiveProviders.filter((provider) => {
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
  const seededState = await getProviderModelsSeededState(providerId);
  const storedSeedVersion = await getProviderModelsSeedVersion(providerId);
  const latestSeedVersion = getLatestProviderSeedVersion(providerId);
  const effectiveSeedVersion =
    storedSeedVersion ?? getLegacyProviderSeedVersion(providerId, seededState);

  if (currentModels.length > 0) {
    const seedModelsToApply = seededState
      ? getProviderSeedModelsIntroducedAfterVersion(providerId, effectiveSeedVersion)
      : getAllProviderSeedModels(providerId);
    const backfilled = await backfillMissingSeedModels(providerId, currentModels, seedModelsToApply);

    if (!seededState) {
      await setProviderModelsSeededState(providerId);
    }

    if (latestSeedVersion > 0 && storedSeedVersion !== latestSeedVersion) {
      await setProviderModelsSeedVersion(providerId, latestSeedVersion);
    }

    return backfilled ? getModelsByProvider(providerId) : currentModels;
  }

  if (seededState) {
    if (latestSeedVersion > 0 && storedSeedVersion !== latestSeedVersion) {
      await setProviderModelsSeedVersion(providerId, latestSeedVersion);
    }
    return [];
  }

  const modelSeedCandidates = getAllProviderSeedModels(providerId);
  const modelSeedStates = await Promise.all(
    modelSeedCandidates.map(async (seedModel) => ({
      dismissed: await getSeedModelDismissedState(providerId, seedModel.id),
      seedModel,
    })),
  );
  const modelSeeds = modelSeedStates
    .filter((candidate) => !candidate.dismissed)
    .map((candidate) => candidate.seedModel);
  if (modelSeeds.length === 0) {
    await setProviderModelsSeededState(providerId);
    if (latestSeedVersion > 0) {
      await setProviderModelsSeedVersion(providerId, latestSeedVersion);
    }
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
  if (latestSeedVersion > 0) {
    await setProviderModelsSeedVersion(providerId, latestSeedVersion);
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

export async function deleteProviderWithSeedLifecycle(providerId: string): Promise<void> {
  if (isDefaultProviderSeed(providerId)) {
    await setProviderSeedDismissedState(providerId, true);
  }

  await deleteProvider(providerId);
}

export async function deleteModelWithSeedLifecycle(
  providerId: string,
  modelId: string,
): Promise<void> {
  if (isSeedModel(providerId, modelId)) {
    await setSeedModelDismissedState(providerId, modelId, true);
  }

  await deleteModel(providerId, modelId);
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
  if (includesAny(["reason", "thinking", "reasoner", "o1", "o3", "r1", "glm5", "deepseek-r", "qwq", "gpt-5", "gpt5", "minimax-m2.5", "kimi-k2-thinking"])) {
    capabilities.add("reasoning");
  }
  if (includesAny(["web", "browser", "search"])) {
    capabilities.add("web");
  }

  return Array.from(capabilities);
}

export function resolveThinkingModelId(
  providerId: string,
  modelId: string,
  models: Model[],
  thinkingEnabled: boolean,
): string {
  const enabledModels = getEnabledModels(models);
  const normalizedModelId = normalizeModelId(modelId);

  for (const mapping of getThinkingVariantMappings(providerId)) {
    const isBaseModel = normalizedModelId === normalizeModelId(mapping.baseModelId);
    const isThinkingModel = normalizedModelId === normalizeModelId(mapping.thinkingModelId);

    if (!isBaseModel && !isThinkingModel) {
      continue;
    }

    if (thinkingEnabled) {
      const thinkingModel = findModelById(enabledModels, mapping.thinkingModelId);
      return thinkingModel?.id ?? modelId;
    }

    if (isThinkingModel) {
      const baseModel = findModelById(enabledModels, mapping.baseModelId);
      return baseModel?.id ?? modelId;
    }
  }

  return modelId;
}

export function supportsNativeThinking(
  providerId: string,
  modelId: string,
  models: Model[],
): boolean {
  const enabledModels = getEnabledModels(models);
  const selectedModel = findModelById(enabledModels, modelId);
  const capabilities =
    selectedModel?.capabilities && selectedModel.capabilities.length > 0
      ? selectedModel.capabilities
      : inferModelCapabilities(providerId, modelId);

  if (capabilities.includes("reasoning")) {
    return true;
  }

  const normalizedModelId = normalizeModelId(modelId);
  return getThinkingVariantMappings(providerId).some((mapping) => {
    const isMappedModel =
      normalizedModelId === normalizeModelId(mapping.baseModelId) ||
      normalizedModelId === normalizeModelId(mapping.thinkingModelId);

    if (!isMappedModel) {
      return false;
    }

    return Boolean(findModelById(enabledModels, mapping.thinkingModelId));
  });
}
