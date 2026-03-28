import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ToolInvocation } from "@/domain/chat/types";
import { MessageSurface } from "../message-surface";
import { MessageToolbar } from "../message-toolbar";
import { ToolInvocationCard } from "../tool-invocation-card";

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
    useReducedMotion: () => motionPreference.value,
  };
});

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Refresh01Icon: "icon",
  PencilEdit01Icon: "icon",
  Copy01Icon: "icon",
  Wrench01Icon: "icon",
  CheckmarkCircle01Icon: "icon",
  Loading01Icon: "icon",
}));

afterEach(() => {
  motionPreference.value = false;
});

describe("MessageSurface", () => {
  it("maps assistant, user, reasoning, and tool cards to distinct surface variants", () => {
    render(
      <div>
        <MessageSurface variant="assistant">assistant</MessageSurface>
        <MessageSurface variant="user">user</MessageSurface>
        <MessageSurface variant="reasoning">reasoning</MessageSurface>
        <MessageSurface variant="tool">tool</MessageSurface>
      </div>,
    );

    expect(screen.getByText("assistant").closest("[data-message-variant]")).toHaveAttribute(
      "data-message-variant",
      "assistant",
    );
    expect(screen.getByText("user").closest("[data-message-variant]")).toHaveAttribute(
      "data-message-variant",
      "user",
    );
    expect(screen.getByText("reasoning").closest("[data-message-variant]")).toHaveAttribute(
      "data-message-variant",
      "reasoning",
    );
    expect(screen.getByText("tool").closest("[data-message-variant]")).toHaveAttribute(
      "data-message-variant",
      "tool",
    );
  });

  it("keeps the editing state on the same owning surface instead of swapping to a new panel", () => {
    render(
      <MessageSurface variant="user" state="editing">
        <textarea aria-label="编辑消息" defaultValue="draft" />
      </MessageSurface>,
    );

    expect(screen.getByLabelText("编辑消息").closest("[data-message-variant]")).toHaveAttribute(
      "data-message-variant",
      "user",
    );
    expect(screen.getByLabelText("编辑消息").closest("[data-message-variant]")).toHaveAttribute(
      "data-surface-state",
      "editing",
    );
  });
});

describe("MessageToolbar", () => {
  it("stays docked to the owning message surface", () => {
    const onRegenerate = vi.fn();
    const onEdit = vi.fn();
    const onCopy = vi.fn();

    render(
      <MessageSurface variant="assistant">
        <div>answer</div>
        <MessageToolbar
          ownerId="message-1"
          canEdit
          onRegenerate={onRegenerate}
          onEdit={onEdit}
          onCopy={onCopy}
        />
      </MessageSurface>,
    );

    const toolbar = screen.getByTestId("message-toolbar");
    expect(toolbar).toHaveAttribute("data-toolbar-owner", "message-1");
    expect(toolbar).toHaveAttribute("role", "toolbar");
    expect(toolbar).toHaveAttribute("data-toolbar-visibility", "persistent");
    expect(toolbar.closest("[data-message-surface]")).toBe(
      screen.getByText("answer").closest("[data-message-surface]"),
    );
    expect(toolbar.className).not.toContain("absolute");
    expect(toolbar.className).not.toContain("group-hover:opacity-100");

    fireEvent.click(screen.getByTitle("重新生成"));
    fireEvent.click(screen.getByTitle("编辑"));
    fireEvent.click(screen.getByTitle("复制"));

    expect(onRegenerate).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});

describe("ToolInvocationCard", () => {
  it("renders tool results as a lower-contrast nested tool surface", () => {
    const tool: ToolInvocation = {
      state: "result",
      toolCallId: "tool-call-1",
      toolName: "get_current_time",
      args: { timezone: "Asia/Shanghai" },
      result: { now: "2026-03-22 08:00:00" },
    };

    render(<ToolInvocationCard tool={tool} />);

    const toolSurface = screen.getByText("get_current_time").closest("[data-message-variant]");

    expect(toolSurface).toHaveAttribute("data-message-variant", "tool");
    expect(toolSurface).toHaveAttribute("data-tool-state", "result");
    expect(toolSurface).toHaveAttribute("data-tool-tone", "success");
    expect(screen.getByText("工具调用")).toBeInTheDocument();
    expect(screen.getByText("1 个参数")).toBeInTheDocument();
    expect(screen.getByText("已完成")).toBeInTheDocument();
    expect(screen.getByTestId("tool-invocation-layout").className).toContain("items-center");
    expect(screen.getByTestId("tool-invocation-layout").className).not.toContain("items-start");
    expect(screen.getByTestId("tool-invocation-icon-shell").className).toContain("self-center");
    expect(screen.getByTestId("tool-invocation-status").className).toContain("self-center");
  });

  it("mounts and shows status text when reduced motion preference is null", () => {
    motionPreference.value = null;

    const tool: ToolInvocation = {
      state: "result",
      toolCallId: "tool-call-null-motion",
      toolName: "get_current_time",
      args: { timezone: "Asia/Shanghai" },
      result: { now: "2026-03-22 08:00:00" },
    };

    render(<ToolInvocationCard tool={tool} />);

    expect(screen.getByText("get_current_time")).toBeInTheDocument();
    expect(screen.getByText("已完成")).toBeInTheDocument();
  });
});
