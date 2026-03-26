import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/domain/chat/types";
import { AssistantMessageBody } from "@/components/layout/stage/assistant-message";

const motionPreference = vi.hoisted(() => ({
  value: false as boolean | null,
}));

const { mockCodeToHtml } = vi.hoisted(() => ({
  mockCodeToHtml: vi.fn(async (code: string) => `<pre class="shiki"><code>${code}</code></pre>`),
}));

const { mockMermaidInitialize, mockMermaidRender } = vi.hoisted(() => ({
  mockMermaidInitialize: vi.fn(),
  mockMermaidRender: vi.fn(async (_id: string, code: string) => ({
    svg: `<svg aria-label="mermaid-diagram"><text>${code}</text></svg>`,
  })),
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
  Cancel01Icon: "icon",
  Wrench01Icon: "icon",
  CheckmarkCircle01Icon: "icon",
  Loading01Icon: "icon",
}));

vi.mock("shiki", () => ({
  codeToHtml: mockCodeToHtml,
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: mockMermaidInitialize,
    render: mockMermaidRender,
  },
  initialize: mockMermaidInitialize,
  render: mockMermaidRender,
}));

function renderAssistant(content: string, overrides?: Partial<ChatMessage>) {
  const message: ChatMessage = {
    id: "assistant-message-1",
    role: "assistant",
    content,
    createdAt: "2026-03-20T12:00:00.000Z",
    ...overrides,
  };

  return render(<AssistantMessageBody message={message} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn() },
  });
});

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

  it("renders GFM tables, task lists, and strikethrough content", async () => {
    const content = [
      "| 名称 | 状态 |",
      "| --- | --- |",
      "| Banana | ready |",
      "",
      "- [x] 已完成",
      "- [ ] 进行中",
      "",
      "~~旧内容~~",
    ].join("\n");

    const { container } = renderAssistant(content);

    await waitFor(() => {
      expect(container.querySelector("table")).not.toBeNull();
    });
    expect(screen.getByRole("checkbox", { name: "已完成" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "进行中" })).not.toBeChecked();
    expect(container.querySelector("del")).not.toBeNull();
  });

  it("renders code blocks with highlighting chrome and copies raw code only", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const content = "```ts\nconst answer = 42;\n```";
    const { container } = renderAssistant(content);

    await waitFor(() => {
      expect(container.querySelector(".shiki")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "复制代码" }));

    expect(writeText).toHaveBeenCalledWith("const answer = 42;");
  });

  it("shows a language icon badge for highlighted code blocks", async () => {
    renderAssistant("```ts\nconst badge = true;\n```");

    await waitFor(() => {
      expect(screen.getByLabelText("TS language icon")).toBeInTheDocument();
    });
    expect(screen.getByText("ts")).toBeInTheDocument();
  });

  it("collapses long code blocks by default and expands them on demand", async () => {
    const content = `\`\`\`ts
line 1
line 2
line 3
line 4
line 5
line 6
line 7
line 8
line 9
line 10
line 11
line 12
\`\`\``;

    const { container } = renderAssistant(content);

    await waitFor(() => {
      expect(container.querySelector("[data-code-collapsed='true']")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "展开代码" }));

    await waitFor(() => {
      expect(container.querySelector("[data-code-collapsed='false']")).not.toBeNull();
    });
    expect(screen.getByRole("button", { name: "收起代码" })).toBeInTheDocument();
  });

  it("renders mermaid blocks in a dedicated preview container", async () => {
    const { container } = renderAssistant("```mermaid\nflowchart LR\nA-->B\n```");

    await waitFor(() => {
      expect(container.querySelector("[data-markdown-mermaid='true']")).not.toBeNull();
    });
    expect(screen.getByLabelText("mermaid-diagram")).toBeInTheDocument();
  });

  it("renders inline and block math with katex output", async () => {
    const { container } = renderAssistant("行内公式 $E=mc^2$\n\n$$a^2+b^2=c^2$$");

    await waitFor(() => {
      expect(container.querySelector(".katex")).not.toBeNull();
    });
  });

  it("renders safe links and images with guarded URL handling", async () => {
    const content = [
      "[Banana 官网](https://example.com)",
      "",
      "![Banana 截图](https://example.com/banana.png)",
    ].join("\n");

    renderAssistant(content);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Banana 官网" })).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: "Banana 官网" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));

    const image = screen.getByRole("img", { name: "Banana 截图" });
    expect(image).toHaveAttribute("src", "https://example.com/banana.png");
  });

  it("renders standalone links as preview cards with favicon, protocol badge, and copy action", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const content = "[Banana 文档](https://docs.example.com/guides/markdown?ref=banana)";
    const { container } = renderAssistant(content);

    await waitFor(() => {
      expect(container.querySelector("[data-markdown-link-card='true']")).not.toBeNull();
    });

    expect(screen.getByRole("link", { name: "Banana 文档" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "docs.example.com favicon" })).toHaveAttribute(
      "src",
      "https://www.google.com/s2/favicons?domain=docs.example.com&sz=64",
    );
    expect(screen.getByText("HTTPS")).toBeInTheDocument();
    expect(screen.getByText("docs.example.com")).toBeInTheDocument();
    expect(screen.getByText("/guides/markdown")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "复制链接" }));

    expect(writeText).toHaveBeenCalledWith("https://docs.example.com/guides/markdown?ref=banana");
  });

  it("opens a larger image preview dialog when a markdown image is clicked", async () => {
    renderAssistant("![Banana 截图](https://example.com/banana.png)");

    const previewImage = await screen.findByRole("img", { name: "Banana 截图" });
    fireEvent.click(previewImage);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(screen.getByRole("img", { name: "Banana 截图 预览" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "在新窗口打开" })).toHaveAttribute(
      "href",
      "https://example.com/banana.png",
    );
  });

  it("does not activate unsafe links or raw html payloads", async () => {
    const content = [
      "[危险链接](javascript:alert(1))",
      "",
      "<script>window.__banana = 'owned'</script>",
      "<iframe src=\"https://example.com\"></iframe>",
      "<svg><circle cx=\"10\" cy=\"10\" r=\"10\" /></svg>",
    ].join("\n");

    const { container } = renderAssistant(content);

    await waitFor(() => {
      expect(screen.getByText("危险链接")).toBeInTheDocument();
    });

    expect(screen.queryByRole("link", { name: "危险链接" })).not.toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });
});
