import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ChatMessage } from "@/domain/chat/types";
import { AssistantMessageBody } from "@/components/layout/stage/assistant-message";

const motionPreference = vi.hoisted(() => ({
  value: false as boolean | null,
}));

vi.mock("framer-motion", () => {
  const createMotionComponent = (tag: string) =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function MotionComponent(
      { children, ...props },
      ref,
    ) {
      const {
        animate: _animate,
        exit: _exit,
        initial: _initial,
        transition: _transition,
        whileHover: _whileHover,
        whileTap: _whileTap,
        ...domProps
      } = props as React.HTMLAttributes<HTMLElement> & Record<string, unknown>;
      void _animate;
      void _exit;
      void _initial;
      void _transition;
      void _whileHover;
      void _whileTap;

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
    useReducedMotion: () => motionPreference.value,
  };
});

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: () => ({
    factors: { duration: 1, distance: 1, scale: 1 },
    intensity: "medium",
  }),
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  AiBrain01Icon: "icon",
  ArrowRight01Icon: "icon",
  Wrench01Icon: "icon",
  CheckmarkCircle01Icon: "icon",
  Loading01Icon: "icon",
}));

afterEach(() => {
  motionPreference.value = false;
});

describe("AssistantMessageBody", () => {
  it("renders streaming reasoning when reduced motion preference is null", () => {
    motionPreference.value = null;

    const message: ChatMessage = {
      id: "assistant-1",
      role: "assistant",
      content: "",
      segments: [
        {
          type: "reasoning",
          content: "先判断时区",
          isStreaming: true,
        },
      ],
    };

    render(<AssistantMessageBody message={message} />);

    expect(screen.getByText("正在思考...")).toBeInTheDocument();
    expect(screen.getByText("先判断时区")).toBeInTheDocument();
  });
});
