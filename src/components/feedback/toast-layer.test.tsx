import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastLayer } from "./toast-layer";
import type { ToastMessage } from "./types";

vi.mock("framer-motion", () => {
  const createMotionComponent = (tag: string) =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function MotionComponent(
      { children, ...props },
      ref,
    ) {
      const domProps = { ...props } as React.HTMLAttributes<HTMLElement> & Record<string, unknown>;
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.initial;
      delete domProps.transition;
      return React.createElement(tag, { ...domProps, ref }, children);
    });

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) => createMotionComponent(tag),
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => false,
  };
});

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  CheckmarkCircle01Icon: "CheckmarkCircle01Icon",
  Cancel01Icon: "Cancel01Icon",
}));

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: () => ({
    intensity: "medium",
    factors: { duration: 1, distance: 1, scale: 1 },
    isLoading: false,
    setIntensity: vi.fn(),
  }),
}));

describe("ToastLayer", () => {
  it("renders success notifications as centered blue glass capsules without action buttons", async () => {
    const onDismiss = vi.fn();
    const onAction = vi.fn();
    const messages: ToastMessage[] = [
      {
        id: "toast-success",
        title: "已复制到剪贴板，当前内容会在超长时自动换行而不是被裁掉。",
        description: "这段副文案不应该显示",
        variant: "success",
        duration: 3200,
        actionLabel: "查看",
      },
    ];

    render(<ToastLayer messages={messages} onDismiss={onDismiss} onAction={onAction} />);

    const viewport = await screen.findByTestId("toast-viewport");
    expect(viewport).toHaveAttribute("data-toast-placement", "top-center");
    expect(viewport).toHaveAttribute("data-toast-style", "liquid-banner");

    const toast = screen.getByTestId("toast-item-toast-success");
    expect(toast).toHaveAttribute("data-toast-variant", "success");
    expect(toast).toHaveAttribute("data-toast-shell", "capsule");
    expect(toast).toHaveAttribute("data-toast-layout", "system-capsule");
    expect(screen.getByTestId("toast-shadow-toast-success")).toBeInTheDocument();
    expect(screen.getByTestId("icon-CheckmarkCircle01Icon")).toBeInTheDocument();
    expect(screen.getByTestId("toast-copy-toast-success").className).toContain("text-center");
    expect(screen.getByTestId("toast-copy-toast-success").className).toContain("whitespace-normal");
    expect(screen.getByTestId("toast-copy-toast-success").className).toContain("break-words");
    expect(screen.getByTestId("toast-copy-toast-success").className).not.toContain("truncate");
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
    expect(screen.queryByText("这段副文案不应该显示")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "查看" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "关闭" })).not.toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("renders error notifications as centered red glass capsules without action buttons", async () => {
    const onDismiss = vi.fn();
    const onAction = vi.fn();
    const messages: ToastMessage[] = [
      {
        id: "toast-error",
        title: "复制失败，请稍后再试。",
        variant: "error",
        duration: 3200,
      },
    ];

    render(<ToastLayer messages={messages} onDismiss={onDismiss} onAction={onAction} />);

    const toast = await screen.findByTestId("toast-item-toast-error");
    expect(toast).toHaveAttribute("data-toast-variant", "error");
    expect(toast).toHaveAttribute("data-toast-shell", "capsule");
    expect(screen.getByTestId("toast-shadow-toast-error")).toBeInTheDocument();
    expect(screen.getByTestId("icon-Cancel01Icon")).toBeInTheDocument();
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "关闭" })).not.toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("keeps default notifications on the existing liquid-glass banner layout", async () => {
    const onDismiss = vi.fn();
    const onAction = vi.fn();
    const messages: ToastMessage[] = [
      {
        id: "toast-1",
        title: "保存成功",
        description: "新的模型配置已同步到本地。",
        variant: "default",
        duration: 3200,
        actionLabel: "查看",
      },
    ];

    render(<ToastLayer messages={messages} onDismiss={onDismiss} onAction={onAction} />);

    const viewport = await screen.findByTestId("toast-viewport");
    expect(viewport).toHaveAttribute("data-toast-placement", "top-center");
    expect(viewport).toHaveAttribute("data-toast-style", "liquid-banner");

    const toast = screen.getByTestId("toast-item-toast-1");
    expect(toast).toHaveAttribute("data-feedback-surface", "liquid-banner");
    expect(toast).toHaveAttribute("data-toast-variant", "default");
    expect(toast).toHaveAttribute("data-toast-shell", "banner");
    expect(toast).toHaveAttribute("data-toast-layout", "system-banner");
    expect(toast.getAttribute("style")).toContain("--liquid-surface-fill");
    expect(screen.getByTestId("toast-actions-toast-1")).toHaveAttribute(
      "data-toast-actions",
      "trailing",
    );

    fireEvent.click(screen.getByRole("button", { name: "查看" }));
    expect(onAction).toHaveBeenCalledWith("toast-1");
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });
});
