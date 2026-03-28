import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsSidebar } from "./settings-sidebar";

const { mockRouterPush, mockSetTheme } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockSetTheme: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
  }),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement> & {
          layoutId?: string;
          transition?: unknown;
          whileHover?: unknown;
          whileTap?: unknown;
        }) => {
          const domProps = { ...props };
          delete domProps.layoutId;
          delete domProps.transition;
          delete domProps.whileHover;
          delete domProps.whileTap;
          return React.createElement(tag, domProps, children);
        },
    },
  ),
  useReducedMotion: () => false,
}));

describe("SettingsSidebar", () => {
  it("renders the settings nav directly on the sidebar surface and updates the active tab", () => {
    const onTabChange = vi.fn();

    const { rerender } = render(<SettingsSidebar activeTab="models" onTabChange={onTabChange} />);

    expect(screen.getByTestId("settings-sidebar-shell")).toHaveAttribute(
      "data-sidebar-shell",
      "workspace",
    );
    expect(screen.getByTestId("settings-sidebar-shell")).toHaveAttribute(
      "data-sidebar-safe-area",
      "traffic-lights",
    );
    expect(screen.getByTestId("settings-sidebar-shell")).toHaveStyle({
      boxShadow: "var(--liquid-material-rest-shadow)",
    });
    expect(screen.getByRole("tablist", { name: "设置分组" })).toBeInTheDocument();
    expect(screen.queryByTestId("settings-sidebar-nav-group")).not.toBeInTheDocument();
    expect(screen.queryByText("导航")).not.toBeInTheDocument();
    expect(
      screen.queryByText("管理模型、工具与外观偏好，让 Banana 更贴合你的桌面工作流。"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("管理模型平台、默认选择和连接凭据")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-sidebar-current-card")).not.toBeInTheDocument();
    expect(screen.queryByText("当前")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /模型设置/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /模型设置/ }).getAttribute("style")).toContain(
      "var(--selection-active-list-shadow",
    );
    expect(screen.getByRole("tab", { name: /MCP 设置/ })).toHaveAttribute("aria-selected", "false");

    fireEvent.click(screen.getByRole("tab", { name: /MCP 设置/ }));

    expect(onTabChange).toHaveBeenCalledWith("mcp");

    rerender(<SettingsSidebar activeTab="mcp" onTabChange={onTabChange} />);

    expect(screen.getByRole("tab", { name: /MCP 设置/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("当前")).not.toBeInTheDocument();
  });

  it("keeps the home, theme, and settings controls docked at the sidebar bottom", () => {
    const onTabChange = vi.fn();

    render(<SettingsSidebar activeTab="models" onTabChange={onTabChange} />);

    expect(screen.getByTestId("sidebar-utility-dock")).toHaveAttribute(
      "data-sidebar-dock-position",
      "bottom",
    );
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("Dock")).not.toBeInTheDocument();
    expect(screen.queryByText("全局切换与外观控制")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设置" })).toHaveAttribute(
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
});
