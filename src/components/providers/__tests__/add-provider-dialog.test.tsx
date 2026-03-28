import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddProviderDialog } from "@/components/providers/add-provider-dialog";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
        React.createElement(tag, props, children),
    },
  ),
  useReducedMotion: () => false,
}));

vi.mock("@/components/ui/popover", () => {
  const PopoverContext = React.createContext<{
    open: boolean;
    onOpenChange: (next: boolean) => void;
  }>({
    open: false,
    onOpenChange: () => undefined,
  });

  return {
    Popover: ({
      children,
      open = false,
      onOpenChange = () => undefined,
    }: {
      children: React.ReactNode;
      open?: boolean;
      onOpenChange?: (next: boolean) => void;
    }) => (
      <PopoverContext.Provider value={{ open, onOpenChange }}>
        {children}
      </PopoverContext.Provider>
    ),
    PopoverTrigger: ({
      children,
      asChild,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) => {
      const { open, onOpenChange } = React.useContext(PopoverContext);

      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
          onClick: () => onOpenChange(!open),
        });
      }

      return <button onClick={() => onOpenChange(!open)}>{children}</button>;
    },
    PopoverContent: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement>) => {
      const { open } = React.useContext(PopoverContext);

      if (!open) {
        return null;
      }

      return <div {...props}>{children}</div>;
    },
  };
});

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Add01Icon: "icon",
  ArrowDown01Icon: "icon",
  Tick02Icon: "icon",
}));

describe("AddProviderDialog", () => {
  it("rejects duplicate provider names case-insensitively before submitting", async () => {
    const onSubmitProvider = vi.fn(async () => undefined);

    render(
      <AddProviderDialog
        open={true}
        onOpenChange={vi.fn()}
        existingProviderNames={["OpenAI"]}
        onSubmitProvider={onSubmitProvider}
      />,
    );

    expect(screen.queryByText("录入提供商信息后，将添加到左侧 Provider 列表。")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 OpenAI").className).not.toContain("h-10");

    fireEvent.change(screen.getByPlaceholderText("例如 OpenAI"), {
      target: { value: " openai " },
    });
    fireEvent.click(screen.getByRole("button", { name: "确定" }));

    expect(await screen.findByText("该提供商名称已存在")).toBeInTheDocument();
    expect(onSubmitProvider).not.toHaveBeenCalled();
  });

  it("uses the custom liquid-glass select and submits the chosen provider type", async () => {
    const onSubmitProvider = vi.fn(async () => undefined);

    render(
      <AddProviderDialog
        open={true}
        onOpenChange={vi.fn()}
        existingProviderNames={[]}
        onSubmitProvider={onSubmitProvider}
      />,
    );

    expect(screen.queryByText("录入提供商信息后，将添加到左侧 Provider 列表。")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 OpenAI").className).not.toContain("h-10");

    fireEvent.change(screen.getByPlaceholderText("例如 OpenAI"), {
      target: { value: "Gemini Cloud" },
    });

    const trigger = screen.getByRole("button", { name: "提供商类型" });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Gemini" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));

    await waitFor(() =>
      expect(onSubmitProvider).toHaveBeenCalledWith({
        providerName: "Gemini Cloud",
        providerType: "gemini",
      }),
    );
  });
});
