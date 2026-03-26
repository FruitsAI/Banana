import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Provider } from "@/domain/models/types";
import { ManageModelsDialog } from "@/components/models/manage-models-dialog";

const { inferModelCapabilitiesMock } = vi.hoisted(() => ({
  inferModelCapabilitiesMock: vi.fn((providerId: string, modelId: string) => {
    void providerId;
    if (modelId === "reasoner-pro") {
      return ["reasoning"];
    }
    if (modelId === "embedder-lite") {
      return ["embedding"];
    }
    if (modelId === "search-alpha") {
      return ["web"];
    }
    return [];
  }),
}));

vi.mock("@/lib/model-settings", () => ({
  inferModelCapabilities: inferModelCapabilitiesMock,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => ({
        children,
        ...props
      }: React.HTMLAttributes<HTMLElement> & {
        layoutId?: string;
        whileHover?: unknown;
        whileTap?: unknown;
        transition?: unknown;
      }) => {
        const domProps = {
          ...props,
        } as React.HTMLAttributes<HTMLElement> & {
          layoutId?: string;
          whileHover?: unknown;
          whileTap?: unknown;
          transition?: unknown;
        };
        delete domProps.layoutId;
        delete domProps.transition;
        delete domProps.whileHover;
        delete domProps.whileTap;
        return React.createElement(tag, domProps, children);
      },
    },
  ),
  useReducedMotion: () => false,
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Search01Icon: "icon",
  LoadingIcon: "icon",
  CheckmarkCircle01Icon: "icon",
}));

vi.mock("@/components/models/model-selector", () => ({
  ModelIcon: () => <div data-testid="model-icon" />,
}));

const activeProvider: Provider = {
  id: "openai",
  name: "OpenAI",
  icon: "O",
  is_enabled: true,
  provider_type: "openai",
};

describe("ManageModelsDialog", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          models: [
            { id: "reasoner-pro", name: "Reasoner Pro", owned_by: "OpenAI" },
            { id: "embedder-lite", name: "Embedder Lite", owned_by: "OpenAI" },
            { id: "search-alpha", name: "Search Alpha", owned_by: "OpenAI" },
          ],
        }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("derives category tabs from inferred remote model capabilities instead of heuristic ids", async () => {
    render(
      <ManageModelsDialog
        open={true}
        onOpenChange={vi.fn()}
        activeProvider={activeProvider}
        existingModels={[]}
        apiKey="test-key"
        baseUrl="https://api.openai.com/v1"
        onAddModels={vi.fn(async () => undefined)}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Reasoner Pro")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "推理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "嵌入" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "联网" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "免费" })).not.toBeInTheDocument();
    expect(screen.getByText("Reasoner Pro").closest("[data-selection-style]")).toHaveAttribute(
      "data-selection-style",
      "idle",
    );
    expect(
      screen.getByText("Reasoner Pro").closest("[data-selection-style]")?.getAttribute("style"),
    ).toContain("var(--liquid-selection-shadow");

    fireEvent.click(screen.getByRole("button", { name: "推理" }));

    expect(screen.getByText("Reasoner Pro")).toBeInTheDocument();
    expect(screen.queryByText("Embedder Lite")).not.toBeInTheDocument();
    expect(screen.queryByText("Search Alpha")).not.toBeInTheDocument();
  });
});
