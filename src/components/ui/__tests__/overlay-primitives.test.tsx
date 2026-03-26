import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Cancel01Icon: "icon",
}));

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
    Popover: {
      Root: passthrough(),
      Trigger: passthrough("button"),
      Portal: passthrough(),
      Content: passthrough(),
      Anchor: passthrough(),
    },
    Slot: {
      Root: passthrough("button"),
    },
  };
});

describe("overlay primitives", () => {
  it("renders dialogs as liquid-glass modals with a frosted backdrop", () => {
    render(
      <DialogContent showCloseButton={false}>
        <DialogTitle>删除确认</DialogTitle>
        <DialogDescription>该操作无法撤销。</DialogDescription>
      </DialogContent>,
    );

    expect(screen.getByTestId("dialog-overlay")).toHaveAttribute(
      "data-backdrop-style",
      "frosted-atmosphere",
    );
    expect(screen.getByTestId("dialog-content")).toHaveAttribute(
      "data-surface-tone",
      "liquid-modal",
    );
    expect(screen.getByTestId("dialog-content").getAttribute("style")).toContain(
      "--liquid-surface-fill",
    );
  });

  it("renders popovers inside the same high-clarity liquid-glass family", () => {
    render(
      <Popover>
        <PopoverTrigger>打开</PopoverTrigger>
        <PopoverContent data-testid="popover-content">
          <PopoverTitle>模型能力</PopoverTitle>
          <PopoverDescription>筛选具备工具与联网能力的模型。</PopoverDescription>
        </PopoverContent>
      </Popover>,
    );

    expect(screen.getByTestId("popover-content")).toHaveAttribute(
      "data-surface-tone",
      "liquid-popover",
    );
    expect(screen.getByTestId("popover-content")).toHaveAttribute(
      "data-surface-clarity",
      "high",
    );
    expect(screen.getByTestId("popover-content").getAttribute("style")).toContain(
      "--liquid-surface-fill",
    );
  });
});
