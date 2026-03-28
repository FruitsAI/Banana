import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmLayer } from "./confirm-layer";
import type { ConfirmRequest } from "./types";

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: () => ({
    intensity: "medium",
    factors: { duration: 1, distance: 1, scale: 1 },
    isLoading: false,
    setIntensity: vi.fn(),
  }),
}));

vi.mock("radix-ui", () => {
  const passthrough = (tag = "div") => {
    const MockPrimitive = ({
      children,
      asChild,
      align: _align,
      sideOffset: _sideOffset,
      ...props
    }: React.HTMLAttributes<HTMLElement> & {
      asChild?: boolean;
      align?: string;
      sideOffset?: number;
    }) => {
      void _align;
      void _sideOffset;
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, props);
      }
      return React.createElement(tag, props, children);
    };
    MockPrimitive.displayName = `Mock${tag[0]?.toUpperCase() ?? "D"}${tag.slice(1)}Primitive`;
    return MockPrimitive;
  };

  return {
    Dialog: {
      Root: passthrough(),
      Trigger: passthrough("button"),
      Portal: passthrough(),
      Close: passthrough("button"),
      Overlay: passthrough(),
      Content: passthrough(),
      Title: passthrough("h2"),
      Description: passthrough("p"),
    },
    Slot: {
      Root: passthrough("button"),
    },
  };
});

function createRequest(
  options: ConfirmRequest["options"],
): ConfirmRequest {
  return {
    id: "confirm-1",
    options,
    resolve: vi.fn(),
  };
}

describe("ConfirmLayer", () => {
  it("renders the shared transparent glass confirm shell without a hard footer divider", () => {
    render(
      <ConfirmLayer
        activeRequest={createRequest({
          title: "删除当前服务器",
          description: "删除后将无法恢复。",
          confirmText: "删除",
          cancelText: "再想想",
        })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("dialog-content")).toHaveAttribute(
      "data-surface-tone",
      "liquid-modal",
    );
    expect(screen.getByText("删除当前服务器")).toBeInTheDocument();
    expect(screen.getByText("删除后将无法恢复。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再想想" })).toHaveAttribute(
      "data-variant",
      "glass",
    );
    expect(screen.getByRole("button", { name: "删除" })).toHaveAttribute(
      "data-variant",
      "default",
    );
    expect(document.querySelector('[data-slot="dialog-footer"]')?.className).not.toContain(
      "border-t",
    );
  });

  it("keeps destructive confirmations on the destructive button variant", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmLayer
        activeRequest={createRequest({
          title: "删除模型",
          description: "请再次确认。",
          confirmText: "确认删除",
          cancelText: "取消",
          variant: "destructive",
        })}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.getByRole("button", { name: "确认删除" })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
