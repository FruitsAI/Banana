"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CollapsiblePanel } from "@/components/ui/collapsible-panel";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Add01Icon,
  ViewIcon,
  ViewOffIcon,
  Edit03Icon,
  Delete01Icon,
  Settings01Icon,
  ListSettingIcon,
} from "@hugeicons/core-free-icons";
import {
  type Model,
  type Provider,
  deleteModel,
  getModelsByProvider,
  setConfig,
  upsertModel,
  upsertProvider,
} from "@/lib/db";
import {
  ensureProviderModelsReady,
  ensureProvidersReady,
  filterProviders,
  getActiveModelSelection,
  setActiveModelSelection,
} from "@/lib/model-settings";
import {
  AddModelDialog,
  type AddModelFormValues,
} from "@/components/models/add-model-dialog";
import {
  AddProviderDialog,
  type AddProviderFormValues,
  type ProviderType,
} from "@/components/providers/add-provider-dialog";
import { useConfirm } from "@/components/feedback/feedback-provider";
import { getProviderIcon } from "@/components/icons/provider-icons";

const PROVIDER_BADGE_COLORS: Record<string, string> = {
  openai: "#10A37F",
  anthropic: "#A86F41",
  gemini: "#1A73E8",
  openrouter: "#5A4FCF",
  ollama: "#222222",
  nvidia: "#76B900",
};

const PROVIDER_TYPE_DEFAULT_BASE_URLS: Record<ProviderType, string | undefined> = {
  openai: "https://api.openai.com/v1",
  "openai-response": "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  anthropic: "https://api.anthropic.com/v1",
  "new-api": undefined,
  ollama: "http://localhost:11434/v1",
};

/**
 * 获取 Provider 徽标底色。
 * @param providerId - 供应商标识
 * @returns 颜色值
 */
function getProviderBadgeColor(providerId: string): string {
  return PROVIDER_BADGE_COLORS[providerId] ?? "var(--brand-primary)";
}

function normalizeProviderId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildUniqueProviderId(name: string, type: ProviderType, existingIds: Set<string>): string {
  const baseId = normalizeProviderId(name) || normalizeProviderId(type) || "provider";
  let candidate = baseId;
  let suffix = 2;
  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/**
 * ModelsSetting 组件（保持原版布局，接入真实前后端数据）。
 */
export function ModelsSetting() {
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
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const confirm = useConfirm();

  const activeProvider = useMemo(
    () => providers.find((provider) => provider.id === activeProviderId) ?? null,
    [providers, activeProviderId]
  );

  const filteredProviders = useMemo(
    () => filterProviders(providers, searchQuery),
    [providers, searchQuery]
  );

  const modelGroups = useMemo(() => {
    const groups: Record<string, Model[]> = {};
    for (const model of models) {
      const groupName = model.group_name || model.provider_id;
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(model);
    }
    return Object.entries(groups);
  }, [models]);

  /**
   * 加载指定 Provider 的配置与模型。
   * @param providerId - 目标 Provider id
   * @param providerSnapshot - Provider 快照
   * @param preferredModelId - 可选的优先模型
   */
  const loadProviderDetail = useCallback(
    async (
      providerId: string,
      providerSnapshot: Provider[],
      preferredModelId: string | null
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

      if (providerModels.length === 0) {
        setActiveModelId("");
        await Promise.all([setConfig("active_provider_id", provider.id), setConfig("active_model_id", "")]);
        return;
      }

      const canUsePreferred = preferredModelId
        ? providerModels.some((model) => model.id === preferredModelId)
        : false;
      const nextModelId = canUsePreferred ? preferredModelId! : providerModels[0].id;
      setActiveModelId(nextModelId);
      await setActiveModelSelection(provider.id, nextModelId);
    },
    []
  );

  /**
   * 初始化模型设置页数据。
   */
  const bootstrap = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [readyProviders, activeSelection] = await Promise.all([
        ensureProvidersReady(),
        getActiveModelSelection(),
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
  }, [loadProviderDetail]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // 自动保存逻辑 (防抖)
  useEffect(() => {
    if (!activeProvider) return;

    // 比较去除空格后的值，若与已保存的相同则跳过
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
      upsertProvider(updatedProvider)
        .then(() => {
          setProviders((prev) =>
            prev.map((p) => (p.id === updatedProvider.id ? updatedProvider : p))
          );
        })
        .catch((error) => console.error("Auto-save failed:", error))
        .finally(() => setSaving(false));
    }, 800);

    return () => clearTimeout(timer);
  }, [apiKey, baseUrl, activeProvider]);

  /**
   * 保存当前 Provider 配置。
   */
  async function handleSave(): Promise<void> {
    if (!activeProvider) {
      return;
    }

    try {
      setSaving(true);
      const updatedProvider: Provider = {
        ...activeProvider,
        api_key: apiKey.trim() || undefined,
        base_url: baseUrl.trim() || undefined,
      };
      await upsertProvider(updatedProvider);
      setProviders((previousProviders) =>
        previousProviders.map((provider) =>
          provider.id === updatedProvider.id ? updatedProvider : provider
        )
      );
    } catch (error) {
      console.error("Failed to save models config:", error);
    } finally {
      setSaving(false);
    }
  }

  /**
   * 切换 Provider 启用状态。
   * @param checked - 是否启用
   */
  async function handleToggleProvider(checked: boolean): Promise<void> {
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
      await upsertProvider(updatedProvider);
      setProviders((previousProviders) =>
        previousProviders.map((provider) =>
          provider.id === updatedProvider.id ? updatedProvider : provider
        )
      );
    } catch (error) {
      console.error("Failed to toggle provider:", error);
    }
  }

  /**
   * 切换模型启用状态。
   * @param model - 模型对象
   * @param checked - 是否启用
   */
  async function handleToggleModel(model: Model, checked: boolean): Promise<void> {
    try {
      const nextModel: Model = {
        ...model,
        is_enabled: checked,
      };
      await upsertModel(nextModel);
      const nextModels = models.map((item) => (item.id === nextModel.id ? nextModel : item));
      setModels(nextModels);

      if (!checked && activeModelId === model.id) {
        const fallbackModel =
          nextModels.find((item) => item.is_enabled && item.id !== model.id) ??
          nextModels.find((item) => item.id !== model.id) ??
          null;

        if (fallbackModel) {
          setActiveModelId(fallbackModel.id);
          await setActiveModelSelection(activeProviderId, fallbackModel.id);
        } else {
          setActiveModelId("");
          await Promise.all([setConfig("active_provider_id", activeProviderId), setConfig("active_model_id", "")]);
        }
      }
    } catch (error) {
      console.error("Failed to toggle model:", error);
    }
  }

  /**
   * 设置默认模型。
   * @param modelId - 模型 id
   */
  async function handleSelectDefaultModel(modelId: string): Promise<void> {
    try {
      setActiveModelId(modelId);
      await setActiveModelSelection(activeProviderId, modelId);
    } catch (error) {
      console.error("Failed to set default model:", error);
    }
  }

  function openAddModelDialog(): void {
    setIsAddModelDialogOpen(true);
  }

  function openAddProviderDialog(): void {
    setIsAddProviderDialogOpen(true);
  }

  function openEditModelDialog(model: Model): void {
    setEditingModel(model);
    setIsEditModelDialogOpen(true);
  }

  /**
   * 新增模型（通过弹窗表单录入）。
   */
  async function handleCreateModel(formValues: AddModelFormValues): Promise<void> {
    if (!activeProviderId) {
      throw new Error("请先选择模型平台");
    }

    const normalizedModelId = formValues.modelId.trim();
    if (!normalizedModelId) {
      throw new Error("模型 ID 为必填项");
    }

    const hasDuplicate = models.some(
      (model) => model.id.toLowerCase() === normalizedModelId.toLowerCase()
    );
    if (hasDuplicate) {
      throw new Error("该模型 ID 已存在");
    }

    const normalizedModelName = formValues.modelName.trim() || normalizedModelId;
    const normalizedGroupName = formValues.groupName.trim();

    try {
      const newModel: Model = {
        id: normalizedModelId,
        provider_id: activeProviderId,
        name: normalizedModelName,
        is_enabled: true,
        group_name: normalizedGroupName || null,
      };

      await upsertModel(newModel);
      const refreshedModels = await getModelsByProvider(activeProviderId);
      setModels(refreshedModels);

      if (!activeModelId) {
        setActiveModelId(normalizedModelId);
        await setActiveModelSelection(activeProviderId, normalizedModelId);
      }
    } catch (error) {
      console.error("Failed to add model:", error);
      throw new Error("新增模型失败，请稍后重试");
    }
  }

  /**
   * 修改模型（通过弹窗表单录入）。
   */
  async function handleUpdateModel(formValues: AddModelFormValues): Promise<void> {
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
        model.id.toLowerCase() !== editingIdLower
    );
    if (hasDuplicate) {
      throw new Error("该模型 ID 已存在");
    }

    const normalizedModelName = formValues.modelName.trim() || normalizedModelId;
    const normalizedGroupName = formValues.groupName.trim();

    try {
      const nextModel: Model = {
        ...editingModel,
        id: normalizedModelId,
        provider_id: activeProviderId,
        name: normalizedModelName,
        group_name: normalizedGroupName || null,
      };

      if (normalizedModelId !== editingModel.id) {
        await deleteModel(editingModel.id);
      }
      await upsertModel(nextModel);

      const refreshedModels = await getModelsByProvider(activeProviderId);
      setModels(refreshedModels);

      if (activeModelId === editingModel.id) {
        setActiveModelId(normalizedModelId);
        await setActiveModelSelection(activeProviderId, normalizedModelId);
      }

      setEditingModel(nextModel);
    } catch (error) {
      console.error("Failed to update model:", error);
      throw new Error("修改模型失败，请稍后重试");
    }
  }

  async function handleDeleteModel(model: Model): Promise<void> {
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
      await deleteModel(model.id);
      const refreshedModels = await getModelsByProvider(activeProviderId);
      setModels(refreshedModels);

      if (activeModelId === model.id) {
        const fallbackModel = refreshedModels.find((item) => item.is_enabled) ?? refreshedModels[0] ?? null;
        if (fallbackModel) {
          setActiveModelId(fallbackModel.id);
          await setActiveModelSelection(activeProviderId, fallbackModel.id);
        } else {
          setActiveModelId("");
          await Promise.all([setConfig("active_provider_id", activeProviderId), setConfig("active_model_id", "")]);
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
  }

  async function handleDeleteModelGroup(groupName: string, groupModels: Model[]): Promise<void> {
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
      await Promise.all(groupModels.map((model) => deleteModel(model.id)));
      const refreshedModels = await getModelsByProvider(activeProviderId);
      setModels(refreshedModels);

      if (activeModelId && deletedModelIdSet.has(activeModelId)) {
        const fallbackModel = refreshedModels.find((item) => item.is_enabled) ?? refreshedModels[0] ?? null;
        if (fallbackModel) {
          setActiveModelId(fallbackModel.id);
          await setActiveModelSelection(activeProviderId, fallbackModel.id);
        } else {
          setActiveModelId("");
          await Promise.all([setConfig("active_provider_id", activeProviderId), setConfig("active_model_id", "")]);
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
  }

  async function handleCreateProvider(formValues: AddProviderFormValues): Promise<void> {
    const normalizedProviderName = formValues.providerName.trim();
    if (!normalizedProviderName) {
      throw new Error("提供商名称为必填项");
    }

    const duplicateName = providers.some(
      (provider) => provider.name.trim().toLowerCase() === normalizedProviderName.toLowerCase()
    );
    if (duplicateName) {
      throw new Error("该提供商名称已存在");
    }

    const existingProviderIds = new Set(providers.map((provider) => provider.id.toLowerCase()));
    const providerId = buildUniqueProviderId(
      normalizedProviderName,
      formValues.providerType,
      existingProviderIds
    );
    const providerIcon = normalizedProviderName.charAt(0).toUpperCase() || "P";

    const newProvider: Provider = {
      id: providerId,
      name: normalizedProviderName,
      icon: providerIcon,
      is_enabled: true,
      api_key: undefined,
      base_url: PROVIDER_TYPE_DEFAULT_BASE_URLS[formValues.providerType],
    };

    try {
      await upsertProvider(newProvider);
      const refreshedProviders = await ensureProvidersReady();
      setProviders(refreshedProviders);
      await loadProviderDetail(providerId, refreshedProviders, null);
    } catch (error) {
      console.error("Failed to add provider:", error);
      throw new Error("新增提供商失败，请稍后重试");
    }
  }

  return (
    <div className="flex h-full w-full">
      <div
        className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full border-r"
        style={{
          background: "var(--bg-sidebar)",
          borderColor: "var(--divider)",
        }}
      >
        <div className="p-3 border-b" style={{ borderColor: "var(--divider)" }}>
          <div className="relative">
            <div
              className="search flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{
                background: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            >
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="flex-shrink-0"
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索模型平台..."
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "var(--text-primary)" }}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scroll">
          {filteredProviders.map((provider) => {
            const isActive = activeProviderId === provider.id;
            return (
              <motion.button
                key={provider.id}
                onClick={() => void loadProviderDetail(provider.id, providers, null)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-all duration-200 border"
                style={{
                  background: isActive ? "var(--brand-primary-lighter)" : "transparent",
                  borderColor: isActive ? "var(--brand-primary-border)" : "transparent",
                }}
                whileHover={{
                  background: isActive ? "var(--brand-primary-light)" : "var(--glass-subtle)",
                }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: getProviderBadgeColor(provider.id) }}
                  >
                    {(() => {
                      const Icon = getProviderIcon(provider.id);
                      return Icon ? <Icon className="w-3.5 h-3.5" /> : provider.icon;
                    })()}
                  </div>
                  <span
                    className="font-medium truncate max-w-[100px] text-left"
                    style={{ color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}
                  >
                    {provider.name}
                  </span>
                </div>

                {provider.is_enabled && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0"
                    style={{
                      borderColor: "var(--success)",
                      color: "var(--success)",
                    }}
                  >
                    ON
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="p-3 border-t" style={{ borderColor: "var(--divider)" }}>
          <Button
            variant="outline"
            className="w-full justify-center h-9 rounded-xl text-xs border"
            style={{
              background: "var(--glass-surface)",
              borderColor: "var(--glass-border)",
            }}
            onClick={openAddProviderDialog}
          >
            <HugeiconsIcon icon={Add01Icon} size={16} className="mr-1.5" />
            添加
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--divider)" }}>
          <div className="flex items-center gap-2">
            {activeProvider && (() => {
               const Icon = getProviderIcon(activeProvider.id);
               return (
                 <div
                   className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                   style={{ background: getProviderBadgeColor(activeProvider.id) }}
                 >
                   {Icon ? <Icon className="w-3.5 h-3.5" /> : activeProvider.icon}
                 </div>
               );
             })()}
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {activeProvider?.name ?? "模型设置"}
            </h2>
            <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
          </div>
          <Switch
            checked={Boolean(activeProvider?.is_enabled)}
            onCheckedChange={(checked) => void handleToggleProvider(checked)}
            disabled={!activeProvider}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scroll">
          {loading ? (
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              正在加载模型配置...
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>
                    API 密钥
                  </Label>
                  <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div className="flex gap-2 relative">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      className="font-mono text-xs pr-10"
                      placeholder="请输入 API Key"
                    />
                    <button
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-tertiary)" }}
                      aria-label="切换 API Key 显示状态"
                      onClick={() => setShowApiKey((previous) => !previous)}
                    >
                      <HugeiconsIcon icon={showApiKey ? ViewOffIcon : ViewIcon} size={16} />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    className="px-4 shrink-0 h-10 rounded-xl border"
                    style={{
                      background: "var(--glass-surface)",
                      borderColor: "var(--glass-border)",
                    }}
                    onClick={() => void handleSave()}
                    disabled={saving || !activeProvider}
                  >
                    检测
                  </Button>
                </div>
                <div className="text-right">
                  <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    多个密钥使用逗号分隔
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-[13px] flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    API 地址
                    <span className="text-[10px] px-1 py-0.5 rounded border" style={{ borderColor: "var(--glass-border)", color: "var(--text-tertiary)" }}>↕</span>
                    <span style={{ color: "var(--text-tertiary)" }}>ⓘ</span>
                  </Label>
                  <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <Input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  className="font-mono text-xs"
                />
                <div>
                  <span className="text-[11px] flex gap-2" style={{ color: "var(--text-tertiary)" }}>
                    <span>预览:</span>
                    <span className="truncate opacity-50">
                      {baseUrl.trim()
                        ? `${baseUrl.trim()}/chat/completions`
                        : "请先填写 API 地址"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t" style={{ borderColor: "var(--divider)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>模型</Label>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "var(--glass-subtle)", color: "var(--text-tertiary)" }}
                    >
                      {models.length}
                    </span>
                    <HugeiconsIcon icon={Search01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                  <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
                </div>

                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "var(--glass-surface)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  {modelGroups.length === 0 ? (
                    <div className="p-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                      当前 Provider 尚未配置模型
                    </div>
                  ) : (
                    modelGroups.map(([groupName, groupModels]) => (
                      <CollapsiblePanel
                        key={groupName}
                        defaultOpen={true}
                        title={groupName}
                        iconColor="var(--brand-primary)"
                        className="group/panel rounded-none border-0"
                        headerStyle={{
                          background: "var(--glass-overlay)",
                          color: "var(--brand-primary)",
                          borderBottom: "1px solid var(--divider)",
                        }}
                        headerActions={
                          <button
                            type="button"
                            className="rounded-md p-1 opacity-0 transition-opacity duration-150 group-hover/panel:opacity-100 hover:opacity-100"
                            style={{ color: "var(--danger)" }}
                            onClick={() => void handleDeleteModelGroup(groupName, groupModels)}
                            aria-label={`删除分组 ${groupName}`}
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={14} />
                          </button>
                        }
                      >
                        {groupModels.map((model) => {
                          const isDefaultModel = activeModelId === model.id;
                          return (
                            <div
                              key={model.id}
                              className="flex items-center justify-between p-3 pl-8 border-b last:border-0"
                              style={{
                                background: "var(--bg-primary)",
                                borderColor: "var(--divider)"
                              }}
                            >
                              <button
                                className="flex items-center gap-3 min-w-0 text-left"
                                onClick={() => void handleSelectDefaultModel(model.id)}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                  style={{
                                    background: isDefaultModel ? "var(--brand-primary)" : "var(--glass-border-strong)",
                                  }}
                                >
                                  {isDefaultModel ? (
                                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-[10px] font-bold" style={{ color: "var(--text-tertiary)" }}>
                                      {model.id.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{model.name}</div>
                                  <div className="text-[11px] truncate opacity-50" style={{ color: "var(--text-tertiary)" }}>{model.id}</div>
                                </div>
                              </button>
                              <div className="flex items-center gap-3 shrink-0 px-2">
                                <button
                                  className="opacity-50 hover:opacity-100 transition-opacity"
                                  style={{ color: "var(--text-tertiary)" }}
                                  onClick={() => openEditModelDialog(model)}
                                  aria-label={`编辑模型 ${model.id}`}
                                >
                                  <HugeiconsIcon icon={Edit03Icon} size={16} />
                                </button>
                                <button
                                  className="opacity-70 hover:opacity-100 transition-opacity"
                                  style={{ color: "var(--danger)" }}
                                  onClick={() => void handleDeleteModel(model)}
                                  aria-label={`删除模型 ${model.id}`}
                                >
                                  <HugeiconsIcon icon={Delete01Icon} size={16} />
                                </button>
                                <Switch
                                  checked={model.is_enabled}
                                  onCheckedChange={(checked) => void handleToggleModel(model, checked)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </CollapsiblePanel>
                    ))
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    size="sm"
                    className="h-9 rounded-xl text-xs font-medium px-4 border-0"
                    style={{
                      background: "var(--brand-primary)",
                      color: "#fff",
                    }}
                    onClick={() => {
                      const fallbackModel = models.find((model) => model.is_enabled) ?? models[0];
                      if (fallbackModel) {
                        void handleSelectDefaultModel(fallbackModel.id);
                      }
                    }}
                  >
                    <HugeiconsIcon icon={ListSettingIcon} size={14} className="mr-1.5" /> 管理
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl text-xs px-4 border"
                    style={{
                      background: "var(--glass-surface)",
                      borderColor: "var(--glass-border)",
                    }}
                    onClick={openAddModelDialog}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" /> 添加
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <AddProviderDialog
        open={isAddProviderDialogOpen}
        onOpenChange={setIsAddProviderDialogOpen}
        existingProviderNames={providers.map((provider) => provider.name)}
        onSubmitProvider={handleCreateProvider}
      />
      <AddModelDialog
        open={isAddModelDialogOpen}
        onOpenChange={setIsAddModelDialogOpen}
        existingModelIds={models.map((model) => model.id)}
        disabled={!activeProviderId}
        onSubmitModel={handleCreateModel}
      />
      <AddModelDialog
        mode="edit"
        open={isEditModelDialogOpen}
        onOpenChange={(open) => {
          setIsEditModelDialogOpen(open);
          if (!open) {
            setEditingModel(null);
          }
        }}
        initialValues={
          editingModel
            ? {
                modelId: editingModel.id,
                modelName: editingModel.name,
                groupName: editingModel.group_name ?? "",
              }
            : undefined
        }
        excludeModelId={editingModel?.id ?? null}
        existingModelIds={models.map((model) => model.id)}
        disabled={!activeProviderId || !editingModel}
        onSubmitModel={handleUpdateModel}
      />
    </div>
  );
}
