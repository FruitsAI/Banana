import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThreadsSidebar } from "@/components/layout/threads-sidebar";
import type { Thread } from "@/domain/chat/types";

const { mockUseChatStore, mockRouterPush } = vi.hoisted(() => ({
  mockUseChatStore: vi.fn(),
  mockRouterPush: vi.fn(),
}));

function createDeferred<T>() {
  let resolve:
    | ((value: T | PromiseLike<T>) => void)
    | undefined;
  let reject:
    | ((reason?: unknown) => void)
    | undefined;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    resolve: (value: T) => resolve?.(value),
    reject: (reason?: unknown) => reject?.(reason),
  };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/stores/chat/useChatStore", () => ({
  useChatStore: mockUseChatStore,
}));

vi.mock("@/components/ui/search-input", () => ({
  SearchInput: ({
    containerClassName: _containerClassName,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { containerClassName?: string }) => {
    void _containerClassName;
    return <input {...props} />;
  },
}));

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
  Add01Icon: "icon",
  AiMagicIcon: "icon",
  Search01Icon: "icon",
  Delete02Icon: "icon",
}));

vi.mock("uuid", () => ({
  v4: () => "thread-created",
}));

vi.mock("framer-motion", () => {
  const createMotionComponent = (tag: string) =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function MotionComponent(
      { children, ...props },
      ref,
    ) {
      const domProps = {
        ...props,
      } as React.HTMLAttributes<HTMLElement> & Record<string, unknown>;
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.initial;
      delete domProps.transition;
      delete domProps.whileHover;
      delete domProps.whileTap;

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

describe("ThreadsSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render a dead quick-actions footer button when no quick action surface exists", () => {
    mockUseChatStore.mockReturnValue({
      loadThreads: vi.fn(async () => []),
      removeChatThread: vi.fn(),
    });

    render(<ThreadsSidebar />);

    expect(screen.queryByText("快捷指令")).not.toBeInTheDocument();
  });

  it("ignores stale refresh loads so an older response cannot overwrite a newer sidebar snapshot", async () => {
    const firstLoad = createDeferred<Thread[]>();
    const secondLoad = createDeferred<Thread[]>();
    const loadThreads = vi
      .fn()
      .mockImplementationOnce(() => firstLoad.promise)
      .mockImplementationOnce(() => secondLoad.promise);

    mockUseChatStore.mockReturnValue({
      loadThreads,
      removeChatThread: vi.fn(),
    });

    render(<ThreadsSidebar />);

    await act(async () => {
      window.dispatchEvent(new CustomEvent("refresh-threads"));
    });

    secondLoad.resolve([
      {
        id: "thread-new",
        title: "new thread",
        model_id: "gpt-4o-mini",
        created_at: "2026-03-20T10:00:00.000Z",
        updated_at: "2026-03-20T10:00:00.000Z",
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("new thread")).toBeInTheDocument();
    });

    firstLoad.resolve([
      {
        id: "thread-old",
        title: "old thread",
        model_id: "gpt-4o-mini",
        created_at: "2026-03-19T10:00:00.000Z",
        updated_at: "2026-03-19T10:00:00.000Z",
      },
    ]);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("new thread")).toBeInTheDocument();
    expect(screen.queryByText("old thread")).not.toBeInTheDocument();
  });
});
