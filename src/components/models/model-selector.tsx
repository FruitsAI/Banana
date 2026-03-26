"use client";

import React, { useState, useMemo, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  AiBrain02Icon,
  Wrench01Icon,
  InternetIcon,
  AudioWave01Icon,
  Database01Icon,
} from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModelIcon as LobeModelIcon, ProviderIcon } from "@lobehub/icons";
import { ensureProvidersReady, inferModelCapabilities } from "@/lib/model-settings";
import type { Model, Provider } from "@/domain/models/types";
import { cn } from "@/lib/utils";
import { getProviderIcon } from "@/components/icons/provider-icons";
import { useModelsStore } from "@/stores/models/useModelsStore";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { SearchInput } from "@/components/ui/search-input";

const CAPABILITY_CONFIG: Record<string, { icon: typeof ViewIcon; color: string }> = {
  vision: { icon: ViewIcon, color: "var(--success)" },
  reasoning: { icon: AiBrain02Icon, color: "var(--brand-primary)" },
  tools: { icon: Wrench01Icon, color: "var(--warning)" },
  web: { icon: InternetIcon, color: "var(--brand-primary)" },
  audio: { icon: AudioWave01Icon, color: "var(--icon-secondary)" },
  embedding: { icon: Database01Icon, color: "var(--icon-secondary)" },
};

const CAPABILITY_LABELS: Record<string, string> = {
  vision: "视觉",
  reasoning: "推理",
  tools: "工具",
  web: "联网",
  audio: "音频",
  embedding: "向量",
};

const CAPABILITY_ORDER = ["vision", "reasoning", "tools", "web", "audio", "embedding"];

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
  const blendSurface = (color: string) =>
    `color-mix(in srgb, ${color} 18%, var(--material-content-background))`;

  let brandColor = "var(--material-content-border)";
  let bg = "var(--material-content-background)";

  // 色彩配置：定义品牌主色与背景辅助色
  if (n.includes("ollama")) {
    brandColor = "#222222";
    bg = blendSurface(brandColor);
  } else if (n.includes("nvidia")) {
    brandColor = "#76B900";
    bg = blendSurface(brandColor);
  } else if (n.includes("qwen") || n.includes("tongyi")) {
    brandColor = "#615ced";
    bg = blendSurface(brandColor);
  } else if (n.includes("glm") || n.includes("zhipu") || n.includes("z-ai")) {
    brandColor = "#345ff0";
    bg = blendSurface(brandColor);
  } else if (n.includes("kimi") || n.includes("moonshot")) {
    brandColor = "#8b5cf6";
    bg = blendSurface(brandColor);
  } else if (n.includes("minimax") || n.includes("abab")) {
    brandColor = "#ff4d4f";
    bg = blendSurface(brandColor);
  } else if (n.includes("llama") || n.includes("meta")) {
    brandColor = "#0668E1";
    bg = blendSurface(brandColor);
  } else if (n.includes("mistral")) {
    brandColor = "#f36900";
    bg = blendSurface(brandColor);
  } else if (n.includes("doubao")) {
    brandColor = "#0066ff";
    bg = blendSurface(brandColor);
  } else if (n.includes("deepseek")) {
    brandColor = "#4d6bfe";
    bg = blendSurface(brandColor);
  } else if (n.includes("yi") || n.includes("01.ai") || n.includes("lingyi")) {
    brandColor = "#0033ff";
    bg = blendSurface(brandColor);
  } else if (n.includes("openai")) {
    brandColor = "#10a37f";
    bg = blendSurface(brandColor);
  } else if (n.includes("claude") || n.includes("anthropic")) {
    brandColor = "#d97757";
    bg = blendSurface(brandColor);
  } else if (n.includes("gemini") || n.includes("google")) {
    brandColor = "#4285f4";
    bg = blendSurface(brandColor);
  }

  const containerSize = size + 12;
  const providerKey = getProviderIcon(modelName);
  const defaultBorder = "color-mix(in srgb, var(--material-content-border) 72%, rgba(255,255,255,0.7))";
  const highlightShadow = `0 0 0 1px color-mix(in srgb, ${brandColor} 40%, rgba(0,0,0,0.12))`;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden transition-all duration-300",
        className
      )}
      style={{
        width: containerSize,
        height: containerSize,
        backgroundColor: showBackground ? bg : "transparent",
        border: showBorder ? `2px solid ${brandColor}` : `1px solid ${defaultBorder}`,
        boxShadow: showBorder ? highlightShadow : "none",
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
  const { loadActiveSelection, loadModelsByProvider, saveActiveSelection } = useModelsStore();
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

        const activeSelection = await loadActiveSelection();
        if (ignore) return;
        setActiveProviderId(activeSelection.activeProviderId);
        setActiveModelId(activeSelection.activeModelId);

        let allModels: Model[] = [];
        for (const p of readyProviders) {
          if (!p.is_enabled) continue;
          const pModels = await loadModelsByProvider(p.id);
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
  }, [loadActiveSelection, loadModelsByProvider]);

  const handleSelect = async (providerId: string, modelId: string) => {
    setActiveProviderId(providerId);
    setActiveModelId(modelId);
    await saveActiveSelection(providerId, modelId);
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

  const visibleCapabilities = useMemo(() => {
    const availableCapabilities = new Set<string>();

    for (const model of filteredModels) {
      const resolvedCapabilities =
        model.capabilities && model.capabilities.length > 0
          ? model.capabilities
          : inferModelCapabilities(model.provider_id, model.id);

      for (const capability of resolvedCapabilities) {
        if (CAPABILITY_CONFIG[capability]) {
          availableCapabilities.add(capability);
        }
      }
    }

    return CAPABILITY_ORDER.filter((capability) => availableCapabilities.has(capability));
  }, [filteredModels]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled || models.length === 0}
          className="material-interactive flex items-center justify-center h-8 sm:h-9 px-3.5 rounded-2xl text-xs font-semibold cursor-pointer border"
          style={{
            ...getMaterialSurfaceStyle("accent", "sm"),
            color: activeModel
              ? "var(--selection-active-foreground, var(--brand-primary))"
              : "var(--text-secondary)",
            opacity: disabled || models.length === 0 ? 0.5 : 1,
            pointerEvents: disabled || models.length === 0 ? "none" : "auto",
          }}
          data-testid="model-selector-trigger"
          data-trigger-shape="pill"
          data-hover-surface="accent"
          role="button"
          tabIndex={0}
          aria-label="选择模型"
        >
          {activeModel ? activeModel.name : "加载模型..."}
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[450px] p-0 rounded-[24px] border overflow-hidden" 
        style={{ 
          ...getMaterialSurfaceStyle("floating", "lg"),
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
        }}
        align="start"
        sideOffset={10}
        data-testid="model-selector-popover"
        data-material-role="floating"
        data-surface-clarity="high"
      >
        <div className="p-3 border-b" style={{ borderColor: "var(--divider)" }}>
          <SearchInput
            containerClassName="w-full"
            placeholder="搜索模型..."
            surface="floating"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {visibleCapabilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pl-1">
              <span className="text-xs mr-2 font-medium" style={{ color: "var(--text-secondary)" }}>能力标签</span>
              {visibleCapabilities.map((capability) => {
                const config = CAPABILITY_CONFIG[capability];
                if (!config) {
                  return null;
                }

                return (
                <div
                    key={capability}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]"
                    style={{
                      background:
                        "color-mix(in srgb, var(--material-content-background) 94%, rgba(15, 23, 42, 0.12))",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--material-content-border)",
                    }}
                  >
                    <HugeiconsIcon icon={config.icon} size={12} /> {CAPABILITY_LABELS[capability] ?? capability}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: "350px" }}>
          {groupedModels.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--text-secondary)" }}>
              {searchQuery ? "没有找到匹配的模型" : "暂无可用模型，请前往设置开启"}
            </div>
          ) : (
            groupedModels.map(([providerId, groupModels]) => {
                const provider = providers.find(p => p.id === providerId);
                const displayName = provider ? provider.name : providerId;
                
                return (
                  <div key={providerId} className="py-2">
                    <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2" 
                      style={{ color: "var(--text-secondary)" }}>
                      {displayName}
                    </div>
                    <div>
                      {groupModels.map(model => {
                        const isSelected = activeModelId === model.id && activeProviderId === model.provider_id;
                        return (
                          <div
                            key={model.id}
                            onClick={() => handleSelect(model.provider_id, model.id)}
                            className="group material-interactive flex items-center justify-between px-4 py-2.5 mx-2 rounded-2xl cursor-pointer border"
                            data-hover-surface={isSelected ? "accent" : "floating"}
                            style={{
                              ...getMaterialSurfaceStyle(isSelected ? "accent" : "floating", "sm"),
                              borderColor: isSelected
                                ? "var(--material-accent-border)"
                                : "var(--material-content-border)",
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ModelIcon modelName={model.id} />
                              <div
                                className="truncate text-sm font-medium"
                                style={{
                                  color: isSelected
                                    ? "var(--selection-active-foreground, var(--brand-primary))"
                                    : "var(--text-primary)",
                                }}
                              >
                                {model.name}
                              </div>
                            </div>
                            
                            {(() => {
                              const resolvedCapabilities =
                                model.capabilities && model.capabilities.length > 0
                                  ? model.capabilities
                                  : inferModelCapabilities(model.provider_id, model.id);
                              const displayCapabilities = CAPABILITY_ORDER.filter((capability) =>
                                resolvedCapabilities.includes(capability)
                              );
                              if (displayCapabilities.length === 0) {
                                return null;
                              }
                              return (
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                  {displayCapabilities.map((capability) => {
                                    const config = CAPABILITY_CONFIG[capability];
                                    if (!config) {
                                      return null;
                                    }
                                    return (
                                        <div
                                          key={capability}
                                          className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                          style={{
                                            background: isSelected
                                              ? "var(--bg-white)"
                                              : "color-mix(in srgb, var(--material-content-background) 96%, rgba(15, 23, 42, 0.08))",
                                            color: config.color,
                                            border: "1px solid var(--material-content-border)",
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
