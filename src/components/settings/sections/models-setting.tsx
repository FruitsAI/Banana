"use client";

import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { ModelIcon } from "@/components/models/model-selector";
import { AddModelDialog } from "@/components/models/add-model-dialog";
import { AddProviderDialog } from "@/components/providers/add-provider-dialog";
import { ManageModelsDialog } from "@/components/models/manage-models-dialog";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import {
  SettingsSectionGroup,
  SettingsSectionShell,
} from "@/components/settings/settings-section-shell";
import { ModelGroupsPanel } from "./models-setting/model-groups-panel";
import { ProviderConnectionSection } from "./models-setting/provider-connection-section";
import { ProviderSidebar } from "./models-setting/provider-sidebar";
import { useModelsSettingController } from "./models-setting/use-models-setting-controller";

function GuidedEmptyState({
  description,
  eyebrow,
  testId,
  title,
}: {
  description: string;
  eyebrow: string;
  testId: string;
  title: string;
}) {
  return (
    <div
      className="rounded-[24px] border px-5 py-5"
      data-testid={testId}
      style={{
        ...getMaterialSurfaceStyle("content", "sm"),
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), rgba(255,255,255,0.04)",
      }}
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
        {eyebrow}
      </div>
      <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </div>
      <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}

export function ModelsSetting() {
  const {
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
  } = useModelsSettingController();

  const sidebar = (
    <ProviderSidebar
      activeProviderId={activeProviderId}
      filteredProviders={filteredProviders}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onOpenAddProvider={openAddProviderDialog}
      onSelectProvider={(providerId) => {
        void selectProvider(providerId);
      }}
    />
  );

  return (
    <>
      <div className="h-full overflow-y-auto custom-scroll">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <SettingsSectionShell
            sectionId="models"
            eyebrow="Models"
            title="模型与平台"
            description="用统一的偏好设置层级管理模型平台、连接凭据和默认模型，让启用状态、默认选择和主工作区保持同一节奏。"
            headerAccessory={
              <div
                className="flex flex-col gap-2 rounded-[24px] border p-2.5 sm:flex-row sm:items-center"
                data-testid="models-preferences-toolbar"
                style={{
                  ...getMaterialSurfaceStyle("content", "sm"),
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%), var(--material-content-background)",
                }}
              >
                <div className="pr-3 sm:border-r" style={{ borderColor: "var(--divider)" }}>
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
                    当前平台
                  </div>
                  <div className="mt-1 inline-flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {activeProvider ? <ModelIcon modelName={activeProvider.name} size={14} /> : null}
                    <span>{activeProvider?.name ?? "未选择平台"}</span>
                  </div>
                </div>

                <label
                  className="inline-flex items-center justify-between gap-3 rounded-full border px-3 py-2 text-xs font-medium"
                  style={{
                    ...getMaterialSurfaceStyle("floating", "sm"),
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>启用平台</span>
                  <Switch
                    checked={Boolean(activeProvider?.is_enabled)}
                    onCheckedChange={(checked) => void handleToggleProvider(checked)}
                    disabled={!activeProvider}
                  />
                </label>
              </div>
            }
          >
            <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]" data-preferences-layout="two-column">
              <SettingsSectionGroup className="overflow-hidden p-0">
                <div className="px-5 pb-3 pt-5">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    平台列表
                  </h3>
                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    选择默认提供商、快速切换平台，并在同一处新增模型服务。
                  </p>
                </div>
                <div className="border-t" style={{ borderColor: "var(--divider)" }}>
                  {sidebar}
                </div>
              </SettingsSectionGroup>

              <div className="space-y-5">
                <SettingsSectionGroup>
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          连接与凭据
                        </h3>
                        <HugeiconsIcon
                          icon={Settings01Icon}
                          size={16}
                          style={{ color: "var(--text-tertiary)" }}
                        />
                      </div>
                      <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                        保存当前平台的 API Key、地址和连通性配置，让切换和校验保持在同一个偏好设置场景里完成。
                      </p>
                    </div>

                    {activeProvider ? (
                      <div
                        className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em]"
                        style={{
                          background: "var(--glass-subtle)",
                          borderColor: "var(--glass-border)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {activeProvider.provider_type ?? "custom"}
                      </div>
                    ) : null}
                  </div>

                  {loading ? (
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      正在加载模型配置...
                    </div>
                  ) : activeProvider ? (
                    <div className="grid gap-5 xl:grid-cols-2">
                      <ProviderConnectionSection
                        activeProvider={activeProvider}
                        apiKey={apiKey}
                        baseUrl={baseUrl}
                        isTesting={isTesting}
                        saving={saving}
                        showApiKey={showApiKey}
                        onApiKeyChange={setApiKey}
                        onBaseUrlChange={setBaseUrl}
                        onTestConnection={() => {
                          void handleTestConnection();
                        }}
                        onToggleShowApiKey={toggleShowApiKey}
                      />
                    </div>
                  ) : (
                    <GuidedEmptyState
                      testId="models-connection-empty-state"
                      eyebrow="Connection"
                      title="先选择一个平台"
                      description="从左侧选择或添加模型平台后，这里会显示对应的 API Key、地址与连通性配置。"
                    />
                  )}
                </SettingsSectionGroup>

                <SettingsSectionGroup>
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        默认模型与可用性
                      </h3>
                      <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                        控制模型分组、启用状态和默认选择，让每个平台都保持清晰、可预测的工作集。
                      </p>
                    </div>

                    <div
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        background: "var(--glass-subtle)",
                        borderColor: "var(--glass-border)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {models.length} 个模型
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      正在同步模型清单...
                    </div>
                  ) : activeProvider ? (
                    <ModelGroupsPanel
                      activeModelId={activeModelId}
                      modelGroups={modelGroups}
                      modelsCount={models.length}
                      onDeleteGroup={(groupName, groupModels) => {
                        void handleDeleteModelGroup(groupName, groupModels);
                      }}
                      onDeleteModel={(model) => {
                        void handleDeleteModel(model);
                      }}
                      onOpenAddModel={openAddModelDialog}
                      onOpenEditModel={openEditModelDialog}
                      onOpenManageModels={() => setIsManageModelsDialogOpen(true)}
                      onSelectDefaultModel={(modelId) => {
                        void handleSelectDefaultModel(modelId);
                      }}
                      onToggleModel={(model, checked) => {
                        void handleToggleModel(model, checked);
                      }}
                      showHeader={false}
                      showTopBorder={false}
                    />
                  ) : (
                    <GuidedEmptyState
                      testId="models-library-empty-state"
                      eyebrow="Library"
                      title="模型库会跟随平台出现"
                      description="选择平台后，这里会呈现默认模型、启用状态和分组管理，让工作集保持清晰稳定。"
                    />
                  )}
                </SettingsSectionGroup>
              </div>
            </div>
          </SettingsSectionShell>
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
        onOpenChange={handleEditModelDialogOpenChange}
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
      <ManageModelsDialog
        open={isManageModelsDialogOpen}
        onOpenChange={setIsManageModelsDialogOpen}
        activeProvider={activeProvider}
        existingModels={models}
        apiKey={apiKey}
        baseUrl={baseUrl}
        onAddModels={handleAddRemoteModels}
      />
    </>
  );
}
