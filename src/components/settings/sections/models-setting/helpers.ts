import type { ProviderType } from "@/config/providers";
import type { Model } from "@/domain/models/types";

export const PROVIDER_TYPE_DEFAULT_BASE_URLS: Record<ProviderType, string | undefined> = {
  openai: "https://api.openai.com/v1",
  "openai-response": "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  anthropic: "https://api.anthropic.com/v1",
  "new-api": undefined,
  ollama: "http://localhost:11434/v1",
};

export function normalizeProviderId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildUniqueProviderId(
  name: string,
  type: ProviderType,
  existingIds: Set<string>,
): string {
  const baseId = normalizeProviderId(name) || normalizeProviderId(type) || "provider";
  let candidate = baseId;
  let suffix = 2;
  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function groupModelsByGroupName(models: Model[]): Array<[string, Model[]]> {
  const groups: Record<string, Model[]> = {};

  for (const model of models) {
    const groupName = model.group_name || model.provider_id;
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(model);
  }

  return Object.entries(groups);
}

export function getEnabledModels(models: Model[]): Model[] {
  return models.filter((model) => model.is_enabled !== false);
}

export function resolveEnabledModelSelection(
  models: Model[],
  preferredModelId?: string | null,
): string {
  const enabledModels = getEnabledModels(models);
  if (enabledModels.length === 0) {
    return "";
  }

  if (preferredModelId && enabledModels.some((model) => model.id === preferredModelId)) {
    return preferredModelId;
  }

  return enabledModels[0].id;
}
