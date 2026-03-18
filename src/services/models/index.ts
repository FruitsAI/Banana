import {
  deleteProvider as dbDeleteProvider,
  deleteModel as dbDeleteModel,
  getConfig as dbGetConfig,
  getModelsByProvider as dbGetModelsByProvider,
  getProviders as dbGetProviders,
  setConfig as dbSetConfig,
  upsertModel as dbUpsertModel,
  upsertProvider as dbUpsertProvider,
} from "@/lib/db";
import type { ActiveModelSelection, Model, Provider } from "@/domain/models/types";
import { AppError, normalizeError } from "@/shared/errors";

function wrapError(operation: string, error: unknown): AppError {
  return normalizeError(error, {
    domain: "models",
    operation,
    code: "SERVICE_ERROR",
  });
}

function getProviderModelsSeededKey(providerId: string): string {
  return `provider_models_seeded_${providerId}`;
}

export async function getProviders(): Promise<Provider[]> {
  try {
    return await dbGetProviders();
  } catch (error) {
    throw wrapError("getProviders", error);
  }
}

export async function upsertProvider(provider: Provider): Promise<void> {
  try {
    await dbUpsertProvider(provider);
  } catch (error) {
    throw wrapError("upsertProvider", error);
  }
}

export async function deleteProvider(providerId: string): Promise<void> {
  try {
    await dbDeleteProvider(providerId);
  } catch (error) {
    throw wrapError("deleteProvider", error);
  }
}

export async function getModelsByProvider(providerId: string): Promise<Model[]> {
  try {
    return await dbGetModelsByProvider(providerId);
  } catch (error) {
    throw wrapError("getModelsByProvider", error);
  }
}

export async function upsertModel(model: Model): Promise<void> {
  try {
    await dbUpsertModel(model);
  } catch (error) {
    throw wrapError("upsertModel", error);
  }
}

export async function deleteModel(modelId: string): Promise<void> {
  try {
    await dbDeleteModel(modelId);
  } catch (error) {
    throw wrapError("deleteModel", error);
  }
}

export async function getActiveModelSelection(): Promise<ActiveModelSelection> {
  try {
    const [activeProviderId, activeModelId] = await Promise.all([
      dbGetConfig("active_provider_id"),
      dbGetConfig("active_model_id"),
    ]);
    return {
      activeProviderId,
      activeModelId,
    };
  } catch (error) {
    throw wrapError("getActiveModelSelection", error);
  }
}

export async function setActiveModelSelection(providerId: string, modelId: string): Promise<void> {
  try {
    await Promise.all([
      dbSetConfig("active_provider_id", providerId),
      dbSetConfig("active_model_id", modelId),
    ]);
  } catch (error) {
    throw wrapError("setActiveModelSelection", error);
  }
}

export async function getProviderModelsSeededState(providerId: string): Promise<boolean> {
  try {
    const value = await dbGetConfig(getProviderModelsSeededKey(providerId));
    return value === "1";
  } catch (error) {
    throw wrapError("getProviderModelsSeededState", error);
  }
}

export async function setProviderModelsSeededState(providerId: string): Promise<void> {
  try {
    await dbSetConfig(getProviderModelsSeededKey(providerId), "1");
  } catch (error) {
    throw wrapError("setProviderModelsSeededState", error);
  }
}
