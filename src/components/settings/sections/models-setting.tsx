"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Add01Icon,
  ViewIcon,
  ViewOffIcon,
  Settings01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { type Model, type Provider, getModelsByProvider, setConfig, upsertModel, upsertProvider } from "@/lib/db";
import {
  ensureProviderModelsReady,
  ensureProvidersReady,
  filterProviders,
  getActiveModelSelection,
  setActiveModelSelection,
} from "@/lib/model-settings";

const PROVIDER_BADGE_COLORS: Record<string, string> = {
  openai: "#10A37F",
  anthropic: "#A86F41",
  gemini: "#1A73E8",
  openrouter: "#5A4FCF",
  ollama: "#222222",
  nvidia: "#76B900",
  octopus: "#3E5CDB",
  antiapi: "#4B3B6F",
  cherryin: "#FF4F64",
};

/**
 * 获取 Provider 徽标底色。
 * @param providerId - 供应商标识
 * @returns 颜色值
 */
function getProviderBadgeColor(providerId: string): string {
  return PROVIDER_BADGE_COLORS[providerId] ?? "var(--brand-primary)";
}

/**
 * 获取 Provider 默认 Base URL（仅用于输入框空值回退展示）。
 * @param providerId - 供应商标识
 * @returns 默认 URL
 */
function getProviderDefaultBaseUrl(providerId: string): string {
  if (providerId === "openai") {
    return "https://api.openai.com/v1";
  }
  return "https://api.example.com/v1";
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
      const groupName = model.name.includes("/") ? model.name.split("/")[0] : model.provider_id;
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
      setBaseUrl(provider.base_url ?? getProviderDefaultBaseUrl(provider.id));

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

  /**
   * 新增模型（通过 prompt 交互，保持原布局不变）。
   */
  async function handleAddModel(): Promise<void> {
    if (!activeProviderId) {
      return;
    }

    const modelName = window.prompt("请输入模型名称（例如：gpt-4o-mini）");
    const normalizedModelName = (modelName ?? "").trim();
    if (!normalizedModelName) {
      return;
    }

    const hasDuplicate = models.some(
      (model) => model.id.toLowerCase() === normalizedModelName.toLowerCase()
    );
    if (hasDuplicate) {
      return;
    }

    try {
      await upsertModel({
        id: normalizedModelName,
        provider_id: activeProviderId,
        name: normalizedModelName,
        is_enabled: true,
      });

      const refreshedModels = await getModelsByProvider(activeProviderId);
      setModels(refreshedModels);

      if (!activeModelId) {
        setActiveModelId(normalizedModelName);
        await setActiveModelSelection(activeProviderId, normalizedModelName);
      }
    } catch (error) {
      console.error("Failed to add model:", error);
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
                    {provider.icon}
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
          >
            <HugeiconsIcon icon={Add01Icon} size={16} className="mr-1.5" />
            添加
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--divider)" }}>
          <div className="flex items-center gap-2">
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
                      {(baseUrl || getProviderDefaultBaseUrl(activeProviderId))}/chat/completions
                    </span>
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => void handleSave()}
                    disabled={saving || !activeProvider}
                    size="sm"
                    className="h-9 rounded-xl px-4"
                  >
                    {saving ? "保存中..." : "保存专属配置"}
                  </Button>
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
                    modelGroups.map(([groupName, groupModels], groupIndex) => (
                      <div
                        key={groupName}
                        style={{
                          borderBottom:
                            groupIndex < modelGroups.length - 1 ? "1px solid var(--divider)" : "none",
                        }}
                      >
                        <button
                          className="w-full flex items-center gap-2 p-3 text-sm font-medium transition-colors"
                          style={{
                            background: "rgba(59, 130, 246, 0.08)",
                            color: "var(--brand-primary)",
                          }}
                        >
                          <HugeiconsIcon icon={ArrowDown01Icon} size={16} style={{ color: "var(--brand-primary)" }} />
                          {groupName}
                        </button>

                        {groupModels.map((model) => {
                          const isDefaultModel = activeModelId === model.id;
                          return (
                            <div
                              key={model.id}
                              className="flex items-center justify-between p-3 pl-8"
                              style={{ background: "var(--bg-primary)" }}
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
                                  <span className="text-[10px] font-bold text-white">
                                    {isDefaultModel ? "✓" : model.name.slice(0, 1).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                  {model.name}
                                </span>
                              </button>
                              <div className="flex items-center gap-3" style={{ color: "var(--text-tertiary)" }}>
                                <HugeiconsIcon icon={Settings01Icon} size={16} className="cursor-pointer hover:text-foreground" />
                                <Switch
                                  checked={model.is_enabled}
                                  onCheckedChange={(checked) => void handleToggleModel(model, checked)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                    <span className="mr-1.5">☰</span> 管理
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl text-xs px-4 border"
                    style={{
                      background: "var(--glass-surface)",
                      borderColor: "var(--glass-border)",
                    }}
                    onClick={() => void handleAddModel()}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" /> 添加
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
