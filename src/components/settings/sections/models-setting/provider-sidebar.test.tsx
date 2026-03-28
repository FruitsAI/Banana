import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Provider } from "@/domain/models/types";
import { ProviderSidebar } from "./provider-sidebar";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement> & {
          whileHover?: unknown;
          whileTap?: unknown;
        }) => {
          const domProps = { ...props };
          delete domProps.whileHover;
          delete domProps.whileTap;
          return React.createElement(tag, domProps, children);
        },
    },
  ),
}));

vi.mock("@/components/models/model-selector", () => ({
  ModelIcon: () => <div data-testid="model-icon" />,
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Add01Icon: "icon",
  Delete01Icon: "icon",
  Edit03Icon: "icon",
}));

vi.mock("@/components/ui/search-input", () => ({
  SearchInput: ({
    containerClassName,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { containerClassName?: string }) => (
    <div className={containerClassName}>
      <input {...props} />
    </div>
  ),
}));

const providers: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    icon: "O",
    is_enabled: true,
    api_key: "key",
    base_url: "https://api.openai.com/v1",
    provider_type: "openai",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "A",
    is_enabled: true,
    api_key: "key",
    base_url: "https://api.anthropic.com",
    provider_type: "anthropic",
  },
];

describe("ProviderSidebar", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows a right-click menu with edit and delete actions for provider rows", async () => {
    const onOpenEditProvider = vi.fn();
    const onDeleteProvider = vi.fn();

    render(
      <ProviderSidebar
        activeProviderId="openai"
        filteredProviders={providers}
        onDeleteProvider={onDeleteProvider}
        onOpenAddProvider={vi.fn()}
        onOpenEditProvider={onOpenEditProvider}
        onSearchQueryChange={vi.fn()}
        onSelectProvider={vi.fn()}
        searchQuery=""
      />,
    );

    fireEvent.contextMenu(screen.getByRole("option", { name: "Anthropic" }), {
      clientX: 180,
      clientY: 220,
    });

    expect(await screen.findByRole("menu", { name: "平台操作" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "编辑平台" }));

    await waitFor(() => {
      expect(onOpenEditProvider).toHaveBeenCalledWith(providers[1]);
    });

    fireEvent.contextMenu(screen.getByRole("option", { name: "Anthropic" }), {
      clientX: 180,
      clientY: 220,
    });
    fireEvent.click(screen.getByRole("menuitem", { name: "删除平台" }));

    await waitFor(() => {
      expect(onDeleteProvider).toHaveBeenCalledWith(providers[1]);
    });
  });
});
