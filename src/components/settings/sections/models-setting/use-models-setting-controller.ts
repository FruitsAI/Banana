"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  ensureProviderModelsReady,
  ensureProvidersReady,
  filterProviders,
  inferModelCapabilities,
} from "@/lib/model-settings";
import type { Model, Provider } from "@/domain/models/types";
import { useModelsStore } from "@/stores/models/useModelsStore";
import type { AddModelFormValues } from "@/components/models/add-model-dialog";
import type { AddProviderFormValues } from "@/components/providers/add-provider-dialog";
import { useConfirm } from "@/components/feedback/feedback-provider";
import {
  buildUniqueProviderId,
  groupModelsByGroupName,
  PROVIDER_TYPE_DEFAULT_BASE_URLS,
  resolveEnabledModelSelection,
} from "./helpers";

interface RemoteModelInput {
  id: string;
  name: string;
  groupName: string;
}

export interface ModelsSettingController {
  activeModelId: string;
  activeProvider: Provider | null;
  activeProviderId: string;
  apiKey: string;
  baseUrl: string;
  editingModel: Model | null;
  filteredProviders: Provider[];
  handleAddRemoteModels: (remoteModels: RemoteModelInput[]) => Promise<void>;
  handleCreateModel: (formValues: AddModelFormValues) => Promise<void>;
  handleCreateProvider: (formValues: AddProviderFormValues) => Promise<void>;
  handleDeleteModel: (model: Model) => Promise<void>;
  handleDeleteModelGroup: (groupName: string, groupModels: Model[]) => Promise<void>;
  handleEditModelDialogOpenChange: (open: boolean) => void;
  handleSelectDefaultModel: (modelId: string) => Promise<void>;
  handleTestConnection: () => Promise<void>;
  handleToggleModel: (model: Model, checked: boolean) => Promise<void>;
  handleToggleProvider: (checked: boolean) => Promise<void>;
  handleUpdateModel: (formValues: AddModelFormValues) => Promise<void>;
  isAddModelDialogOpen: boolean;
  isAddProviderDialogOpen: boolean;
  isEditModelDialogOpen: boolean;
  isManageModelsDialogOpen: boolean;
  isTesting: boolean;
  loading: boolean;
  modelGroups: Array<[string, Model[]]>;
  models: Model[];
  openAddModelDialog: () => void;
  openAddProviderDialog: () => void;
  openEditModelDialog: (model: Model) => void;
  providers: Provider[];
  saving: boolean;
  searchQuery: string;
  selectProvider: (providerId: string) => Promise<void>;
  setApiKey: (value: string) => void;
  setBaseUrl: (value: string) => void;
  setIsAddModelDialogOpen: (open: boolean) => void;
  setIsAddProviderDialogOpen: (open: boolean) => void;
  setIsManageModelsDialogOpen: (open: boolean) => void;
  setSearchQuery: (value: string) => void;
  showApiKey: boolean;
  toggleShowApiKey: () => void;
}

export function useModelsSettingController(): ModelsSettingController {
  const {
    loadActiveSelection,
    loadModelsByProvider,
    removeModel,
    saveActiveSelection,
    saveModel,
    saveProvider,
  } = useModelsStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [activeProviderId, setActiveProviderId] = useState("");
  const [activeModelId, setActiveModelId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAddProviderDialogOpen, setIsAddProviderDialogOpen] = useState(false);
  const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false);
  const [isEditModelDialogOpen, setIsEditModelDialogOpen] = useState(false);
  const [isManageModelsDialogOpen, setIsManageModelsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const confirm = useConfirm();
  const toastApi = useToast();

  const activeProvider = useMemo(
    () => providers.find((provider) => provider.id === activeProviderId) ?? null,
    [providers, activeProviderId],
  );

  const filteredProviders = useMemo(
    () => filterProviders(providers, searchQuery),
    [providers, searchQuery],
  );

  const modelGroups = useMemo(() => groupModelsByGroupName(models), [models]);

  const loadProviderDetail = useCallback(
    async (
      providerId: string,
      providerSnapshot: Provider[],
      preferredModelId: string | null,
    ): Promise<void> => {
      const provider = providerSnapshot.find((item) => item.id === providerId);
      if (!provider) {
        return;
      }

      setActiveProviderId(provider.id);
      setApiKey(provider.api_key ?? "");
      setBaseUrl(provider.base_url ?? "");

      const providerModels = await ensureProviderModelsReady(provider.id);
      setModels(providerModels);

      const nextModelId = resolveEnabledModelSelection(providerModels, preferredModelId);
      if (!nextModelId) {
        setActiveModelId("");
        await saveActiveSelection(provider.id, "");
        return;
      }

      setActiveModelId(nextModelId);
      await saveActiveSelection(provider.id, nextModelId);
    },
    [saveActiveSelection],
  );

  const bootstrap = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [readyProviders, activeSelection] = await Promise.all([
        ensureProvidersReady(),
        loadActiveSelection(),
      ]);
      setProviders(readyProviders);

      if (readyProviders.length === 0) {
        return;
      }

      const hasStoredProvider =
        activeSelection.activeProviderId !== null &&
        readyProviders.some((provider) => provider.id === activeSelection.activeProviderId);
      const nextProviderId = hasStoredProvider
        ? activeSelection.activeProviderId!
        : readyProviders[0].id;

      await loadProviderDetail(nextProviderId, readyProviders, activeSelection.activeModelId);
    } catch (error) {
      console.error("Failed to bootstrap model settings:", error);
    } finally {
      setLoading(false);
    }
  }, [loadActiveSelection, loadProviderDetail]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!activeProvider) {
      return;
    }

    const savedApiKey = activeProvider.api_key ?? "";
    const savedBaseUrl = activeProvider.base_url ?? "";
    if (apiKey.trim() === savedApiKey && baseUrl.trim() === savedBaseUrl) {
      return;
    }

    const timer = setTimeout(() => {
      const updatedProvider: Provider = {
        ...activeProvider,
        api_key: apiKey.trim() || undefined,
        base_url: baseUrl.trim() || undefined,
      };
      setSaving(true);
      saveProvider(updatedProvider)
        .then(() => {
          setProviders((previous) =>
            previous.map((provider) =>
              provider.id === updatedProvider.id ? updatedProvider : provider,
            ),
          );
        })
        .catch((error) => console.error("Auto-save failed:", error))
        .finally(() => setSaving(false));
    }, 800);

    return () => clearTimeout(timer);
  }, [apiKey, baseUrl, activeProvider, saveProvider]);

  const handleTestConnection = useCallback(async (): Promise<void> => {
    if (!activeProvider) {
      return;
    }

    const targetApiKey = apiKey.trim();
    const targetBaseUrl = baseUrl.trim();
    if (!targetApiKey) {
      toastApi.error("检测失败", "请先输入 API 密钥");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: targetApiKey,
          baseURL: targetBaseUrl,
          modelId: activeModelId || (models.length > 0 ? models[0].id : undefined),
          providerType: activeProvider.provider_type ?? "openai",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toastApi.success("连接成功", `已成功连接到 ${activeProvider.name}`);
      } else {
        throw new Error(data.error || "连接测试失败");
      }
    } catch (error) {
      toastApi.error("连接失败", error instanceof Error ? error.message : "未知错误");
    } finally {
      setIsTesting(false);
    }
  }, [activeModelId, activeProvider, apiKey, baseUrl, models, toastApi]);

  const handleAddRemoteModels = useCallback(
    async (remoteModels: RemoteModelInput[]): Promise<void> => {
      if (!activeProvider) {
        return;
      }

      try {
        setLoading(true);
        for (const model of remoteModels) {
          const inferredCapabilities = inferModelCapabilities(activeProvider.id, model.id);
          await saveModel({
            provider_id: activeProvider.id,
            id: model.id,
            name: model.name,
            group_name: model.groupName,
            is_enabled: true,
            capabilities: inferredCapabilities,
            capabilities_source: "auto",
          });
        }

        const updatedModels = await ensureProviderModelsReady(activeProvider.id);
        setModels(updatedModels);
        toastApi.success("添加成功", `已添加 ${remoteModels.length} 个模型`);
      } catch (error) {
        toastApi.error("添加失败", error instanceof Error ? error.message : "未知错误");
      } finally {
        setLoading(false);
      }
    },
    [activeProvider, saveModel, toastApi],
  );

  const handleToggleProvider = useCallback(
    async (checked: boolean): Promise<void> => {
      if (!activeProvider) {
        return;
      }

      try {
        const updatedProvider: Provider = {
          ...activeProvider,
          is_enabled: checked,
          api_key: apiKey.trim() || undefined,
          base_url: baseUrl.trim() || undefined,
        };
        await saveProvider(updatedProvider);
        const nextProviders = providers.map((provider) =>
          provider.id === updatedProvider.id ? updatedProvider : provider,
        );
        setProviders(nextProviders);

        if (!checked && activeProviderId === updatedProvider.id) {
          const fallbackProvider = nextProviders.find(
            (provider) => provider.id !== updatedProvider.id && provider.is_enabled,
          );

          if (fallbackProvider) {
            await loadProviderDetail(fallbackProvider.id, nextProviders, null);
            return;
          }

          setActiveModelId("");
          await saveActiveSelection("", "");
        }
      } catch (error) {
        console.error("Failed to toggle provider:", error);
      }
    },
    [
      activeProvider,
      activeProviderId,
      apiKey,
      baseUrl,
      loadProviderDetail,
      providers,
      saveActiveSelection,
      saveProvider,
    ],
  );

  const handleToggleModel = useCallback(
    async (model: Model, checked: boolean): Promise<void> => {
      try {
        const nextModel: Model = {
          ...model,
          is_enabled: checked,
        };
        await saveModel(nextModel);
        const nextModels = models.map((item) => (item.id === nextModel.id ? nextModel : item));
        setModels(nextModels);

        if (!checked && activeModelId === model.id) {
          const fallbackModelId = resolveEnabledModelSelection(nextModels);
          if (fallbackModelId) {
            setActiveModelId(fallbackModelId);
            await saveActiveSelection(activeProviderId, fallbackModelId);
          } else {
            setActiveModelId("");
            await saveActiveSelection(activeProviderId, "");
          }
        }
      } catch (error) {
        console.error("Failed to toggle model:", error);
      }
    },
    [activeModelId, activeProviderId, models, saveActiveSelection, saveModel],
  );

  const handleSelectDefaultModel = useCallback(
    async (modelId: string): Promise<void> => {
      try {
        const targetModel = models.find((model) => model.id === modelId);
        if (!targetModel || !targetModel.is_enabled) {
          return;
        }

        setActiveModelId(modelId);
        await saveActiveSelection(activeProviderId, modelId);
      } catch (error) {
        console.error("Failed to set default model:", error);
      }
    },
    [activeProviderId, models, saveActiveSelection],
  );

  const openAddModelDialog = useCallback((): void => {
    setIsAddModelDialogOpen(true);
  }, []);

  const openAddProviderDialog = useCallback((): void => {
    setIsAddProviderDialogOpen(true);
  }, []);

  const openEditModelDialog = useCallback((model: Model): void => {
    setEditingModel(model);
    setIsEditModelDialogOpen(true);
  }, []);

  const handleCreateModel = useCallback(
    async (formValues: AddModelFormValues): Promise<void> => {
      if (!activeProviderId) {
        throw new Error("请先选择模型平台");
      }

      const normalizedModelId = formValues.modelId.trim();
      if (!normalizedModelId) {
        throw new Error("模型 ID 为必填项");
      }

      const hasDuplicate = models.some(
        (model) => model.id.toLowerCase() === normalizedModelId.toLowerCase(),
      );
      if (hasDuplicate) {
        throw new Error("该模型 ID 已存在");
      }

      const normalizedModelName = formValues.modelName.trim() || normalizedModelId;
      const normalizedGroupName = formValues.groupName.trim();

      try {
        const inferredCapabilities = inferModelCapabilities(activeProviderId, normalizedModelId);
        const newModel: Model = {
          id: normalizedModelId,
          provider_id: activeProviderId,
          name: normalizedModelName,
          is_enabled: true,
          group_name: normalizedGroupName || null,
          capabilities: inferredCapabilities,
          capabilities_source: "auto",
        };

        await saveModel(newModel);
        const refreshedModels = await loadModelsByProvider(activeProviderId);
        setModels(refreshedModels);

        if (!activeModelId) {
          setActiveModelId(normalizedModelId);
          await saveActiveSelection(activeProviderId, normalizedModelId);
        }
      } catch (error) {
        console.error("Failed to add model:", error);
        throw new Error("新增模型失败，请稍后重试");
      }
    },
    [activeModelId, activeProviderId, loadModelsByProvider, models, saveActiveSelection, saveModel],
  );

  const handleUpdateModel = useCallback(
    async (formValues: AddModelFormValues): Promise<void> => {
      if (!activeProviderId || !editingModel) {
        throw new Error("请先选择要修改的模型");
      }

      const normalizedModelId = formValues.modelId.trim();
      if (!normalizedModelId) {
        throw new Error("模型 ID 为必填项");
      }

      const editingIdLower = editingModel.id.toLowerCase();
      const hasDuplicate = models.some(
        (model) =>
          model.id.toLowerCase() === normalizedModelId.toLowerCase() &&
          model.id.toLowerCase() !== editingIdLower,
      );
      if (hasDuplicate) {
        throw new Error("该模型 ID 已存在");
      }

      const normalizedModelName = formValues.modelName.trim() || normalizedModelId;
      const normalizedGroupName = formValues.groupName.trim();

      try {
        const shouldReinfer =
          !editingModel.capabilities ||
          editingModel.capabilities.length === 0 ||
          (editingModel.capabilities_source === "auto" && normalizedModelId !== editingModel.id);
        const inferredCapabilities = shouldReinfer
          ? inferModelCapabilities(activeProviderId, normalizedModelId)
          : editingModel.capabilities ?? [];
        const nextModel: Model = {
          ...editingModel,
          id: normalizedModelId,
          provider_id: activeProviderId,
          name: normalizedModelName,
          group_name: normalizedGroupName || null,
          capabilities: inferredCapabilities,
          capabilities_source: shouldReinfer
            ? "auto"
            : editingModel.capabilities_source ?? "auto",
        };

        if (normalizedModelId !== editingModel.id) {
          await removeModel(activeProviderId, editingModel.id);
        }
        await saveModel(nextModel);

        const refreshedModels = await loadModelsByProvider(activeProviderId);
        setModels(refreshedModels);

        if (activeModelId === editingModel.id) {
          setActiveModelId(normalizedModelId);
          await saveActiveSelection(activeProviderId, normalizedModelId);
        }

        setEditingModel(nextModel);
      } catch (error) {
        console.error("Failed to update model:", error);
        throw new Error("修改模型失败，请稍后重试");
      }
    },
    [
      activeModelId,
      activeProviderId,
      editingModel,
      loadModelsByProvider,
      models,
      removeModel,
      saveActiveSelection,
      saveModel,
    ],
  );

  const handleDeleteModel = useCallback(
    async (model: Model): Promise<void> => {
      if (!activeProviderId) {
        return;
      }

      const accepted = await confirm({
        title: "删除模型",
        description: `确认删除模型 “${model.id}” 吗？删除后不可恢复。`,
        confirmText: "删除",
        cancelText: "取消",
        variant: "destructive",
      });
      if (!accepted) {
        return;
      }

      try {
        await removeModel(activeProviderId, model.id);
        const refreshedModels = await loadModelsByProvider(activeProviderId);
        setModels(refreshedModels);

        if (activeModelId === model.id) {
          const fallbackModelId = resolveEnabledModelSelection(refreshedModels);
          if (fallbackModelId) {
            setActiveModelId(fallbackModelId);
            await saveActiveSelection(activeProviderId, fallbackModelId);
          } else {
            setActiveModelId("");
            await saveActiveSelection(activeProviderId, "");
          }
        }

        if (editingModel?.id === model.id) {
          setIsEditModelDialogOpen(false);
          setEditingModel(null);
        }
      } catch (error) {
        console.error("Failed to delete model:", error);
        throw new Error("删除模型失败，请稍后重试");
      }
    },
    [
      activeModelId,
      activeProviderId,
      confirm,
      editingModel,
      loadModelsByProvider,
      removeModel,
      saveActiveSelection,
    ],
  );

  const handleDeleteModelGroup = useCallback(
    async (groupName: string, groupModels: Model[]): Promise<void> => {
      if (!activeProviderId || groupModels.length === 0) {
        return;
      }

      const accepted = await confirm({
        title: "删除模型分组",
        description: `确认删除分组 “${groupName}” 下的 ${groupModels.length} 个模型吗？删除后不可恢复。`,
        confirmText: "删除分组",
        cancelText: "取消",
        variant: "destructive",
      });
      if (!accepted) {
        return;
      }

      const deletedModelIdSet = new Set(groupModels.map((model) => model.id));

      try {
        await Promise.all(groupModels.map((model) => removeModel(activeProviderId, model.id)));
        const refreshedModels = await loadModelsByProvider(activeProviderId);
        setModels(refreshedModels);

        if (activeModelId && deletedModelIdSet.has(activeModelId)) {
          const fallbackModelId = resolveEnabledModelSelection(refreshedModels);
          if (fallbackModelId) {
            setActiveModelId(fallbackModelId);
            await saveActiveSelection(activeProviderId, fallbackModelId);
          } else {
            setActiveModelId("");
            await saveActiveSelection(activeProviderId, "");
          }
        }

        if (editingModel && deletedModelIdSet.has(editingModel.id)) {
          setIsEditModelDialogOpen(false);
          setEditingModel(null);
        }
      } catch (error) {
        console.error("Failed to delete model group:", error);
        throw new Error("删除模型分组失败，请稍后重试");
      }
    },
    [
      activeModelId,
      activeProviderId,
      confirm,
      editingModel,
      loadModelsByProvider,
      removeModel,
      saveActiveSelection,
    ],
  );

  const handleCreateProvider = useCallback(
    async (formValues: AddProviderFormValues): Promise<void> => {
      const normalizedProviderName = formValues.providerName.trim();
      if (!normalizedProviderName) {
        throw new Error("提供商名称为必填项");
      }

      const duplicateName = providers.some(
        (provider) => provider.name.trim().toLowerCase() === normalizedProviderName.toLowerCase(),
      );
      if (duplicateName) {
        throw new Error("该提供商名称已存在");
      }

      const existingProviderIds = new Set(providers.map((provider) => provider.id.toLowerCase()));
      const providerId = buildUniqueProviderId(
        normalizedProviderName,
        formValues.providerType,
        existingProviderIds,
      );
      const providerIcon = normalizedProviderName.charAt(0).toUpperCase() || "P";

      const newProvider: Provider = {
        id: providerId,
        name: normalizedProviderName,
        icon: providerIcon,
        is_enabled: true,
        api_key: undefined,
        base_url: PROVIDER_TYPE_DEFAULT_BASE_URLS[formValues.providerType],
        provider_type: formValues.providerType,
      };

      try {
        await saveProvider(newProvider);
        const refreshedProviders = await ensureProvidersReady();
        setProviders(refreshedProviders);
        await loadProviderDetail(providerId, refreshedProviders, null);
      } catch (error) {
        console.error("Failed to add provider:", error);
        throw new Error("新增提供商失败，请稍后重试");
      }
    },
    [loadProviderDetail, providers, saveProvider],
  );

  const selectProvider = useCallback(
    async (providerId: string): Promise<void> => {
      await loadProviderDetail(providerId, providers, null);
    },
    [loadProviderDetail, providers],
  );

  const handleEditModelDialogOpenChange = useCallback((open: boolean): void => {
    setIsEditModelDialogOpen(open);
    if (!open) {
      setEditingModel(null);
    }
  }, []);

  const toggleShowApiKey = useCallback((): void => {
    setShowApiKey((previous) => !previous);
  }, []);

  return {
    activeModelId,
    activeProvider,
    activeProviderId,
    apiKey,
    baseUrl,
    editingModel,
    filteredProviders,
    handleAddRemoteModels,
    handleCreateModel,
    handleCreateProvider,
    handleDeleteModel,
    handleDeleteModelGroup,
    handleEditModelDialogOpenChange,
    handleSelectDefaultModel,
    handleTestConnection,
    handleToggleModel,
    handleToggleProvider,
    handleUpdateModel,
    isAddModelDialogOpen,
    isAddProviderDialogOpen,
    isEditModelDialogOpen,
    isManageModelsDialogOpen,
    isTesting,
    loading,
    modelGroups,
    models,
    openAddModelDialog,
    openAddProviderDialog,
    openEditModelDialog,
    providers,
    saving,
    searchQuery,
    selectProvider,
    setApiKey,
    setBaseUrl,
    setIsAddModelDialogOpen,
    setIsAddProviderDialogOpen,
    setIsManageModelsDialogOpen,
    setSearchQuery,
    showApiKey,
    toggleShowApiKey,
  };
}
