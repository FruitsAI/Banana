import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModelSelector } from "@/components/models/model-selector";
import type { Model, Provider } from "@/domain/models/types";

const {
  mockEnsureProvidersReady,
  mockInferModelCapabilities,
  mockLoadActiveSelection,
  mockLoadModelsByProvider,
  mockSaveActiveSelection,
} = vi.hoisted(() => ({
  mockEnsureProvidersReady: vi.fn(),
  mockInferModelCapabilities: vi.fn(() => []),
  mockLoadActiveSelection: vi.fn(),
  mockLoadModelsByProvider: vi.fn(),
  mockSaveActiveSelection: vi.fn(),
}));

vi.mock("@/lib/model-settings", () => ({
  ensureProvidersReady: mockEnsureProvidersReady,
  inferModelCapabilities: mockInferModelCapabilities,
}));

vi.mock("@/stores/models/useModelsStore", () => ({
  useModelsStore: () => ({
    loadActiveSelection: mockLoadActiveSelection,
    loadModelsByProvider: mockLoadModelsByProvider,
    saveActiveSelection: mockSaveActiveSelection,
  }),
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({
    children,
    align,
    sideOffset,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    align?: string;
    sideOffset?: number;
  }) => (
    <div
      data-testid="popover-content"
      data-align={align}
      data-side-offset={sideOffset}
      {...props}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/icons/provider-icons", () => ({
  getProviderIcon: () => null,
}));

vi.mock("@lobehub/icons", () => ({
  ModelIcon: () => <div data-testid="lobehub-model-icon" />,
  ProviderIcon: () => <div data-testid="provider-icon" />,
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Search01Icon: "icon",
  ViewIcon: "icon",
  AiBrain02Icon: "icon",
  Wrench01Icon: "icon",
  InternetIcon: "icon",
  AudioWave01Icon: "icon",
  Database01Icon: "icon",
}));

describe("ModelSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const providers: Provider[] = [
      {
        id: "openai",
        name: "OpenAI",
        icon: "O",
        is_enabled: true,
      },
    ];
    const models: Model[] = [
      {
        id: "gpt-4o-mini",
        provider_id: "openai",
        name: "gpt-4o-mini",
        is_enabled: true,
        capabilities: ["vision", "reasoning"],
      },
    ];

    mockEnsureProvidersReady.mockResolvedValue(providers);
    mockLoadActiveSelection.mockResolvedValue({
      activeProviderId: "openai",
      activeModelId: "gpt-4o-mini",
    });
    mockLoadModelsByProvider.mockResolvedValue(models);
  });

  it("shows only capability chips that exist in the currently visible models", async () => {
    render(<ModelSelector />);

    await waitFor(() => {
      expect(screen.getByText("能力标签")).toBeInTheDocument();
    });

    expect(screen.getByText("视觉")).toBeInTheDocument();
    expect(screen.getByText("推理")).toBeInTheDocument();
    expect(screen.queryByText("工具")).not.toBeInTheDocument();
    expect(screen.queryByText("联网")).not.toBeInTheDocument();
    expect(screen.queryByText("免费")).not.toBeInTheDocument();
  });

  it("keeps the trigger and floating picker inside the same high-clarity popover system", async () => {
    render(<ModelSelector />);

    await waitFor(() => {
      expect(screen.getByTestId("model-selector-trigger")).toBeInTheDocument();
    });

    expect(screen.getByTestId("model-selector-trigger")).toHaveAttribute("data-trigger-shape", "pill");
    expect(screen.getByTestId("model-selector-popover")).toHaveAttribute("data-material-role", "floating");
    expect(screen.getByTestId("model-selector-popover")).toHaveAttribute("data-surface-clarity", "high");
    expect(screen.getByTestId("model-selector-popover")).toHaveAttribute("data-align", "start");
    expect(screen.getByTestId("model-selector-popover")).toHaveAttribute("data-side-offset", "10");
    expect(screen.getByPlaceholderText("搜索模型...").closest("[data-surface-tone]")).toHaveAttribute(
      "data-surface-tone",
      "liquid-search-field",
    );
  });

  it("uses shared selection tokens for the active trigger and selected row", async () => {
    render(<ModelSelector />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "选择模型" })).toBeInTheDocument();
    });

    const trigger = screen.getByRole("button", { name: "选择模型" });
    expect(trigger.getAttribute("style")).toContain("var(--selection-active-fill)");
    expect(trigger.getAttribute("style")).toContain("var(--selection-active-foreground)");

    const selectedRow = document.querySelector('div[style*="var(--selection-active-soft-fill)"]');
    expect(selectedRow).not.toBeNull();
    expect(selectedRow?.textContent).toContain("gpt-4o-mini");
    expect(selectedRow?.getAttribute("style")).toContain("var(--selection-active-border)");
  });
});
