import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActiveModelSelection, Model, Provider } from "@/domain/models/types";
import { ModelsSetting } from "./models-setting";

const {
  loadActiveSelectionMock,
  loadModelsByProviderMock,
  removeModelMock,
  saveActiveSelectionMock,
  saveModelMock,
  saveProviderMock,
  ensureProvidersReadyMock,
  ensureProviderModelsReadyMock,
  inferModelCapabilitiesMock,
  filterProvidersMock,
} = vi.hoisted(() => ({
  loadActiveSelectionMock: vi.fn<() => Promise<ActiveModelSelection>>(),
  loadModelsByProviderMock: vi.fn<(providerId: string) => Promise<Model[]>>(),
  removeModelMock: vi.fn(),
  saveActiveSelectionMock: vi.fn<(providerId: string, modelId: string) => Promise<void>>(),
  saveModelMock: vi.fn<(model: Model) => Promise<void>>(),
  saveProviderMock: vi.fn<(provider: Provider) => Promise<void>>(),
  ensureProvidersReadyMock: vi.fn<() => Promise<Provider[]>>(),
  ensureProviderModelsReadyMock: vi.fn<(providerId: string) => Promise<Model[]>>(),
  inferModelCapabilitiesMock: vi.fn<(providerId: string, modelId: string) => string[]>(),
  filterProvidersMock: vi.fn((providers: Provider[]) => providers),
}));

vi.mock("@/stores/models/useModelsStore", () => ({
  useModelsStore: () => ({
    loadActiveSelection: loadActiveSelectionMock,
    loadModelsByProvider: loadModelsByProviderMock,
    removeModel: removeModelMock,
    saveActiveSelection: saveActiveSelectionMock,
    saveModel: saveModelMock,
    saveProvider: saveProviderMock,
  }),
}));

vi.mock("@/lib/model-settings", () => ({
  ensureProvidersReady: ensureProvidersReadyMock,
  ensureProviderModelsReady: ensureProviderModelsReadyMock,
  filterProviders: filterProvidersMock,
  inferModelCapabilities: inferModelCapabilitiesMock,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/components/feedback/feedback-provider", () => ({
  useConfirm: () => vi.fn(async () => true),
}));

vi.mock("@/components/ui/sidebar-layout", () => ({
  SidebarLayout: ({ sidebar, content }: { sidebar: React.ReactNode; content: React.ReactNode }) => (
    <div>
      <div>{sidebar}</div>
      <div>{content}</div>
    </div>
  ),
}));

vi.mock("@/components/ui/search-input", () => ({
  SearchInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/collapsible-panel", () => ({
  CollapsiblePanel: ({
    children,
    title,
    headerActions,
  }: {
    children: React.ReactNode;
    title: React.ReactNode;
    headerActions?: React.ReactNode;
  }) => (
    <div>
      <div>
        <span>{title}</span>
        {headerActions}
      </div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("@/components/models/model-selector", () => ({
  ModelIcon: () => <div data-testid="model-icon" />,
}));

vi.mock("@/components/models/add-model-dialog", () => ({
  AddModelDialog: ({
    open,
    mode,
    onSubmitModel,
  }: {
    open: boolean;
    mode?: "create" | "edit";
    onSubmitModel: (values: { modelId: string; modelName: string; groupName: string }) => Promise<void>;
  }) =>
    open ? (
      <button
        onClick={() =>
          void onSubmitModel({
            modelId: mode === "edit" ? "edited-model" : "gpt-5.3-codex",
            modelName: mode === "edit" ? "edited-model" : "gpt-5.3-codex",
            groupName: mode === "edit" ? "edited" : "gpt-5.3",
          })
        }
      >
        {mode === "edit" ? "提交编辑模型" : "提交新模型"}
      </button>
    ) : null,
}));

vi.mock("@/components/providers/add-provider-dialog", () => ({
  AddProviderDialog: ({
    open,
    onSubmitProvider,
  }: {
    open: boolean;
    onSubmitProvider: (values: { providerName: string; providerType: "anthropic" | "openai" }) => Promise<void>;
  }) =>
    open ? (
      <button
        onClick={() =>
          void onSubmitProvider({
            providerName: "NVIDIA",
            providerType: "anthropic",
          })
        }
      >
        提交提供商
      </button>
    ) : null,
}));

vi.mock("@/components/models/manage-models-dialog", () => ({
  ManageModelsDialog: () => null,
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { whileHover?: unknown; whileTap?: unknown }) => {
        const domProps = { ...props } as React.HTMLAttributes<HTMLElement> & { whileHover?: unknown; whileTap?: unknown };
        delete domProps.whileHover;
        delete domProps.whileTap;
        return React.createElement(tag, domProps, children);
      },
    },
  ),
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Add01Icon: "icon",
  ViewIcon: "icon",
  ViewOffIcon: "icon",
  Edit03Icon: "icon",
  Delete01Icon: "icon",
  Settings01Icon: "icon",
  ListSettingIcon: "icon",
  Search01Icon: "icon",
}));

const openaiProvider: Provider = {
  id: "openai",
  name: "OpenAI",
  icon: "O",
  is_enabled: true,
  api_key: "openai-key",
  base_url: "https://api.openai.com/v1",
  provider_type: "openai",
};

const openaiModels: Model[] = [
  {
    id: "gpt-4o-mini",
    provider_id: "openai",
    name: "gpt-4o-mini",
    is_enabled: true,
    capabilities: ["vision"],
  },
];

const nvidiaProvider: Provider = {
  id: "nvidia",
  name: "NVIDIA",
  icon: "N",
  is_enabled: true,
  api_key: "nvidia-key",
  base_url: "https://integrate.api.nvidia.com/v1",
  provider_type: "openai",
};

const nvidiaModels: Model[] = [
  {
    id: "z-ai/glm5",
    provider_id: "nvidia",
    name: "z-ai/glm5",
    is_enabled: true,
    capabilities: ["reasoning"],
  },
];

describe("ModelsSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadActiveSelectionMock.mockResolvedValue({
      activeProviderId: "openai",
      activeModelId: "gpt-4o-mini",
    });
    ensureProvidersReadyMock.mockResolvedValue([openaiProvider]);
    ensureProviderModelsReadyMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return openaiModels;
      }
      return [];
    });
    loadModelsByProviderMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return openaiModels;
      }
      return [
        {
          id: "gpt-5.3-codex",
          provider_id: providerId,
          name: "gpt-5.3-codex",
          is_enabled: true,
          group_name: "gpt-5.3",
          capabilities: ["reasoning", "tools"],
          capabilities_source: "auto",
        },
      ];
    });
    inferModelCapabilitiesMock.mockImplementation((_providerId: string, modelId: string) => {
      if (modelId === "gpt-5.3-codex") {
        return ["reasoning", "tools"];
      }
      return [];
    });
    saveActiveSelectionMock.mockResolvedValue(undefined);
    saveModelMock.mockResolvedValue(undefined);
    saveProviderMock.mockResolvedValue(undefined);
    removeModelMock.mockResolvedValue(undefined);
  });

  it("renders the models workflow inside the shared settings shell hierarchy", async () => {
    render(<ModelsSetting />);

    expect(screen.getByTestId("settings-page-frame")).toHaveAttribute(
      "data-settings-page-width",
      "fluid",
    );
    await waitFor(() => {
      expect(screen.getByTestId("settings-section-shell")).toHaveAttribute(
        "data-material-role",
        "floating",
      );
      expect(screen.getAllByTestId("settings-section-group").length).toBeGreaterThanOrEqual(3);
    });

    expect(
      screen.queryByText(
        "用统一的偏好设置层级管理模型平台、连接凭据和默认模型，让启用状态、默认选择和主工作区保持同一节奏。",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("选择默认提供商、快速切换平台，并在同一处新增模型服务。")).not.toBeInTheDocument();
    expect(
      screen.queryByText("保存当前平台的 API Key、地址和连通性配置，让切换和校验保持在同一个偏好设置场景里完成。"),
    ).not.toBeInTheDocument();
  });

  it("shows guided empty states when no provider has been configured yet", async () => {
    loadActiveSelectionMock.mockResolvedValue({
      activeProviderId: "",
      activeModelId: "",
    });
    ensureProvidersReadyMock.mockResolvedValue([]);
    ensureProviderModelsReadyMock.mockResolvedValue([]);
    loadModelsByProviderMock.mockResolvedValue([]);

    render(<ModelsSetting />);

    await waitFor(() => {
      expect(screen.getByTestId("models-connection-empty-state")).toBeInTheDocument();
      expect(screen.getByTestId("models-library-empty-state")).toBeInTheDocument();
    });
  });

  it("renders providers as a preference listbox and keeps the selected model row fluid, uniform, and badge-free", async () => {
    const secondaryOpenAiModel: Model = {
      id: "gpt-4.1-mini",
      provider_id: "openai",
      name: "gpt-4.1-mini",
      is_enabled: true,
      capabilities: ["tools"],
    };

    ensureProvidersReadyMock.mockResolvedValue([openaiProvider, nvidiaProvider]);
    ensureProviderModelsReadyMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return [...openaiModels, secondaryOpenAiModel];
      }
      if (providerId === "nvidia") {
        return nvidiaModels;
      }
      return [];
    });
    loadModelsByProviderMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return [...openaiModels, secondaryOpenAiModel];
      }
      if (providerId === "nvidia") {
        return nvidiaModels;
      }
      return [];
    });

    render(<ModelsSetting />);

    await waitFor(() => {
      expect(screen.getByTestId("models-preferences-toolbar")).toBeInTheDocument();
    });

    const providerListbox = screen.getByRole("listbox", { name: "模型平台" });
    const activeProviderOption = within(providerListbox).getByRole("option", { name: "OpenAI" });
    const idleProviderOption = within(providerListbox).getByRole("option", { name: "NVIDIA" });
    const defaultModelButton = screen.getByTestId("default-model-selection-button");
    const idleModelButton = screen.getAllByText("gpt-4.1-mini")[0]?.closest("button");
    const providerAddButton = screen.getAllByRole("button", { name: "添加" })[0];

    expect(screen.getByTestId("provider-sidebar")).toHaveAttribute(
      "data-provider-sidebar-layout",
      "equal-height",
    );
    expect(
      screen.getByTestId("models-provider-list-body").closest("[data-preferences-layout='two-column']")?.className,
    ).toContain("items-start");
    expect(screen.getByTestId("models-provider-list-header")).toHaveAttribute(
      "data-provider-sidebar-header-align",
      "section-group",
    );
    expect(screen.getAllByTestId("settings-section-group")[0].className).toContain("sm:p-0");
    expect(screen.getAllByTestId("settings-section-group")[0].className).toContain("self-start");
    expect(screen.getByTestId("models-provider-list-header").className).toContain("flex-none");
    expect(screen.getByTestId("models-provider-list-header").className).toContain("sm:px-6");
    expect(screen.getByTestId("models-provider-list-header-row")).toHaveAttribute(
      "data-settings-title-row",
      "shared",
    );
    expect(screen.getByTestId("models-provider-list-body").className).toContain("flex-1");
    expect(screen.getByTestId("models-connection-header")).toHaveAttribute(
      "data-settings-title-row",
      "shared",
    );
    expect(screen.getByTestId("provider-sidebar-search-row")).toHaveAttribute(
      "data-provider-sidebar-search",
      "full-width",
    );
    expect(providerListbox).toHaveAttribute("data-provider-sidebar-scroll", "true");
    expect(activeProviderOption).toHaveAttribute("aria-selected", "true");
    expect(activeProviderOption).toHaveAttribute("data-selection-style", "liquid-accent");
    expect(idleProviderOption).toHaveAttribute("data-selection-style", "idle");
    expect(defaultModelButton).toHaveAttribute("data-selection-style", "liquid-accent");
    expect(idleModelButton).toHaveAttribute("data-selection-style", "idle");
    expect(activeProviderOption.getAttribute("style")).toContain("var(--selection-active-fill)");
    expect(activeProviderOption.getAttribute("style")).toContain("var(--selection-active-list-shadow");
    expect(defaultModelButton.getAttribute("style")).toContain("var(--selection-active-fill)");
    expect(defaultModelButton.getAttribute("style")).toContain("var(--selection-active-list-shadow");
    expect(idleProviderOption.getAttribute("style")).not.toContain("border-color: transparent");
    expect(idleModelButton.getAttribute("style")).not.toContain("border-color: transparent");
    expect(defaultModelButton.className).toContain("w-full");
    expect(defaultModelButton.className).toContain("border");
    expect(providerAddButton.className).toContain("w-full");
    expect(providerAddButton).toHaveAttribute("data-variant", "default");
    expect(screen.getAllByRole("button", { name: "添加" })[1]?.getAttribute("style")).toContain(
      "var(--selection-active-list-border",
    );
    expect(screen.getAllByRole("button", { name: "添加" })[1]?.getAttribute("style")).toContain(
      "var(--brand-primary)",
    );
    expect(screen.getAllByRole("button", { name: "添加" })[1]?.getAttribute("style")).toContain(
      "var(--selection-active-list-shadow",
    );
    expect(screen.queryByText("默认模型")).not.toBeInTheDocument();
    expect(screen.getByTestId("models-connection-stack")).toHaveAttribute(
      "data-connection-layout",
      "stacked",
    );
  });

  it("creates a provider with the correct default base url and selects it", async () => {
    ensureProvidersReadyMock.mockReset();
    ensureProvidersReadyMock.mockResolvedValue([openaiProvider]);

    render(<ModelsSetting />);

    await waitFor(() => {
      expect(ensureProviderModelsReadyMock).toHaveBeenCalledWith("openai");
    });
    ensureProvidersReadyMock.mockResolvedValue([
      openaiProvider,
      {
        id: "nvidia",
        name: "NVIDIA",
        icon: "N",
        is_enabled: true,
        provider_type: "anthropic",
        base_url: "https://api.anthropic.com/v1",
      },
    ]);
    fireEvent.click(screen.getAllByRole("button", { name: "添加" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "提交提供商" }));

    await waitFor(() => {
      expect(saveProviderMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "nvidia",
          name: "NVIDIA",
          base_url: "https://api.anthropic.com/v1",
          provider_type: "anthropic",
        }),
      );
    });

    await waitFor(() => {
      expect(saveActiveSelectionMock).toHaveBeenCalledWith("nvidia", "");
    });
  });

  it("creates a model with inferred capabilities from the active provider", async () => {
    render(<ModelsSetting />);

    await waitFor(() => {
      expect(ensureProviderModelsReadyMock).toHaveBeenCalledWith("openai");
    });
    fireEvent.click(screen.getAllByRole("button", { name: "添加" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "提交新模型" }));

    await waitFor(() => {
      expect(saveModelMock).toHaveBeenCalledWith(
        expect.objectContaining({
          provider_id: "openai",
          id: "gpt-5.3-codex",
          capabilities: ["reasoning", "tools"],
          capabilities_source: "auto",
        }),
      );
    });
  });

  it("reselects the next available provider and model when disabling the active provider", async () => {
    ensureProvidersReadyMock.mockReset();
    ensureProvidersReadyMock.mockResolvedValue([openaiProvider, nvidiaProvider]);
    ensureProviderModelsReadyMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return openaiModels;
      }
      if (providerId === "nvidia") {
        return nvidiaModels;
      }
      return [];
    });
    loadModelsByProviderMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return openaiModels;
      }
      if (providerId === "nvidia") {
        return nvidiaModels;
      }
      return [];
    });

    render(<ModelsSetting />);

    await waitFor(() => {
      expect(screen.getAllByRole("switch").length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByRole("switch")[0]);

    await waitFor(() => {
      expect(saveProviderMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "openai",
          is_enabled: false,
        }),
      );
    });

    await waitFor(() => {
      expect(saveActiveSelectionMock).toHaveBeenLastCalledWith("nvidia", "z-ai/glm5");
    });
  });

  it("clears the active model instead of falling back to a disabled model", async () => {
    const onlyDisabledFallbackModels: Model[] = [
      {
        id: "gpt-4o-mini",
        provider_id: "openai",
        name: "gpt-4o-mini",
        is_enabled: true,
        capabilities: ["vision"],
      },
      {
        id: "gpt-4.1-mini",
        provider_id: "openai",
        name: "gpt-4.1-mini",
        is_enabled: false,
        capabilities: ["vision"],
      },
    ];

    ensureProviderModelsReadyMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return onlyDisabledFallbackModels;
      }
      return [];
    });
    loadModelsByProviderMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return onlyDisabledFallbackModels;
      }
      return [];
    });

    render(<ModelsSetting />);

    await waitFor(() => {
      expect(screen.getAllByRole("switch").length).toBeGreaterThanOrEqual(3);
    });

    fireEvent.click(screen.getAllByRole("switch")[1]);

    await waitFor(() => {
      expect(saveModelMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "gpt-4o-mini",
          is_enabled: false,
        }),
      );
    });

    await waitFor(() => {
      expect(saveActiveSelectionMock).toHaveBeenLastCalledWith("openai", "");
    });
  });

  it("ignores a stored disabled model selection during bootstrap and reselects the next enabled model", async () => {
    const modelsWithDisabledStoredSelection: Model[] = [
      {
        id: "gpt-4o-mini",
        provider_id: "openai",
        name: "gpt-4o-mini",
        is_enabled: false,
        capabilities: ["vision"],
      },
      {
        id: "gpt-4.1",
        provider_id: "openai",
        name: "gpt-4.1",
        is_enabled: true,
        capabilities: ["reasoning"],
      },
    ];

    loadActiveSelectionMock.mockResolvedValue({
      activeProviderId: "openai",
      activeModelId: "gpt-4o-mini",
    });
    ensureProviderModelsReadyMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return modelsWithDisabledStoredSelection;
      }
      return [];
    });
    loadModelsByProviderMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return modelsWithDisabledStoredSelection;
      }
      return [];
    });

    render(<ModelsSetting />);

    await waitFor(() => {
      expect(saveActiveSelectionMock).toHaveBeenLastCalledWith("openai", "gpt-4.1");
    });
  });

  it("clears the active selection after deleting the active model when only disabled models remain", async () => {
    const initialModels: Model[] = [
      {
        id: "gpt-4o-mini",
        provider_id: "openai",
        name: "gpt-4o-mini",
        is_enabled: true,
        capabilities: ["vision"],
      },
      {
        id: "gpt-4.1",
        provider_id: "openai",
        name: "gpt-4.1",
        is_enabled: false,
        capabilities: ["reasoning"],
      },
    ];
    const refreshedModels: Model[] = [
      {
        id: "gpt-4.1",
        provider_id: "openai",
        name: "gpt-4.1",
        is_enabled: false,
        capabilities: ["reasoning"],
      },
    ];

    ensureProviderModelsReadyMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return initialModels;
      }
      return [];
    });
    loadModelsByProviderMock.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return refreshedModels;
      }
      return [];
    });

    render(<ModelsSetting />);

    await waitFor(() => {
      expect(screen.getByLabelText("删除模型 gpt-4o-mini")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("删除模型 gpt-4o-mini"));

    await waitFor(() => {
      expect(removeModelMock).toHaveBeenCalledWith("openai", "gpt-4o-mini");
    });
    await waitFor(() => {
      expect(saveActiveSelectionMock).toHaveBeenLastCalledWith("openai", "");
    });
  });
});
