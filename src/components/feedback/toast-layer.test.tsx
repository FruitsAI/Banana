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

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: () => ({
    intensity: "medium",
    factors: { duration: 1, distance: 1, scale: 1 },
    isLoading: false,
    setIntensity: vi.fn(),
  }),
}));

describe("ToastLayer", () => {
  it("renders liquid-glass banner notifications in a top-center viewport", async () => {
    const onDismiss = vi.fn();
    const onAction = vi.fn();
    const messages: ToastMessage[] = [
      {
        id: "toast-1",
        title: "保存成功",
        description: "新的模型配置已同步到本地。",
        variant: "success",
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
    expect(toast).toHaveAttribute("data-toast-variant", "success");
    expect(toast.getAttribute("style")).toContain("--liquid-surface-fill");

    fireEvent.click(screen.getByRole("button", { name: "查看" }));
    expect(onAction).toHaveBeenCalledWith("toast-1");
  });
});
