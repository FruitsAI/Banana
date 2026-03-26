import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThreadsSidebar } from "@/components/layout/threads-sidebar";
import type { Thread } from "@/domain/chat/types";

const { mockUseChatStore, mockRouterPush, mockActiveThreadId, mockSetTheme } = vi.hoisted(() => ({
  mockUseChatStore: vi.fn(),
  mockRouterPush: vi.fn(),
  mockActiveThreadId: { current: null as string | null },
  mockSetTheme: vi.fn(),
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
    get: () => mockActiveThreadId.current,
  }),
}));

vi.mock("@/stores/chat/useChatStore", () => ({
  useChatStore: mockUseChatStore,
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
  }),
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
      delete domProps.layoutId;
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
    mockActiveThreadId.current = null;
  });

  it("does not render a dead quick-actions footer button when no quick action surface exists", () => {
    mockUseChatStore.mockReturnValue({
      loadThreads: vi.fn(async () => []),
      removeChatThread: vi.fn(),
    });

    render(<ThreadsSidebar />);

    expect(screen.getByTestId("threads-sidebar-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("threads-sidebar-toolbar").className).toContain("px-1.5");
    expect(screen.getByTestId("threads-sidebar-toolbar").className).toContain("sm:px-2");
    expect(screen.getByTestId("threads-sidebar-empty-state")).toHaveAttribute(
      "data-empty-tone",
      "guided",
    );
    expect(screen.getByRole("button", { name: "新建会话" }).className).toContain("border");
    expect(screen.queryByText("快捷指令")).not.toBeInTheDocument();
  });

  it("anchors the global navigation/theme controls in a bottom utility dock", () => {
    mockUseChatStore.mockReturnValue({
      loadThreads: vi.fn(async () => []),
      removeChatThread: vi.fn(),
    });

    render(<ThreadsSidebar />);

    expect(screen.getByTestId("sidebar-utility-dock")).toHaveAttribute(
      "data-sidebar-dock-position",
      "bottom",
    );
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("Dock")).not.toBeInTheDocument();
    expect(screen.queryByText("全局切换与外观控制")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "会话" })).toHaveAttribute(
      "data-selection-style",
      "liquid-accent",
    );

    fireEvent.click(screen.getByRole("button", { name: "会话" }));
    fireEvent.click(screen.getByRole("button", { name: "设置" }));
    fireEvent.click(screen.getByRole("button", { name: "切换主题" }));

    expect(mockRouterPush).toHaveBeenCalledWith("/");
    expect(mockRouterPush).toHaveBeenCalledWith("/settings");
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
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

  it("exposes shell roles and keeps the active thread on the shared liquid selection style", async () => {
    mockActiveThreadId.current = "thread-selected";

    mockUseChatStore.mockReturnValue({
      loadThreads: vi.fn(async () => [
        {
          id: "thread-selected",
          title: "selected thread",
          model_id: "gpt-4o-mini",
          created_at: "2026-03-20T10:00:00.000Z",
          updated_at: "2026-03-20T10:00:00.000Z",
        },
      ]),
      removeChatThread: vi.fn(),
    });

    render(<ThreadsSidebar />);

    await waitFor(() => {
      expect(screen.getByText("selected thread")).toBeInTheDocument();
    });

    expect(screen.getByTestId("threads-sidebar-shell")).toHaveAttribute(
      "data-material-role",
      "chrome",
    );
    expect(screen.getByTestId("threads-sidebar-shell")).toHaveAttribute(
      "data-sidebar-shell",
      "workspace",
    );
    expect(screen.getByTestId("threads-sidebar-shell")).toHaveAttribute(
      "data-sidebar-safe-area",
      "traffic-lights",
    );
    const selectedThreadButton = screen.getByRole("button", { name: /selected thread/i });
    expect(selectedThreadButton).toHaveAttribute("aria-current", "page");
    expect(selectedThreadButton).toHaveAttribute("data-selection-style", "liquid-accent");
    expect(screen.getByText("selected thread").closest("[data-material-role]")).toHaveAttribute(
      "data-material-role",
      "content",
    );
    expect(screen.queryByTestId("thread-selection-indicator")).not.toBeInTheDocument();
  });

  it("renders a guided search empty state instead of leaving the thread column blank", async () => {
    mockUseChatStore.mockReturnValue({
      loadThreads: vi.fn(async () => [
        {
          id: "thread-selected",
          title: "banana planning",
          model_id: "gpt-4o-mini",
          created_at: "2026-03-20T10:00:00.000Z",
          updated_at: "2026-03-20T10:00:00.000Z",
        },
      ]),
      removeChatThread: vi.fn(),
    });

    render(<ThreadsSidebar />);

    await waitFor(() => {
      expect(screen.getByText("banana planning")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("搜索会话记录"), {
      target: { value: "nothing" },
    });

    expect(screen.getByTestId("threads-sidebar-search-empty")).toHaveAttribute(
      "data-empty-tone",
      "search",
    );
  });

  it("clamps the thread context menu and restores focus when dismissed with Escape", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 320,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 240,
      writable: true,
    });

    mockUseChatStore.mockReturnValue({
      loadThreads: vi.fn(async () => [
        {
          id: "thread-selected",
          title: "selected thread",
          model_id: "gpt-4o-mini",
          created_at: "2026-03-20T10:00:00.000Z",
          updated_at: "2026-03-20T10:00:00.000Z",
        },
      ]),
      removeChatThread: vi.fn(),
    });

    render(<ThreadsSidebar />);

    const threadButton = await screen.findByRole("button", { name: /selected thread/i });

    fireEvent.contextMenu(threadButton, { clientX: 999, clientY: 999 });

    const menu = await screen.findByRole("menu", { name: "会话操作" });
    expect(Number.parseFloat(menu.style.left)).toBeLessThan(999);
    expect(Number.parseFloat(menu.style.top)).toBeLessThan(999);

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("menu", { name: "会话操作" })).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /selected thread/i })).toHaveFocus();
    });
  });
});
