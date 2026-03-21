"use client";

import { Switch } from "@/components/ui/switch";
import { SidebarLayout } from "@/components/ui/sidebar-layout";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { ModelIcon } from "@/components/models/model-selector";
import { AddModelDialog } from "@/components/models/add-model-dialog";
import { AddProviderDialog } from "@/components/providers/add-provider-dialog";
import { ManageModelsDialog } from "@/components/models/manage-models-dialog";
import { ModelGroupsPanel } from "./models-setting/model-groups-panel";
import { ProviderConnectionSection } from "./models-setting/provider-connection-section";
import { ProviderSidebar } from "./models-setting/provider-sidebar";
import { useModelsSettingController } from "./models-setting/use-models-setting-controller";

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

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--divider)" }}
      >
        <div className="flex items-center gap-2">
          {activeProvider && <ModelIcon modelName={activeProvider.name} size={14} />}
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {activeProvider?.name ?? "模型设置"}
          </h2>
          <HugeiconsIcon
            icon={Settings01Icon}
            size={16}
            style={{ color: "var(--text-tertiary)" }}
          />
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
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <SidebarLayout sidebar={sidebar} content={content} />
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
