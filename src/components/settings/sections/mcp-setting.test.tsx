import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { McpServer } from "@/domain/mcp/types";
import { McpSetting } from "./mcp-setting";

const loadServersMock = vi.fn<() => Promise<McpServer[]>>();
const saveServerMock = vi.fn();
const removeServerMock = vi.fn();
const confirmMock = vi.fn();
const toastMock = {
  error: vi.fn(),
  success: vi.fn(),
};

vi.mock("@/stores/mcp/useMcpStore", () => ({
  useMcpStore: () => ({
    loadServers: loadServersMock,
    saveServer: saveServerMock,
    removeServer: removeServerMock,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => toastMock,
}));

vi.mock("@/hooks/use-confirm", () => ({
  useConfirm: () => confirmMock,
}));

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: () => ({
    intensity: "medium",
    factors: { duration: 1, distance: 1, scale: 1 },
    isLoading: false,
    setIntensity: vi.fn(),
  }),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement> & {
          initial?: unknown;
          animate?: unknown;
          exit?: unknown;
          transition?: unknown;
        }) => {
          const domProps = { ...props };
          delete domProps.initial;
          delete domProps.animate;
          delete domProps.exit;
          delete domProps.transition;
          return React.createElement(tag, domProps, children);
        },
    },
  ),
  useReducedMotion: () => false,
}));

describe("McpSetting", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => {
        throw new Error("native confirm should not be used");
      }),
    );
    loadServersMock.mockResolvedValue([]);
    saveServerMock.mockReset();
    removeServerMock.mockReset();
    confirmMock.mockReset();
    toastMock.error.mockReset();
    toastMock.success.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function renderSetting(readyText: string | RegExp) {
    render(<McpSetting />);
    await waitFor(() => expect(loadServersMock).toHaveBeenCalled());
    await screen.findByText(readyText);
  }

  it("renders MCP preferences inside the shared shell with grouped content surfaces", async () => {
    render(<McpSetting />);

    expect(screen.getByTestId("settings-page-frame")).toHaveAttribute(
      "data-settings-page-width",
      "fluid",
    );
    await waitFor(() => {
      expect(screen.getByTestId("settings-section-shell")).toHaveAttribute(
        "data-material-role",
        "floating",
      );
    });
    await waitFor(() => expect(loadServersMock).toHaveBeenCalled());
    await screen.findByText("还没有 MCP 服务器");

    expect(screen.getAllByTestId("settings-section-group").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId("mcp-content-stage").closest("[data-mcp-layout='matched']")).not.toBeNull();
    expect(screen.getByTestId("mcp-browser-header-row")).toHaveAttribute(
      "data-settings-title-row",
      "shared",
    );
    expect(screen.getAllByTestId("settings-section-group")[0].className).toContain("sm:p-0");
    expect(screen.getByTestId("mcp-browser-header").className).toContain("flex-none");
    expect(screen.getByTestId("mcp-browser-body").className).toContain("flex-1");
    expect(screen.getByTestId("mcp-connected-header-row")).toHaveAttribute(
      "data-settings-title-row",
      "shared",
    );
    expect(screen.getByRole("tab", { name: /MCP 服务器/ })).toHaveAttribute(
      "data-surface-tone",
      "liquid-nav-item",
    );
    expect(screen.getByRole("tab", { name: /市场/ })).toHaveAttribute(
      "data-surface-tone",
      "liquid-nav-item",
    );
    expect(screen.queryByText("当前")).not.toBeInTheDocument();
  });

  it("pins the MCP add action to a full-width footer row when servers exist", async () => {
    loadServersMock.mockResolvedValue([
      {
        id: "server-1",
        name: "GitHub MCP",
        description: "Repo tools",
        type: "stdio",
        command: "npx",
        args: "-y\n@modelcontextprotocol/server-github",
        env_vars: "GITHUB_PERSONAL_ACCESS_TOKEN=token",
        is_enabled: true,
      },
    ]);

    await renderSetting("GitHub MCP");

    const addButton = screen.getByRole("button", { name: "添加 MCP 服务器" });
    expect(addButton.className).toContain("w-full");
    expect(screen.getByText("GitHub MCP").closest("[data-mcp-server-list-scroll='true']")).not.toBeNull();
  });

  it("shows a guided empty state with shortcuts for the next MCP action", async () => {
    await renderSetting("还没有 MCP 服务器");

    expect(screen.getByRole("button", { name: "添加空白配置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "浏览模板" })).toBeInTheDocument();
    expect(screen.getByTestId("mcp-content-stage")).toHaveAttribute("data-mcp-stage", "builtin");
    expect(screen.getByTestId("mcp-content-stage")).toHaveAttribute(
      "data-mcp-view-mode",
      "list",
    );
  });

  it("updates the shared MCP content stage when switching between list, market, and detail", async () => {
    await renderSetting("还没有 MCP 服务器");

    fireEvent.click(screen.getByRole("button", { name: "浏览模板" }));

    expect(screen.getByTestId("mcp-content-stage")).toHaveAttribute("data-mcp-stage", "market");
    expect(screen.getByTestId("mcp-content-stage")).toHaveAttribute(
      "data-mcp-view-mode",
      "list",
    );
    expect(screen.getByText("MCP 模板与市场")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "使用 Filesystem 模板" }));

    expect(screen.getByTestId("mcp-content-stage")).toHaveAttribute("data-mcp-stage", "market");
    expect(screen.getByTestId("mcp-content-stage")).toHaveAttribute(
      "data-mcp-view-mode",
      "detail",
    );
    expect(screen.getByDisplayValue("Filesystem")).toBeInTheDocument();
  });

  it("opens a market template in the detail editor with prefilled values", async () => {
    await renderSetting("还没有 MCP 服务器");

    fireEvent.click(screen.getByRole("tab", { name: /市场/ }));
    fireEvent.click(screen.getByRole("button", { name: "使用 Filesystem 模板" }));

    expect(screen.getByDisplayValue("Filesystem")).toBeInTheDocument();
    expect(screen.getByDisplayValue("npx")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(/@modelcontextprotocol\/server-filesystem/),
    ).toHaveAttribute("data-surface-tone", "liquid-textarea-field");
  });

  it("does not expose unsupported MCP detail controls", async () => {
    await renderSetting("还没有 MCP 服务器");

    fireEvent.click(screen.getByRole("button", { name: "添加空白配置" }));

    expect(screen.queryByRole("button", { name: "日志" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "SSE" })).not.toBeInTheDocument();
    expect(screen.queryByText("长时间运行模式")).not.toBeInTheDocument();
  });

  it("uses the global confirm flow before deleting a server", async () => {
    loadServersMock.mockResolvedValue([
      {
        id: "server-1",
        name: "GitHub MCP",
        description: "Repo tools",
        type: "stdio",
        command: "npx",
        args: "-y\n@modelcontextprotocol/server-github",
        env_vars: "GITHUB_PERSONAL_ACCESS_TOKEN=token",
        is_enabled: true,
      },
    ]);
    confirmMock.mockResolvedValue(true);

    await renderSetting("GitHub MCP");

    fireEvent.click(
      screen.getByRole("button", { name: "删除 MCP 服务器 GitHub MCP" }),
    );

    await waitFor(() =>
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "删除 MCP 服务器",
          confirmText: "删除",
          variant: "destructive",
        }),
      ),
    );
    await waitFor(() => expect(removeServerMock).toHaveBeenCalledWith("server-1"));
  });

  it("does not delete when the confirm dialog is cancelled", async () => {
    loadServersMock.mockResolvedValue([
      {
        id: "server-2",
        name: "Filesystem",
        description: "Local files",
        type: "stdio",
        command: "npx",
        args: "-y\n@modelcontextprotocol/server-filesystem",
        env_vars: "",
        is_enabled: true,
      },
    ]);
    confirmMock.mockResolvedValue(false);

    await renderSetting("Filesystem");

    fireEvent.click(
      screen.getByRole("button", { name: "删除 MCP 服务器 Filesystem" }),
    );

    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    expect(removeServerMock).not.toHaveBeenCalled();
  });
});
