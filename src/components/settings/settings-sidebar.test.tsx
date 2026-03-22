import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsSidebar } from "./settings-sidebar";

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
  it("renders the settings nav inside a grouped surface and updates the current-section summary", () => {
    const onTabChange = vi.fn();

    const { rerender } = render(<SettingsSidebar activeTab="models" onTabChange={onTabChange} />);

    expect(screen.getByRole("tablist", { name: "设置分组" })).toBeInTheDocument();
    expect(screen.getByTestId("settings-sidebar-nav-group")).toHaveAttribute(
      "data-material-role",
      "content",
    );
    expect(screen.getByTestId("settings-sidebar-current-card")).toHaveTextContent("当前分组");
    expect(screen.getByTestId("settings-sidebar-current-card")).toHaveTextContent("模型设置");
    expect(screen.getByTestId("settings-sidebar-current-card")).toHaveTextContent("管理模型平台、默认选择和连接凭据");
    expect(screen.getByRole("tab", { name: /模型设置/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /MCP 设置/ })).toHaveAttribute("aria-selected", "false");

    fireEvent.click(screen.getByRole("tab", { name: /MCP 设置/ }));

    expect(onTabChange).toHaveBeenCalledWith("mcp");

    rerender(<SettingsSidebar activeTab="mcp" onTabChange={onTabChange} />);

    expect(screen.getByTestId("settings-sidebar-current-card")).toHaveTextContent("MCP 设置");
    expect(screen.getByTestId("settings-sidebar-current-card")).toHaveTextContent("整理工具服务器、模板和运行方式");
    expect(screen.getByRole("tab", { name: /MCP 设置/ })).toHaveAttribute("aria-selected", "true");
  });
});
