import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Stage } from "@/components/layout/stage";
import type { ChatMessage } from "@/domain/chat/types";

const { mockUseBananaChat, mockGetProvidersForChat, mockGetModelsByProviderForChat } = vi.hoisted(
  () => ({
    mockUseBananaChat: vi.fn(),
    mockGetProvidersForChat: vi.fn(async () => []),
    mockGetModelsByProviderForChat: vi.fn(async () => []),
  }),
);

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "thread" ? "thread-1" : null),
  }),
}));

vi.mock("@/hooks/useBananaChat", () => ({
  useBananaChat: mockUseBananaChat,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    success: vi.fn(),
  }),
}));

vi.mock("@/services/chat", () => ({
  getProvidersForChat: mockGetProvidersForChat,
  getModelsByProviderForChat: mockGetModelsByProviderForChat,
}));

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: () => ({
    factors: { duration: 1, distance: 1, scale: 1 },
    intensity: "medium",
  }),
}));

vi.mock("@/components/models/model-selector", () => ({
  ModelSelector: () => <div data-testid="model-selector" />,
  ModelIcon: () => <div data-testid="model-icon" />,
}));

vi.mock("@/components/ui/iridescent-border", () => ({
  IridescentBorder: () => null,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" "),
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  ArtificialIntelligence08Icon: "icon",
  AiIdeaIcon: "icon",
  RoboticIcon: "icon",
  ArrowUp02Icon: "icon",
  InternetIcon: "icon",
  AiBrain01Icon: "icon",
  ArrowRight01Icon: "icon",
  Refresh01Icon: "icon",
  PencilEdit01Icon: "icon",
  Copy01Icon: "icon",
  Wrench01Icon: "icon",
  CheckmarkCircle01Icon: "icon",
  Loading01Icon: "icon",
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

const userMessage: ChatMessage = {
  id: "msg-user-1",
  role: "user",
  content: "hello banana",
  createdAt: "2026-03-20T12:00:00.000Z",
};

describe("Stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("exits edit mode immediately after saving so reruns stream in the normal message view", async () => {
    let resolveUpdate = () => {};
    const updateMessageContent = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    mockUseBananaChat.mockReturnValue({
      messages: [userMessage],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent,
    });

    render(<Stage />);

    fireEvent.click(screen.getByTitle("编辑"));
    fireEvent.change(screen.getByDisplayValue("hello banana"), {
      target: { value: "edited banana" },
    });
    fireEvent.click(screen.getByText("保存并重发"));

    expect(updateMessageContent).toHaveBeenCalledWith("msg-user-1", "edited banana", {
      isSearch: true,
      isThink: true,
    });

    await waitFor(() => {
      expect(screen.queryByText("保存并重发")).not.toBeInTheDocument();
    });

    await act(async () => {
      resolveUpdate();
    });
  });
});
