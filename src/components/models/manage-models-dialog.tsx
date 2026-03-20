"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  LoadingIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ModelIcon } from "@/components/models/model-selector";
import { cn } from "@/lib/utils";
import type { Model, Provider } from "@/domain/models/types";

interface ManageModelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeProvider: Provider | null;
  existingModels: Model[];
  apiKey: string;
  baseUrl: string;
  onAddModels: (models: { id: string; name: string; groupName: string }[]) => Promise<void>;
}

interface RemoteModel {
  id: string;
  name: string;
  groupName: string;
}

const CATEGORIES = [
  { label: "全部", value: "all" },
  { label: "推理", value: "reasoning" },
  { label: "视觉", value: "vision" },
  { label: "联网", value: "online" },
  { label: "免费", value: "free" },
  { label: "嵌入", value: "embed" },
];

/**
 * ManageModelsDialog 组件
 * @description 提供商模型市场/管理弹窗，支持自动发现、搜索、分类和一键批量添加。
 */
export function ManageModelsDialog({
  open,
  onOpenChange,
  activeProvider,
  existingModels,
  apiKey,
  baseUrl,
  onAddModels,
}: ManageModelsDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [remoteModels, setRemoteModels] = useState<RemoteModel[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const existingIdSet = useMemo(
    () => new Set(existingModels.map((m) => m.id.toLowerCase())),
    [existingModels]
  );

  // 拉取远程模型列表
  useEffect(() => {
    if (!open || !activeProvider || !apiKey) return;

    const fetchModels = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch("/api/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            baseURL: baseUrl,
            providerType: activeProvider.provider_type,
          }),
        });

        const data = await response.json();
        if (response.ok && data.models) {
          // 简单的分组逻辑：根据 ID 前缀或其他特征建立默认分组
          const seenIds = new Set<string>();
          const formatted: RemoteModel[] = [];
          
          for (const m of (data.models as unknown[])) {
            const model = m as { id: string; name?: string; owned_by?: string };
            if (seenIds.has(model.id)) continue;
            seenIds.add(model.id);
            formatted.push({
              id: model.id,
              name: model.name || model.id,
              groupName: model.id.includes('/') ? model.id.split('/')[0] : (model.owned_by || activeProvider.name),
            });
          }
          setRemoteModels(formatted);
        } else {
          throw new Error(data.error || "无法拉取模型列表");
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "获取列表失败");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModels();
  }, [open, activeProvider, apiKey, baseUrl]);

  // 过滤逻辑
  const filteredModels = useMemo(() => {
    return remoteModels.filter((m) => {
      const matchesSearch =
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // 分类逻辑 (简单启发式匹配)
      if (activeCategory === "all") return true;
      if (activeCategory === "vision") return m.id.includes("vision") || m.id.includes("vl");
      if (activeCategory === "reasoning") return m.id.includes("instruct") || m.id.includes("chat") || m.id.includes("01");
      if (activeCategory === "online") return m.id.includes("online") || m.id.includes("search");
      if (activeCategory === "free") return m.id.includes("free");
      if (activeCategory === "embed") return m.id.includes("embedding");
      
      return true;
    });
  }, [remoteModels, searchQuery, activeCategory]);

  // 按厂商分组
  const groupedModels = useMemo(() => {
    const groups: Record<string, RemoteModel[]> = {};
    filteredModels.forEach((m) => {
      if (!groups[m.groupName]) groups[m.groupName] = [];
      groups[m.groupName].push(m);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredModels]);

  const handleAddSingle = async (m: RemoteModel) => {
    await onAddModels([{ id: m.id, name: m.name, groupName: m.groupName }]);
  };

  const handleAddGroup = async (groupName: string, models: RemoteModel[]) => {
    const newModels = models.filter((m) => !existingIdSet.has(m.id.toLowerCase()));
    if (newModels.length > 0) {
      await onAddModels(newModels.map(m => ({ id: m.id, name: m.name, groupName: m.groupName })));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] p-0 overflow-hidden bg-transparent border-0 shadow-none">
        <motion.div
           initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98, y: 10 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           className="relative rounded-2xl border flex flex-col h-[85vh] max-h-[720px]"
           style={{
             background: "var(--glass-elevated)",
             borderColor: "var(--glass-border-strong)",
             backdropFilter: "blur(24px) saturate(190%)",
           }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-2 space-y-4">
            <div className="flex items-center justify-between">
               <DialogTitle className="text-xl font-bold">{activeProvider?.name || "Provider"} 模型市场</DialogTitle>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <HugeiconsIcon className="absolute left-3 top-1/2 -translate-y-1/2" icon={Search01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索模型 ID 或名称"
                  className="pl-9 h-11 rounded-xl"
                  style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none border-b" style={{ borderColor: "var(--divider)" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    "whitespace-nowrap pb-2 text-[13px] font-medium transition-colors relative",
                    activeCategory === cat.value ? "text-[var(--brand-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {cat.label}
                  {activeCategory === cat.value && (
                    <motion.div layoutId="activeCat" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--brand-primary)" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-40">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <HugeiconsIcon icon={LoadingIcon} size={32} />
                </motion.div>
                <p className="text-sm">正在同步云端模型库...</p>
              </div>
            ) : errorMessage ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <p className="text-sm text-[var(--danger)]">{errorMessage}</p>
                <Button size="sm" onClick={() => onOpenChange(false)}>确定</Button>
              </div>
            ) : (
              groupedModels.map(([group, models]) => (
                <div key={group} className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                       <span className="text-[12px] font-bold tracking-wider opacity-60 uppercase">{group}</span>
                       <span className="text-[10px] px-1.5 py-0.5 rounded bg-glass-subtle opacity-50">{models.length}</span>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl text-[11px] font-bold border"
                      style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                      onClick={() => handleAddGroup(group, models)}
                    >
                      一键添加
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {models.map((m) => {
                      const isAdded = existingIdSet.has(m.id.toLowerCase());
                      return (
                        <div 
                           key={m.id}
                           className="flex items-center justify-between p-3 rounded-xl border transition-all group/item"
                           style={{ 
                             background: isAdded ? "var(--glass-subtle)" : "var(--glass-surface)",
                             borderColor: "var(--glass-border)"
                           }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ModelIcon modelName={m.name} size={14} className="opacity-70" />
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium truncate">{m.name}</div>
                              <div className="text-[11px] truncate opacity-40">{m.id}</div>
                            </div>
                          </div>
                          
                          {isAdded ? (
                            <div 
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-[var(--success)] border"
                              style={{ background: "var(--glass-subtle)", borderColor: "var(--success-border-subtle)" }}
                            >
                               <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} /> 已添加
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-9 px-4 rounded-xl text-[11px] font-bold transition-all border"
                              style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                              onClick={() => handleAddSingle(m)}
                            >
                              添加
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Overlay */}
          <div className="h-4 pointer-events-none sticky bottom-0" style={{ background: "linear-gradient(transparent, var(--glass-elevated))" }} />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
