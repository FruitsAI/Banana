import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Stage } from "@/components/layout/stage";
import { Titlebar } from "@/components/layout/titlebar";
import type { ChatMessage } from "@/domain/chat/types";
import type { ActiveModelSelection, Model, Provider } from "@/domain/models/types";

const { mockUseBananaChat } = vi.hoisted(() => ({
  mockUseBananaChat: vi.fn(),
}));

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

const {
  mockWindowClose,
  mockWindowMinimize,
  mockWindowToggleMaximize,
} = vi.hoisted(() => ({
  mockWindowClose: vi.fn(async () => undefined),
  mockWindowMinimize: vi.fn(async () => undefined),
  mockWindowToggleMaximize: vi.fn(async () => undefined),
}));

const {
  mockEnsureProviderModelsReady,
  mockEnsureProvidersReady,
  mockGetActiveModelSelection,
  mockInferModelCapabilities,
  mockSupportsNativeThinking,
  mockUseAnimationIntensity,
} = vi.hoisted(() => ({
  mockEnsureProviderModelsReady: vi.fn<(providerId: string) => Promise<Model[]>>(async () => []),
  mockEnsureProvidersReady: vi.fn(async (): Promise<Provider[]> => []),
  mockGetActiveModelSelection: vi.fn(async (): Promise<ActiveModelSelection> => ({
    activeProviderId: "openai",
    activeModelId: "gpt-4o-mini",
  })),
  mockInferModelCapabilities: vi.fn((): string[] => []),
  mockSupportsNativeThinking: vi.fn((): boolean => false),
  mockUseAnimationIntensity: vi.fn(),
}));

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
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

vi.mock("@/lib/model-settings", () => ({
  ensureProviderModelsReady: mockEnsureProviderModelsReady,
  ensureProvidersReady: mockEnsureProvidersReady,
  getActiveModelSelection: mockGetActiveModelSelection,
  inferModelCapabilities: mockInferModelCapabilities,
  supportsNativeThinking: mockSupportsNativeThinking,
}));

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: mockUseAnimationIntensity,
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

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    close: mockWindowClose,
    minimize: mockWindowMinimize,
    toggleMaximize: mockWindowToggleMaximize,
  }),
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
    useReducedMotion: () => false,
  };
});

const userMessage: ChatMessage = {
  id: "msg-user-1",
  role: "user",
  content: "hello banana",
  createdAt: "2026-03-20T12:00:00.000Z",
};

describe("Titlebar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: undefined,
      writable: true,
    });
  });

  it("renders native window controls inside the branded drag region", () => {
    render(<Titlebar />);

    expect(screen.getByRole("banner")).toHaveAttribute("data-tauri-drag-region", "true");
    expect(screen.getByTestId("titlebar-window-controls")).toBeInTheDocument();
    expect(screen.getByLabelText("关闭窗口")).toBeInTheDocument();
    expect(screen.getByLabelText("最小化窗口")).toBeInTheDocument();
    expect(screen.getByLabelText("调整窗口")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("routes the traffic-light controls to the current tauri window", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
      writable: true,
    });

    render(<Titlebar />);

    fireEvent.click(screen.getByLabelText("关闭窗口"));
    fireEvent.click(screen.getByLabelText("最小化窗口"));
    fireEvent.click(screen.getByLabelText("调整窗口"));

    await waitFor(() => {
      expect(mockWindowClose).toHaveBeenCalledTimes(1);
      expect(mockWindowMinimize).toHaveBeenCalledTimes(1);
      expect(mockWindowToggleMaximize).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnimationIntensity.mockReturnValue({
      factors: { duration: 1, distance: 1, scale: 1 },
      intensity: "medium",
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("keeps the composer draft until append resolves successfully", async () => {
    let resolveAppend: ((value: boolean) => void) | undefined;
    const append = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveAppend = resolve;
        }),
    );

    mockUseBananaChat.mockReturnValue({
      messages: [],
      append,
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    const composer = screen.getByLabelText("消息输入框");
    fireEvent.change(composer, { target: { value: "hello banana" } });
    fireEvent.click(screen.getByLabelText("发送消息"));

    expect(append).toHaveBeenCalledWith(
      { role: "user", content: "hello banana" },
      { isSearch: true, isThink: true },
    );
    expect(screen.getByLabelText("消息输入框")).toHaveValue("hello banana");

    await act(async () => {
      resolveAppend?.(true);
      await Promise.resolve();
    });

    expect(screen.getByLabelText("消息输入框")).toHaveValue("");
  });

  it("sends the message with search disabled after toggling the search control off", async () => {
    const append = vi.fn(async () => true);

    mockUseBananaChat.mockReturnValue({
      messages: [],
      append,
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    fireEvent.click(screen.getByLabelText("切换联网搜索"));
    fireEvent.change(screen.getByLabelText("消息输入框"), {
      target: { value: "search off" },
    });
    fireEvent.click(screen.getByLabelText("发送消息"));

    await waitFor(() => {
      expect(append).toHaveBeenCalledWith(
        { role: "user", content: "search off" },
        { isSearch: false, isThink: true },
      );
    });
  });

  it("sends the message with thinking disabled after toggling the thinking control off", async () => {
    const append = vi.fn(async () => true);

    mockUseBananaChat.mockReturnValue({
      messages: [],
      append,
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    fireEvent.click(screen.getByLabelText("切换深度思考"));
    fireEvent.change(screen.getByLabelText("消息输入框"), {
      target: { value: "thinking off" },
    });
    fireEvent.click(screen.getByLabelText("发送消息"));

    await waitFor(() => {
      expect(append).toHaveBeenCalledWith(
        { role: "user", content: "thinking off" },
        { isSearch: true, isThink: false },
      );
    });
  });

  it("preserves the composer draft when append reports a failed send", async () => {
    const append = vi.fn(async () => false);

    mockUseBananaChat.mockReturnValue({
      messages: [],
      append,
      isLoading: false,
      error: "API Key 未配置",
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    const composer = screen.getByLabelText("消息输入框");
    fireEvent.change(composer, { target: { value: "hello banana" } });
    fireEvent.click(screen.getByLabelText("发送消息"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByLabelText("消息输入框")).toHaveValue("hello banana");
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

  it("regenerates with the latest toggle state instead of the default flags", async () => {
    const regenerate = vi.fn(async () => undefined);

    mockUseBananaChat.mockReturnValue({
      messages: [
        userMessage,
        {
          id: "msg-assistant-rerun",
          role: "assistant",
          content: "hello again",
          createdAt: "2026-03-20T12:00:05.000Z",
        },
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate,
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("切换联网搜索"));
      fireEvent.click(screen.getByLabelText("切换深度思考"));
    });

    const regenerateButtons = screen.getAllByTitle("重新生成");
    fireEvent.click(regenerateButtons[regenerateButtons.length - 1]);

    await waitFor(() => {
      expect(regenerate).toHaveBeenCalledWith("msg-assistant-rerun", {
        isSearch: false,
        isThink: false,
      });
    });
  });

  it("shows failed MCP tool results with an error state instead of a success badge", () => {
    mockUseBananaChat.mockReturnValue({
      messages: [
        {
          id: "msg-assistant-1",
          role: "assistant",
          content: "tool failed",
          toolInvocations: [
            {
              state: "result",
              toolCallId: "tool-call-1",
              toolName: "get_current_time",
              args: { timezone: "Asia/Shanghai" },
              result: { error: "tool timed out" },
            },
          ],
        },
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    expect(screen.getByText("调用失败")).toBeInTheDocument();
    expect(screen.queryByText("已完成")).not.toBeInTheDocument();
  });

  it("shows send errors even when the conversation is still empty", async () => {
    mockUseBananaChat.mockReturnValue({
      messages: [],
      append: vi.fn(),
      isLoading: false,
      error: "API Key 未配置",
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    await waitFor(() => {
      expect(screen.getByText(/API Key 未配置/)).toBeInTheDocument();
    });
  });

  it("treats the composer as the primary floating surface and quick actions as a secondary lane", async () => {
    mockUseBananaChat.mockReturnValue({
      messages: [],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    expect(screen.getByTestId("stage-empty-hero")).toHaveAttribute(
      "data-stage-tone",
      "workspace-welcome",
    );
    expect(screen.getByTestId("stage-composer")).toHaveAttribute(
      "data-material-role",
      "floating",
    );
    expect(screen.getByTestId("composer-send-control")).toContainElement(
      screen.getByLabelText("发送消息"),
    );
    expect(screen.getByTestId("stage-quick-actions")).toHaveAttribute(
      "data-stage-priority",
      "secondary",
    );
  });

  it("keeps composer controls reachable when the stage drops into reduced motion", async () => {
    mockUseAnimationIntensity.mockReturnValue({
      factors: { duration: 0.82, distance: 0.55, scale: 0.6 },
      intensity: "low",
    });

    mockUseBananaChat.mockReturnValue({
      messages: [],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    expect(screen.getByTestId("stage-composer")).toHaveAttribute(
      "data-motion-mode",
      "reduced",
    );
    expect(screen.getByTestId("composer-send-control")).toBeInTheDocument();
    expect(screen.getByLabelText("切换联网搜索")).toBeInTheDocument();
    expect(screen.getByLabelText("切换深度思考")).toBeInTheDocument();
    expect(screen.getByLabelText("发送消息")).toBeInTheDocument();
  });

  it("keeps the composer toggles semantically pressed as their chrome changes", async () => {
    mockUseBananaChat.mockReturnValue({
      messages: [],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    const searchToggle = screen.getByLabelText("切换联网搜索");
    const thinkingToggle = screen.getByLabelText("切换深度思考");

    expect(searchToggle).toHaveAttribute("aria-pressed", "true");
    expect(thinkingToggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(searchToggle);
    await waitFor(() => {
      expect(screen.getByLabelText("切换联网搜索")).toHaveAttribute("aria-pressed", "false");
    });

    fireEvent.click(screen.getByLabelText("切换深度思考"));

    await waitFor(() => {
      expect(screen.getByLabelText("切换深度思考")).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("renders structured reasoning parts in the thought block", async () => {
    mockUseBananaChat.mockReturnValue({
      messages: [
        {
          id: "msg-assistant-1",
          role: "assistant",
          content: "北京今天是 2026年3月21日",
          reasoning: "先判断时区",
          modelId: "gpt-5.3",
        },
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    fireEvent.click(screen.getByText("推理思维"));

    expect(screen.getByText("先判断时区")).toBeInTheDocument();
    expect(screen.getByText("北京今天是 2026年3月21日")).toBeInTheDocument();
  });

  it("hides raw think tags when assistant content contains multiple think blocks", async () => {
    mockUseBananaChat.mockReturnValue({
      messages: [
        {
          id: "msg-assistant-multi-think",
          role: "assistant",
          content:
            "<think>先判断时区</think>\n\n<think>我得到了纽约的当前时间信息</think>\n\n纽约今天的日期是 **2026年3月21日**，星期六。",
          modelId: "minimaxai/minimax-m2.5",
        },
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    fireEvent.click(screen.getByText("推理思维"));

    expect(screen.getByText("先判断时区")).toBeInTheDocument();
    expect(screen.getByText("我得到了纽约的当前时间信息")).toBeInTheDocument();
    expect(screen.getByText(/纽约今天的日期是/)).toBeInTheDocument();
    expect(screen.queryByText(/<think>/)).not.toBeInTheDocument();
    expect(screen.queryByText(/<\/think>/)).not.toBeInTheDocument();
  });

  it("copies the visible assistant answer without hidden think tags", () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    mockUseBananaChat.mockReturnValue({
      messages: [
        {
          id: "msg-assistant-copy-clean",
          role: "assistant",
          content:
            "<think>先判断时区</think>\n\n<think>我得到了纽约的当前时间信息</think>\n\n纽约今天的日期是 **2026年3月21日**，星期六。",
          modelId: "minimaxai/minimax-m2.5",
        },
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    fireEvent.click(screen.getByTitle("复制"));

    expect(writeText).toHaveBeenCalledWith("纽约今天的日期是 **2026年3月21日**，星期六。");
  });

  it("shows an error toast instead of a success toast when clipboard copy fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    mockUseBananaChat.mockReturnValue({
      messages: [
        {
          id: "msg-assistant-copy-error",
          role: "assistant",
          content: "copy me",
          modelId: "gpt-5.3",
        },
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    fireEvent.click(screen.getByTitle("复制"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("renders assistant segments in the original reasoning tool reasoning answer order", () => {
    mockUseBananaChat.mockReturnValue({
      messages: [
        {
          id: "msg-assistant-ordered",
          role: "assistant",
          content: "纽约今天的日期是 **2026年3月21日**，星期六。",
          reasoning: "先判断时区\n\n我得到了纽约的当前时间信息",
          modelId: "minimaxai/minimax-m2.5",
          segments: [
            {
              type: "reasoning",
              content: "先判断时区",
            },
            {
              type: "tool",
              toolInvocation: {
                state: "result",
                toolCallId: "tool-call-ordered-1",
                toolName: "get_current_time",
                args: { timezone: "America/New_York" },
                result: { now: "2026-03-21 05:52:29" },
              },
            },
            {
              type: "reasoning",
              content: "我得到了纽约的当前时间信息",
            },
            {
              type: "content",
              content: "纽约今天的日期是 **2026年3月21日**，星期六。",
            },
          ],
          toolInvocations: [
            {
              state: "result",
              toolCallId: "tool-call-ordered-1",
              toolName: "get_current_time",
              args: { timezone: "America/New_York" },
              result: { now: "2026-03-21 05:52:29" },
            },
          ],
        },
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    screen.getAllByText("推理思维").forEach((trigger) => {
      fireEvent.click(trigger);
    });

    const firstThought = screen.getByText("先判断时区");
    const tool = screen.getAllByText("get_current_time")[0];
    const secondThought = screen.getByText("我得到了纽约的当前时间信息");
    const answer = screen.getByText(/纽约今天的日期是/);

    expect(firstThought.compareDocumentPosition(tool) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tool.compareDocumentPosition(secondThought) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(secondThought.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("marks thinking as prompt-only when the active model lacks reasoning capability", async () => {
    mockEnsureProvidersReady.mockResolvedValue([
      { id: "openai", name: "OpenAI", icon: "O", is_enabled: true },
    ]);
    mockEnsureProviderModelsReady.mockResolvedValue([
      {
        id: "gpt-4o-mini",
        provider_id: "openai",
        name: "gpt-4o-mini",
        is_enabled: true,
        capabilities: [],
      },
    ]);
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "openai",
      activeModelId: "gpt-4o-mini",
    });
    mockInferModelCapabilities.mockReturnValue([]);
    mockSupportsNativeThinking.mockReturnValue(false);
    mockUseBananaChat.mockReturnValue({
      messages: [],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    await waitFor(() => {
      expect(screen.getByText("当前模型仅提示词思考")).toBeInTheDocument();
    });
  });

  it("keeps native thinking available when the active model supports reasoning", async () => {
    mockEnsureProvidersReady.mockResolvedValue([
      { id: "openai", name: "OpenAI", icon: "O", is_enabled: true },
    ]);
    mockEnsureProviderModelsReady.mockResolvedValue([
      {
        id: "gpt-5.3",
        provider_id: "openai",
        name: "gpt-5.3",
        is_enabled: true,
        capabilities: ["reasoning"],
      },
    ]);
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "openai",
      activeModelId: "gpt-5.3",
    });
    mockInferModelCapabilities.mockReturnValue(["reasoning"]);
    mockSupportsNativeThinking.mockReturnValue(true);
    mockUseBananaChat.mockReturnValue({
      messages: [],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    await waitFor(() => {
      expect(screen.getByText("当前模型支持原生思考")).toBeInTheDocument();
    });
  });

  it("treats Kimi K2.5 as native-thinking capable when the thinking variant is available", async () => {
    mockEnsureProvidersReady.mockResolvedValue([
      { id: "nvidia", name: "NVIDIA", icon: "N", is_enabled: true },
    ]);
    mockEnsureProviderModelsReady.mockResolvedValue([
      {
        id: "moonshotai/kimi-k2.5",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2.5",
        is_enabled: true,
      },
      {
        id: "moonshotai/kimi-k2-thinking",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2-thinking",
        is_enabled: true,
        capabilities: ["reasoning"],
      },
    ]);
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "nvidia",
      activeModelId: "moonshotai/kimi-k2.5",
    });
    mockInferModelCapabilities.mockReturnValue([]);
    mockSupportsNativeThinking.mockReturnValue(true);
    mockUseBananaChat.mockReturnValue({
      messages: [],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    await waitFor(() => {
      expect(mockEnsureProviderModelsReady).toHaveBeenCalledWith("nvidia");
    });
    expect(screen.getByText("当前模型支持原生思考")).toBeInTheDocument();
  });

  it("renders markdown horizontal rules with the custom glass divider style", () => {
    mockUseBananaChat.mockReturnValue({
      messages: [
        {
          id: "msg-assistant-divider",
          role: "assistant",
          content: "第一段\n\n---\n\n第二段",
          modelId: "gpt-5.3",
        },
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    const { container } = render(<Stage />);
    const divider = container.querySelector("hr");

    expect(divider).not.toBeNull();
    expect(divider?.className).toContain("glass-markdown-divider");
  });

  it("resolves assistant model display with provider-scoped identity when model ids collide", async () => {
    mockEnsureProvidersReady.mockResolvedValue([
      { id: "openai", name: "OpenAI", icon: "O", is_enabled: true },
      { id: "openrouter", name: "OpenRouter", icon: "R", is_enabled: true },
    ]);
    mockEnsureProviderModelsReady.mockImplementation(async (providerId: string) => {
      if (providerId === "openai") {
        return [
          {
            id: "shared-model",
            provider_id: "openai",
            name: "OpenAI Shared",
            is_enabled: true,
          },
        ];
      }

      if (providerId === "openrouter") {
        return [
          {
            id: "shared-model",
            provider_id: "openrouter",
            name: "OpenRouter Shared",
            is_enabled: true,
          },
        ];
      }

      return [];
    });
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "openai",
      activeModelId: "shared-model",
    });
    mockUseBananaChat.mockReturnValue({
      messages: [
        {
          id: "msg-assistant-provider-scoped",
          role: "assistant",
          content: "provider scoped answer",
          modelId: "shared-model",
          providerId: "openrouter",
        } as ChatMessage,
      ],
      append: vi.fn(),
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
      updateMessageContent: vi.fn(),
    });

    render(<Stage />);

    await waitFor(() => {
      expect(screen.getByText("OpenRouter Shared")).toBeInTheDocument();
    });
  });
});
