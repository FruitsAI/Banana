"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete01Icon,
  Edit03Icon,
  ListSettingIcon,
  Search01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CollapsiblePanel } from "@/components/ui/collapsible-panel";
import { ModelIcon } from "@/components/models/model-selector";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import type { Model } from "@/domain/models/types";

interface ModelGroupsPanelProps {
  activeModelId: string;
  modelGroups: Array<[string, Model[]]>;
  modelsCount: number;
  onDeleteGroup: (groupName: string, groupModels: Model[]) => void;
  onDeleteModel: (model: Model) => void;
  onOpenAddModel: () => void;
  onOpenEditModel: (model: Model) => void;
  onOpenManageModels: () => void;
  onSelectDefaultModel: (modelId: string) => void;
  onToggleModel: (model: Model, checked: boolean) => void;
  showHeader?: boolean;
  showTopBorder?: boolean;
}

export function ModelGroupsPanel({
  activeModelId,
  modelGroups,
  modelsCount,
  onDeleteGroup,
  onDeleteModel,
  onOpenAddModel,
  onOpenEditModel,
  onOpenManageModels,
  onSelectDefaultModel,
  onToggleModel,
  showHeader = true,
  showTopBorder = true,
}: ModelGroupsPanelProps) {
  return (
    <div
      className={showTopBorder ? "space-y-3 border-t pt-4" : "space-y-3"}
      style={showTopBorder ? { borderColor: "var(--divider)" } : undefined}
    >
      {showHeader ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>
              模型
            </Label>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "var(--material-floating-background)",
                color: "var(--text-tertiary)",
                border: "1px solid var(--material-content-border)",
              }}
            >
              {modelsCount}
            </span>
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              style={{ color: "var(--text-tertiary)" }}
            />
          </div>
          <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
        </div>
      ) : null}

      <div
        className="overflow-hidden rounded-[24px]"
        style={{
          ...getMaterialSurfaceStyle("content", "sm"),
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--material-floating-background) 94%, transparent) 0%, color-mix(in srgb, var(--material-content-background) 92%, transparent) 100%)",
          border: "1px solid var(--material-content-border)",
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
                background:
                  "color-mix(in srgb, var(--material-floating-background) 88%, transparent)",
                color: "var(--text-primary)",
                borderBottom: "1px solid var(--divider)",
              }}
              headerActions={
                <button
                  type="button"
                  className="material-interactive rounded-full border px-2 py-1 text-[11px] opacity-0 transition-all duration-150 group-hover/panel:opacity-100 hover:opacity-100 motion-safe:hover:-translate-y-px"
                  data-hover-surface="content"
                  style={{
                    ...getMaterialSurfaceStyle("floating", "sm"),
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
                    color: "var(--danger)",
                  }}
                  onClick={() => onDeleteGroup(groupName, groupModels)}
                  aria-label={`删除分组 ${groupName}`}
                >
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={Delete01Icon} size={12} />
                    删除
                  </span>
                </button>
              }
            >
              {groupModels.map((model) => {
                const isDefaultModel = activeModelId === model.id;
                return (
                  <div
                    key={model.id}
                    className="group/item flex items-center justify-between border-b px-5 py-3 last:border-0"
                    style={{
                      background: "transparent",
                      borderColor: "var(--divider)",
                    }}
                  >
                    <button
                      className="material-interactive flex min-w-0 items-center gap-3 rounded-xl px-2 py-1 text-left transition-colors duration-200"
                      data-hover-surface={isDefaultModel ? "accent" : "content"}
                      style={{
                        background: isDefaultModel
                          ? "linear-gradient(180deg, rgba(59,130,246,0.14) 0%, rgba(255,255,255,0.04) 100%), var(--material-accent-background)"
                          : "transparent",
                        boxShadow: isDefaultModel
                          ? "0 10px 24px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.34)"
                          : "none",
                      }}
                      disabled={model.is_enabled === false}
                      onClick={() => onSelectDefaultModel(model.id)}
                      type="button"
                    >
                      <ModelIcon
                        modelName={model.name}
                        size={12}
                        showBorder={isDefaultModel}
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                            {model.name}
                          </div>
                          {isDefaultModel ? (
                            <span
                              className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                background: "var(--material-accent-background)",
                                borderColor: "var(--material-accent-border)",
                                color: "var(--brand-primary)",
                              }}
                            >
                              默认模型
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate text-[11px] opacity-60" style={{ color: "var(--text-tertiary)" }}>
                          {model.id}
                        </div>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        className="material-interactive inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] opacity-0 transition-all duration-150 group-hover/panel:opacity-100 hover:opacity-100 motion-safe:hover:-translate-y-px"
                        data-hover-surface="content"
                        style={{
                          ...getMaterialSurfaceStyle("floating", "sm"),
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
                          color: "var(--text-tertiary)",
                        }}
                        onClick={() => onOpenEditModel(model)}
                        aria-label={`编辑模型 ${model.id}`}
                        type="button"
                      >
                        <HugeiconsIcon icon={Edit03Icon} size={12} />
                        编辑
                      </button>
                      <button
                        className="material-interactive inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] opacity-0 transition-all duration-150 group-hover/panel:opacity-100 hover:opacity-100 motion-safe:hover:-translate-y-px"
                        data-hover-surface="content"
                        style={{
                          ...getMaterialSurfaceStyle("floating", "sm"),
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
                          color: "var(--danger)",
                        }}
                        onClick={() => onDeleteModel(model)}
                        aria-label={`删除模型 ${model.id}`}
                        type="button"
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={12} />
                        删除
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                          启用
                        </span>
                        <Switch
                          checked={model.is_enabled}
                          onCheckedChange={(checked) => onToggleModel(model, checked)}
                        />
                      </div>
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
          className="h-9 rounded-full px-4 text-xs font-medium motion-safe:hover:-translate-y-px"
          surface="floating"
          onClick={onOpenManageModels}
        >
          <HugeiconsIcon icon={ListSettingIcon} size={14} className="mr-1.5" /> 管理
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full border px-4 text-xs motion-safe:hover:-translate-y-px"
          surface="floating"
          onClick={onOpenAddModel}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" /> 添加
        </Button>
      </div>
    </div>
  );
}
