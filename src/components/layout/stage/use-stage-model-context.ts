"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ensureProviderModelsReady,
  ensureProvidersReady,
  getActiveModelSelection,
  supportsNativeThinking,
} from "@/lib/model-settings";
import type { Model } from "@/domain/models/types";
import { getMcpServersForChat, preloadRuntimeToolDiscovery } from "@/services/chat";

type ThinkingMode = "native" | "prompt-only";

export function useStageModelContext(threadId: string, messageCount: number) {
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadModelContext = async () => {
      try {
        const providers = await ensureProvidersReady();
        const [modelsResults, selection] = await Promise.all([
          Promise.all(providers.map((provider) => ensureProviderModelsReady(provider.id))),
          getActiveModelSelection(),
        ]);
        if (ignore) {
          return;
        }

        setAllModels(modelsResults.flat().filter((model) => model.is_enabled !== false));
        setActiveProviderId(selection.activeProviderId);
        setActiveModelId(selection.activeModelId);
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load model context for stage", error);
        }
      }
    };

    const handleRefresh = () => {
      void loadModelContext();
    };

    void loadModelContext();
    window.addEventListener("refresh-active-model", handleRefresh);

    return () => {
      ignore = true;
      window.removeEventListener("refresh-active-model", handleRefresh);
    };
  }, [messageCount, threadId]);

  useEffect(() => {
    let ignore = false;
    const warmupTimer = window.setTimeout(() => {
      void (async () => {
        try {
          const servers = await getMcpServersForChat();
          if (ignore || !servers.some((server) => server.is_enabled)) {
            return;
          }

          await preloadRuntimeToolDiscovery(servers);
        } catch {
          // Background MCP warmup is opportunistic; failures should not interrupt chat startup.
        }
      })();
    }, 0);

    return () => {
      ignore = true;
      window.clearTimeout(warmupTimer);
    };
  }, [threadId]);

  const modelsByScopedId = useMemo(() => {
    const entries = allModels.map((model) => [`${model.provider_id}::${model.id}`, model] as const);
    return new Map(entries);
  }, [allModels]);

  const modelsById = useMemo(() => {
    const entries = allModels.map((model) => [model.id, model] as const);
    return new Map(entries);
  }, [allModels]);

  const getModelInfo = useCallback(
    (modelId?: string, providerId?: string): Model | undefined => {
      if (providerId && modelId) {
        const providerScopedMatch = modelsByScopedId.get(`${providerId}::${modelId}`);
        if (providerScopedMatch) {
          return providerScopedMatch;
        }
      }

      return (modelId ? modelsById.get(modelId) : undefined) ?? allModels[0];
    },
    [allModels, modelsById, modelsByScopedId],
  );

  const activeModel = useMemo(() => {
    if (activeProviderId && activeModelId) {
      return getModelInfo(activeModelId, activeProviderId);
    }

    return allModels[0];
  }, [activeModelId, activeProviderId, allModels, getModelInfo]);

  const thinkingMode: ThinkingMode = useMemo(() => {
    if (!activeModel) {
      return "prompt-only";
    }

    return supportsNativeThinking(activeModel.provider_id, activeModel.id, allModels)
      ? "native"
      : "prompt-only";
  }, [activeModel, allModels]);

  const thinkingTooltip =
    thinkingMode === "native" ? "当前模型支持原生思考" : "当前模型仅提示词思考";

  return {
    activeModel,
    allModels,
    getModelInfo,
    thinkingMode,
    thinkingTooltip,
  };
}
