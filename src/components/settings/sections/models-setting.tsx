"use client";

import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { ModelIcon } from "@/components/models/model-selector";
import { AddModelDialog } from "@/components/models/add-model-dialog";
import { AddProviderDialog } from "@/components/providers/add-provider-dialog";
import type { AddProviderFormValues } from "@/components/providers/add-provider-dialog";
import { ManageModelsDialog } from "@/components/models/manage-models-dialog";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { SettingsPageFrame } from "@/components/settings/settings-page-frame";
import {
  SettingsSectionGroup,
  SettingsSectionShell,
  SettingsSectionTitleRow,
} from "@/components/settings/settings-section-shell";
import { ModelGroupsPanel } from "./models-setting/model-groups-panel";
import { ProviderConnectionSection } from "./models-setting/provider-connection-section";
import { ProviderSidebar } from "./models-setting/provider-sidebar";
import { useModelsSettingController } from "./models-setting/use-models-setting-controller";

function GuidedEmptyState({
  eyebrow,
  testId,
  title,
}: {
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
          "linear-gradient(180deg, color-mix(in srgb, var(--material-content-background) 94%, transparent) 0%, color-mix(in srgb, var(--material-floating-background) 92%, transparent) 100%)",
      }}
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
        {eyebrow}
      </div>
      <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </div>
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
    editingProvider,
    filteredProviders,
    handleAddRemoteModels,
    handleCreateModel,
    handleCreateProvider,
    handleDeleteProvider,
    handleDeleteModel,
    handleDeleteModelGroup,
    handleEditModelDialogOpenChange,
    handleProviderDialogOpenChange,
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
    openEditProviderDialog,
    providers,
    saving,
    searchQuery,
    selectProvider,
    setApiKey,
    setBaseUrl,
    setIsAddModelDialogOpen,
    setIsManageModelsDialogOpen,
    setSearchQuery,
    showApiKey,
    toggleShowApiKey,
  } = useModelsSettingController();

  const sidebar = (
    <ProviderSidebar
      activeProviderId={activeProviderId}
      filteredProviders={filteredProviders}
      onDeleteProvider={(provider) => {
        void handleDeleteProvider(provider);
      }}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onOpenAddProvider={openAddProviderDialog}
      onOpenEditProvider={openEditProviderDialog}
      onSelectProvider={(providerId) => {
        void selectProvider(providerId);
      }}
    />
  );

  return (
    <>
      <SettingsPageFrame>
        <SettingsSectionShell
          sectionId="models"
          eyebrow="Models"
          title="模型与平台"
          shellOverflow="visible"
          headerAccessory={
              <div
                className="flex flex-col gap-2 rounded-[24px] border p-2.5 sm:flex-row sm:items-center"
                data-testid="models-preferences-toolbar"
                style={{
                  ...getMaterialSurfaceStyle("content", "sm"),
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--material-floating-background) 94%, transparent) 0%, color-mix(in srgb, var(--material-content-background) 92%, transparent) 100%)",
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
          <div
            className="grid min-h-0 items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]"
            data-preferences-layout="two-column"
            data-preferences-height="matched"
          >
            <SettingsSectionGroup
              className="flex self-start flex-col overflow-hidden p-0 sm:p-0 lg:sticky lg:top-4 lg:h-[calc(100dvh-5rem)]"
              contentClassName="flex h-full min-h-0 flex-col"
            >
                <div
                  className="flex-none px-5 pb-5 pt-5 sm:px-6 sm:pb-5 sm:pt-6"
                  data-provider-sidebar-header-align="section-group"
                  data-testid="models-provider-list-header"
                >
                  <SettingsSectionTitleRow
                    testId="models-provider-list-header-row"
                    title="平台列表"
                  />
                </div>
                <div
                  className="flex min-h-0 flex-1 flex-col border-t"
                  data-testid="models-provider-list-body"
                  style={{ borderColor: "var(--divider)" }}
                >
                  {sidebar}
                </div>
              </SettingsSectionGroup>

              <div
                className="min-w-0 space-y-5"
                data-testid="models-content-column"
              >
                <SettingsSectionGroup>
                  <SettingsSectionTitleRow
                    className="mb-5"
                    icon={
                      <HugeiconsIcon
                        icon={Settings01Icon}
                        size={16}
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    }
                    testId="models-connection-header"
                    title="连接与凭据"
                    accessory={
                      activeProvider ? (
                        <div
                          className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em]"
                          style={{
                            background: "var(--material-floating-background)",
                            borderColor: "var(--material-content-border)",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {activeProvider.provider_type ?? "custom"}
                        </div>
                      ) : null
                    }
                  />

                  {loading ? (
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      正在加载模型配置...
                    </div>
                  ) : activeProvider ? (
                    <div
                      className="space-y-5"
                      data-connection-layout="stacked"
                      data-testid="models-connection-stack"
                    >
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
                    />
                  )}
                </SettingsSectionGroup>

                <SettingsSectionGroup>
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        默认模型与可用性
                      </h3>
                    </div>

                    <div
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        background: "var(--material-floating-background)",
                        borderColor: "var(--material-content-border)",
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
                    />
                  )}
                </SettingsSectionGroup>
              </div>
            </div>
        </SettingsSectionShell>
      </SettingsPageFrame>
      <AddProviderDialog
        mode={editingProvider ? "edit" : "create"}
        open={isAddProviderDialogOpen}
        onOpenChange={handleProviderDialogOpenChange}
        initialValues={
          editingProvider
            ? {
                providerName: editingProvider.name,
                providerType:
                  (editingProvider.provider_type ?? "openai") as AddProviderFormValues["providerType"],
              }
            : null
        }
        existingProviderNames={providers
          .filter((provider) => provider.id !== editingProvider?.id)
          .map((provider) => provider.name)}
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
