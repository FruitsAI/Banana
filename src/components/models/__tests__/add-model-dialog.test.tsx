import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddModelDialog } from "@/components/models/add-model-dialog";

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
}));

describe("AddModelDialog", () => {
  it("derives default model name and group name from the typed model id", async () => {
    const onSubmitModel = vi.fn(async () => undefined);

    render(
      <AddModelDialog
        open={true}
        onOpenChange={vi.fn()}
        existingModelIds={[]}
        onSubmitModel={onSubmitModel}
      />,
    );

    expect(
      screen.queryByText("录入模型 ID、模型名称和分组名称后，将保存到当前 Provider。"),
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("必填，例如 gpt-4o-mini").className).not.toContain("h-10");
    expect(screen.getByPlaceholderText("例如 GPT-4o Mini").className).not.toContain("h-10");
    expect(screen.getByPlaceholderText("例如 OpenAI").className).not.toContain("h-10");

    fireEvent.change(screen.getByPlaceholderText("必填，例如 gpt-4o-mini"), {
      target: { value: "gpt-5.3-codex" },
    });

    expect(screen.getByPlaceholderText("例如 GPT-4o Mini")).toHaveValue("gpt-5.3-codex");
    expect(screen.getByPlaceholderText("例如 OpenAI")).toHaveValue("gpt-5.3");

    fireEvent.click(screen.getByRole("button", { name: "添加模型" }));

    await waitFor(() => {
      expect(onSubmitModel).toHaveBeenCalledWith({
        modelId: "gpt-5.3-codex",
        modelName: "gpt-5.3-codex",
        groupName: "gpt-5.3",
      });
    });
  });
});
