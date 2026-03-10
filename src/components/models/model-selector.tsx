"use client";

import { useState, useMemo, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ViewIcon,
  AiBrain02Icon,
  Wrench01Icon,
  InternetIcon,
  PinLocation01Icon,
} from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getProviderIcon, OpenAiIcon, AnthropicIcon, GeminiIcon, OllamaIcon } from "@/components/icons/provider-icons";
import { getActiveModelSelection, ensureProvidersReady, setActiveModelSelection } from "@/lib/model-settings";
import { type Provider, type Model, getProviders, getModelsByProvider } from "@/lib/db";
import { motion } from "framer-motion";

function ModelIcon({ modelName }: { modelName: string }) {
  const n = modelName.toLowerCase();
  let Icon = null;
  let char = '';
  let color = 'var(--text-primary)';
  let bg = 'transparent';

  if (n.includes('gpt') || n.includes('openai') || n.includes('o1') || n.includes('o3')) {
    Icon = OpenAiIcon; color = '#10a37f';
  } else if (n.includes('claude') || n.includes('anthropic')) {
    Icon = AnthropicIcon; color = '#d97757';
  } else if (n.includes('gemini') || n.includes('google')) {
    Icon = GeminiIcon; color = '#4285f4';
  } else if (n.includes('ollama')) {
    Icon = OllamaIcon;
  } else if (n.includes('qwen') || n.includes('tongyi')) {
    char = 'Q'; color = '#615ced'; bg = '#615ced1a';
  } else if (n.includes('glm') || n.includes('zhipu')) {
    char = 'G'; color = '#3366ff'; bg = '#3366ff1a';
  } else if (n.includes('kimi') || n.includes('moonshot')) {
    char = 'K'; color = '#1f2329'; bg = '#1f23291a';
  } else if (n.includes('minimax') || n.includes('abab')) {
    char = 'M'; color = '#ff4d4f'; bg = '#ff4d4f1a';
  } else if (n.includes('llama') || n.includes('meta')) {
    char = 'L'; color = '#0668E1'; bg = '#0668E11a';
  } else if (n.includes('mistral')) {
    char = 'M'; color = '#f36900'; bg = '#f369001a';
  } else if (n.includes('doubao')) {
    char = '豆'; color = '#0066ff'; bg = '#0066ff1a';
  } else if (n.includes('deepseek')) {
    char = 'D'; color = '#4d6bfe'; bg = '#4d6bfe1a';
  } else if (n.includes('yi') || n.includes('01.ai') || n.includes('lingyi')) {
    char = '零'; color = '#0033ff'; bg = '#0033ff1a';
  } else {
    // extract last part if path-like (e.g. provider/model)
    const parts = modelName.split('/');
    const shortName = parts[parts.length - 1].replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
    char = shortName.charAt(0).toUpperCase();
    if (!char) char = modelName.charAt(0).toUpperCase();
    color = 'var(--text-tertiary)';
  }

  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border"
      style={{ 
        backgroundColor: bg !== 'transparent' ? bg : "var(--glass-surface)",
        borderColor: "var(--glass-border)",
        color: color
      }}
    >
      {Icon ? <Icon className="w-4 h-4" /> : <span className="text-[13px] font-bold">{char}</span>}
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

  const loadData = async () => {
    try {
      const readyProviders = await ensureProvidersReady();
      setProviders(readyProviders);

      const activeSelection = await getActiveModelSelection();
      setActiveProviderId(activeSelection.activeProviderId);
      setActiveModelId(activeSelection.activeModelId);

      let allModels: Model[] = [];
      for (const p of readyProviders) {
        if (!p.is_enabled) continue;
        const pModels = await getModelsByProvider(p.id);
        allModels = [...allModels, ...pModels.filter((m: Model) => m.is_enabled)];
      }
      setModels(allModels);
    } catch (e) {
      console.error("Failed to load models for selector", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = async (providerId: string, modelId: string) => {
    setActiveProviderId(providerId);
    setActiveModelId(modelId);
    await setActiveModelSelection(providerId, modelId);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled || models.length === 0}
          className="floating-chip px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          style={{
            background: "var(--brand-primary-light)",
            color: "var(--brand-primary)",
            opacity: disabled || models.length === 0 ? 0.5 : 1,
            pointerEvents: disabled || models.length === 0 ? "none" : "auto",
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
                const ProviderIcon = provider ? getProviderIcon(provider.id) : null;
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
                            
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              {/* mock capabilities tags */}
                              <div className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                style={{ background: isSelected ? "var(--bg-white)" : "var(--glass-subtle)", color: isSelected ? "var(--success)" : "var(--success)" }}>
                                <HugeiconsIcon icon={ViewIcon} size={12} />
                              </div>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                style={{ background: isSelected ? "var(--bg-white)" : "var(--glass-subtle)", color: isSelected ? "var(--brand-primary)" : "var(--brand-primary)" }}>
                                <HugeiconsIcon icon={AiBrain02Icon} size={12} />
                              </div>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                style={{ background: isSelected ? "var(--bg-white)" : "var(--glass-subtle)", color: isSelected ? "var(--warning)" : "var(--warning)" }}>
                                <HugeiconsIcon icon={Wrench01Icon} size={12} />
                              </div>
                              <div className="w-6 h-6 flex items-center justify-center" style={{ color: "var(--text-quaternary)" }}>
                                <HugeiconsIcon icon={PinLocation01Icon} size={14} className={isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-40 transition-opacity"} />
                              </div>
                            </div>
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
