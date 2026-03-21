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
}: ModelGroupsPanelProps) {
  return (
    <div className="space-y-3 pt-4 border-t" style={{ borderColor: "var(--divider)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>
            模型
          </Label>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: "var(--glass-subtle)", color: "var(--text-tertiary)" }}
          >
            {modelsCount}
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
                  onClick={() => onDeleteGroup(groupName, groupModels)}
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
                      borderColor: "var(--divider)",
                    }}
                  >
                    <button
                      className="flex items-center gap-3 min-w-0 text-left"
                      disabled={model.is_enabled === false}
                      onClick={() => onSelectDefaultModel(model.id)}
                    >
                      <ModelIcon
                        modelName={model.name}
                        size={12}
                        showBorder={isDefaultModel}
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {model.name}
                        </div>
                        <div className="text-[11px] truncate opacity-50" style={{ color: "var(--text-tertiary)" }}>
                          {model.id}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-3 shrink-0 px-2">
                      <button
                        className="opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-tertiary)" }}
                        onClick={() => onOpenEditModel(model)}
                        aria-label={`编辑模型 ${model.id}`}
                      >
                        <HugeiconsIcon icon={Edit03Icon} size={16} />
                      </button>
                      <button
                        className="opacity-70 hover:opacity-100 transition-opacity"
                        style={{ color: "var(--danger)" }}
                        onClick={() => onDeleteModel(model)}
                        aria-label={`删除模型 ${model.id}`}
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={16} />
                      </button>
                      <Switch
                        checked={model.is_enabled}
                        onCheckedChange={(checked) => onToggleModel(model, checked)}
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
          onClick={onOpenManageModels}
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
          onClick={onOpenAddModel}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" /> 添加
        </Button>
      </div>
    </div>
  );
}
