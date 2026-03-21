import { useCallback } from "react";
import type { ActiveModelSelection, Model, Provider } from "@/domain/models/types";
import {
  deleteModelWithSeedLifecycle,
  deleteProviderWithSeedLifecycle,
  ensureProviderModelsReady,
} from "@/lib/model-settings";
import {
  getActiveModelSelection,
  getProviders,
  setActiveModelSelection,
  upsertModel,
  upsertProvider,
} from "@/services/models";

export function useModelsStore() {
  const loadProviders = useCallback(async (): Promise<Provider[]> => {
    return await getProviders();
  }, []);

  const saveProvider = useCallback(async (provider: Provider): Promise<void> => {
    await upsertProvider(provider);
  }, []);

  const removeProvider = useCallback(async (providerId: string): Promise<void> => {
    await deleteProviderWithSeedLifecycle(providerId);
  }, []);

  const loadModelsByProvider = useCallback(async (providerId: string): Promise<Model[]> => {
    return await ensureProviderModelsReady(providerId);
  }, []);

  const saveModel = useCallback(async (model: Model): Promise<void> => {
    await upsertModel(model);
  }, []);

  const removeModel = useCallback(async (providerId: string, modelId: string): Promise<void> => {
    await deleteModelWithSeedLifecycle(providerId, modelId);
  }, []);

  const loadActiveSelection = useCallback(async (): Promise<ActiveModelSelection> => {
    return await getActiveModelSelection();
  }, []);

  const saveActiveSelection = useCallback(
    async (providerId: string, modelId: string): Promise<void> => {
      await setActiveModelSelection(providerId, modelId);
    },
    [],
  );

  return {
    loadProviders,
    saveProvider,
    removeProvider,
    loadModelsByProvider,
    saveModel,
    removeModel,
    loadActiveSelection,
    saveActiveSelection,
  };
}
