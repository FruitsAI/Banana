import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
        React.createElement(tag, props, children),
    },
  ),
  useReducedMotion: () => false,
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Add01Icon: "icon",
  ArrowDown01Icon: "icon",
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

    fireEvent.change(screen.getByPlaceholderText("例如 OpenAI"), {
      target: { value: " openai " },
    });
    fireEvent.click(screen.getByRole("button", { name: "确定" }));

    expect(await screen.findByText("该提供商名称已存在")).toBeInTheDocument();
    expect(onSubmitProvider).not.toHaveBeenCalled();
  });
});
