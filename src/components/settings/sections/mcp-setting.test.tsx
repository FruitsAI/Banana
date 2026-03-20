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

  it("opens a market template in the detail editor with prefilled values", async () => {
    await renderSetting("暂无配置服务器，点击“添加”开始。");

    fireEvent.click(screen.getByRole("button", { name: "市场" }));
    fireEvent.click(screen.getByRole("button", { name: "使用 Filesystem 模板" }));

    expect(screen.getByDisplayValue("Filesystem")).toBeInTheDocument();
    expect(screen.getByDisplayValue("npx")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(/@modelcontextprotocol\/server-filesystem/),
    ).toBeInTheDocument();
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
