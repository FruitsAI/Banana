"use client";

import React, { useState, useMemo, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ViewIcon,
  AiBrain02Icon,
  Wrench01Icon,
  InternetIcon,
  AudioWave01Icon,
  Database01Icon,
} from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModelIcon as LobeModelIcon, ProviderIcon } from "@lobehub/icons";
import { getActiveModelSelection, ensureProvidersReady, inferModelCapabilities, setActiveModelSelection } from "@/lib/model-settings";
import { type Provider, type Model, getModelsByProvider } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getProviderIcon } from "@/components/icons/provider-icons";

interface ModelIconProps {
  modelName: string;
  className?: string;
  size?: number;
  showBorder?: boolean;
  showBackground?: boolean;
}

export function ModelIcon({
  modelName,
  className,
  size = 20,
  showBorder = true,
  showBackground = true,
}: ModelIconProps) {
  const n = modelName.toLowerCase();

  let brandColor = "var(--glass-border)";
  let bg = "transparent";

  // 色彩配置：定义品牌主色与背景辅助色
  if (n.includes("ollama")) {
    brandColor = "#222222";
    bg = "#2222221a";
  } else if (n.includes("nvidia")) {
    brandColor = "#76B900";
    bg = "#76B9001a";
  } else if (n.includes("qwen") || n.includes("tongyi")) {
    brandColor = "#615ced";
    bg = "#615ced1a";
  } else if (n.includes("glm") || n.includes("zhipu") || n.includes("z-ai")) {
    brandColor = "#345ff0";
    bg = "#345ff01a";
  } else if (n.includes("kimi") || n.includes("moonshot")) {
    brandColor = "#8b5cf6";
    bg = "#8b5cf61a";
  } else if (n.includes("minimax") || n.includes("abab")) {
    brandColor = "#ff4d4f";
    bg = "#ff4d4f1a";
  } else if (n.includes("llama") || n.includes("meta")) {
    brandColor = "#0668E1";
    bg = "#0668E11a";
  } else if (n.includes("mistral")) {
    brandColor = "#f36900";
    bg = "#f369001a";
  } else if (n.includes("doubao")) {
    brandColor = "#0066ff";
    bg = "#0066ff1a";
  } else if (n.includes("deepseek")) {
    brandColor = "#4d6bfe";
    bg = "#4d6bfe1a";
  } else if (n.includes("yi") || n.includes("01.ai") || n.includes("lingyi")) {
    brandColor = "#0033ff";
    bg = "#0033ff1a";
  } else if (n.includes("openai")) {
    brandColor = "#10a37f";
    bg = "#10a37f1a";
  } else if (n.includes("claude") || n.includes("anthropic")) {
    brandColor = "#d97757";
    bg = "#d977571a";
  } else if (n.includes("gemini") || n.includes("google")) {
    brandColor = "#4285f4";
    bg = "#4285f41a";
  }

  const containerSize = size + 12;
  const providerKey = getProviderIcon(modelName);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden transition-all duration-300",
        className
      )}
      style={{
        width: containerSize,
        height: containerSize,
        backgroundColor: showBackground
          ? bg !== "transparent"
            ? bg
            : "var(--glass-surface)"
          : "transparent",
        border: showBorder 
          ? `2px solid ${brandColor}` 
          : "1px solid var(--glass-border)",
        boxShadow: showBorder ? `0 0 0 1px ${brandColor}40` : "none",
      }}
    >
      {providerKey ? (
        <ProviderIcon provider={providerKey} size={size} type="color" />
      ) : (
        <LobeModelIcon model={modelName} size={size} />
      )}
    </div>
  );
}

export function ModelSelector({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let ignore = false;
    
    const loadData = async () => {
      try {
        const readyProviders = await ensureProvidersReady();
        if (ignore) return;
        setProviders(readyProviders);

        const activeSelection = await getActiveModelSelection();
        if (ignore) return;
        setActiveProviderId(activeSelection.activeProviderId);
        setActiveModelId(activeSelection.activeModelId);

        let allModels: Model[] = [];
        for (const p of readyProviders) {
          if (!p.is_enabled) continue;
          const pModels = await getModelsByProvider(p.id);
          allModels = [...allModels, ...pModels.filter((m: Model) => m.is_enabled)];
        }
        if (ignore) return;
        setModels(allModels);
      } catch (e) {
        console.error("Failed to load models for selector", e);
      }
    };

    loadData();
    return () => { ignore = true; };
  }, []);

  const handleSelect = async (providerId: string, modelId: string) => {
    setActiveProviderId(providerId);
    setActiveModelId(modelId);
    await setActiveModelSelection(providerId, modelId);
    window.dispatchEvent(new CustomEvent("refresh-active-model"));
    setOpen(false);
  };

  const filteredModels = useMemo(() => {
    let result = models;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
    }
    return result;
  }, [models, searchQuery]);

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups: Record<string, Model[]> = {};
    for (const model of filteredModels) {
      const providerId = model.provider_id;
      if (!groups[providerId]) {
        groups[providerId] = [];
      }
      groups[providerId].push(model);
    }
    return Object.entries(groups);
  }, [filteredModels]);

  const activeModel = useMemo(() => {
    return models.find((m) => m.id === activeModelId && m.provider_id === activeProviderId) || models[0];
  }, [models, activeModelId, activeProviderId]);

  const capabilityConfig: Record<string, { icon: unknown; color: string }> = {
    vision: { icon: ViewIcon, color: "var(--success)" },
    reasoning: { icon: AiBrain02Icon, color: "var(--brand-primary)" },
    tools: { icon: Wrench01Icon, color: "var(--warning)" },
    web: { icon: InternetIcon, color: "var(--brand-primary)" },
    audio: { icon: AudioWave01Icon, color: "var(--text-secondary)" },
    embedding: { icon: Database01Icon, color: "var(--text-secondary)" },
  };

  const capabilityOrder = ["vision", "reasoning", "tools", "web", "audio", "embedding"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled || models.length === 0}
          className="flex items-center justify-center h-8 sm:h-9 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200"
          style={{
            background: "var(--brand-primary-light)",
            color: "var(--brand-primary)",
            opacity: disabled || models.length === 0 ? 0.5 : 1,
            pointerEvents: disabled || models.length === 0 ? "none" : "auto",
            border: "1px solid var(--brand-primary-border)",
          }}
          role="button"
          tabIndex={0}
          aria-label="选择模型"
        >
          {activeModel ? activeModel.name : "加载模型..."}
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[450px] p-0 rounded-2xl border overflow-hidden" 
        style={{ 
          background: "var(--bg-elevated)", 
          borderColor: "var(--glass-border)",
          boxShadow: "var(--shadow-xl)",
        }}
        align="start"
        sideOffset={12}
      >
        <div className="p-3 border-b" style={{ borderColor: "var(--divider)" }}>
          <div className="search flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 border"
            style={{
              background: "var(--glass-surface)",
              borderColor: "var(--glass-border)",
            }}
          >
            <HugeiconsIcon icon={Search01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
            <input
              placeholder="搜索模型..."
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: "var(--text-primary)" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pl-1">
            <span className="text-xs mr-2 font-medium" style={{ color: "var(--text-tertiary)" }}>按标签筛选</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "var(--glass-subtle)", color: "var(--text-secondary)" }}>
              <HugeiconsIcon icon={ViewIcon} size={12} /> 视觉
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "var(--glass-subtle)", color: "var(--text-secondary)" }}>
              <HugeiconsIcon icon={AiBrain02Icon} size={12} /> 推理
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "var(--glass-subtle)", color: "var(--text-secondary)" }}>
              <HugeiconsIcon icon={Wrench01Icon} size={12} /> 工具
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "var(--glass-subtle)", color: "var(--text-secondary)" }}>
              <HugeiconsIcon icon={InternetIcon} size={12} /> 联网
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "var(--glass-subtle)", color: "var(--text-secondary)" }}>
              免费
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: "350px" }}>
          {groupedModels.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--text-tertiary)" }}>
              {searchQuery ? "没有找到匹配的模型" : "暂无可用模型，请前往设置开启"}
            </div>
          ) : (
            groupedModels.map(([providerId, groupModels]) => {
                const provider = providers.find(p => p.id === providerId);
                const displayName = provider ? provider.name : providerId;
                
                return (
                  <div key={providerId} className="py-2">
                    <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2" 
                      style={{ color: "var(--text-tertiary)" }}>
                      {displayName}
                    </div>
                    <div>
                      {groupModels.map(model => {
                        const isSelected = activeModelId === model.id && activeProviderId === model.provider_id;
                        return (
                          <div
                            key={model.id}
                            onClick={() => handleSelect(model.provider_id, model.id)}
                            className="group flex items-center justify-between px-4 py-2.5 mx-2 rounded-xl cursor-pointer transition-colors"
                            style={{
                              background: isSelected ? "var(--brand-primary-light)" : "transparent",
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ModelIcon modelName={model.id} />
                              <div className="truncate text-sm font-medium" style={{ color: isSelected ? "var(--brand-primary)" : "var(--text-primary)" }}>
                                {model.name}
                              </div>
                            </div>
                            
                            {(() => {
                              const resolvedCapabilities =
                                model.capabilities && model.capabilities.length > 0
                                  ? model.capabilities
                                  : inferModelCapabilities(model.provider_id, model.id);
                              const displayCapabilities = capabilityOrder.filter((capability) =>
                                resolvedCapabilities.includes(capability)
                              );
                              if (displayCapabilities.length === 0) {
                                return null;
                              }
                              return (
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                  {displayCapabilities.map((capability) => {
                                    const config = capabilityConfig[capability];
                                    if (!config) {
                                      return null;
                                    }
                                    return (
                                      <div
                                        key={capability}
                                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                        style={{
                                          background: isSelected ? "var(--bg-white)" : "var(--glass-subtle)",
                                          color: config.color,
                                        }}
                                      >
                                        <HugeiconsIcon icon={config.icon} size={12} />
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
