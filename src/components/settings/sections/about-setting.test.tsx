/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AboutSetting } from "./about-setting";

const {
  mockCheckForUpdates,
  mockInstallUpdate,
  mockOpenUrl,
  mockRestartToApplyUpdate,
  mockSkipVersion,
  updateStoreRef,
} = vi.hoisted(() => {
  const mockCheckForUpdates = vi.fn(async () => undefined);
  const mockInstallUpdate = vi.fn(async () => undefined);
  const mockOpenUrl = vi.fn(async () => undefined);
  const mockRestartToApplyUpdate = vi.fn(async () => undefined);
  const mockSkipVersion = vi.fn(async () => undefined);
  const updateStoreRef = {
    current: {
      currentVersion: "0.1.0",
      latestVersion: null,
      publishedAt: null,
      notes: null,
      canInstallInApp: true,
      checkState: "idle",
      installState: "idle",
      errorMessage: null,
      lastCheckedAt: null,
      lastSkippedVersion: null,
      checkForUpdates: mockCheckForUpdates,
      installUpdate: mockInstallUpdate,
      restartToApplyUpdate: mockRestartToApplyUpdate,
      skipVersion: mockSkipVersion,
    },
  };

  return {
    mockCheckForUpdates,
    mockInstallUpdate,
    mockOpenUrl,
    mockRestartToApplyUpdate,
    mockSkipVersion,
    updateStoreRef,
  };
});

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const imageProps = { ...props } as Record<string, unknown>;
    delete imageProps.fill;
    delete imageProps.sizes;
    delete imageProps.priority;

    if (typeof imageProps.alt !== "string") {
      imageProps.alt = "";
    }

    return <img {...(imageProps as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

vi.mock("framer-motion", () => {
  function createMotionComponent(tag: keyof React.JSX.IntrinsicElements) {
    return React.forwardRef<HTMLElement, Record<string, unknown>>(function MotionMock(
      {
        children,
        initial,
        animate,
        transition,
        whileHover,
        whileTap,
        whileFocus,
        exit,
        ...rest
      },
      ref,
    ) {
      void initial;
      void animate;
      void transition;
      void whileHover;
      void whileTap;
      void whileFocus;
      void exit;

      return React.createElement(tag, { ...rest, ref }, children as React.ReactNode);
    });
  }

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) => createMotionComponent(tag as keyof React.JSX.IntrinsicElements),
      },
    ),
  };
});

vi.mock("@/stores/update/useAppUpdateStore", () => ({
  useAppUpdateStore: () => updateStoreRef.current,
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: mockOpenUrl,
}));

describe("AboutSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    updateStoreRef.current = {
      currentVersion: "0.1.0",
      latestVersion: null,
      publishedAt: null,
      notes: null,
      canInstallInApp: true,
      checkState: "idle",
      installState: "idle",
      errorMessage: null,
      lastCheckedAt: null,
      lastSkippedVersion: null,
      checkForUpdates: mockCheckForUpdates,
      installUpdate: mockInstallUpdate,
      restartToApplyUpdate: mockRestartToApplyUpdate,
      skipVersion: mockSkipVersion,
    };
  });

  it("renders the shared settings shell as a compact one-screen brand page", () => {
    render(<AboutSetting />);

    expect(screen.getByTestId("settings-page-frame")).toHaveAttribute(
      "data-settings-page-width",
      "fluid",
    );
    expect(screen.getByTestId("settings-page-frame")).toHaveAttribute(
      "data-settings-page-fill",
      "stage",
    );
    expect(screen.getByTestId("settings-section-shell")).toHaveAttribute(
      "data-material-role",
      "floating",
    );
    expect(screen.getByTestId("settings-section-shell")).toHaveAttribute(
      "data-settings-section",
      "about",
    );
    expect(screen.getAllByTestId("settings-section-group")).toHaveLength(1);

    expect(screen.getByTestId("about-identity")).toBeInTheDocument();
    expect(screen.getByTestId("about-identity")).toHaveAttribute("data-about-layout", "brand-hero");
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(
      screen.getByText("本地优先的桌面 AI 助手，让会话、模型与 MCP 工具在同一处协作。"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("about-version-badge")).toHaveTextContent("v0.1.0");
    expect(screen.getByTestId("about-update-panel")).toBeInTheDocument();
    expect(screen.getByTestId("about-update-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("about-update-status")).toHaveTextContent(
      "启动时会自动检查一次 GitHub 稳定版更新",
    );
    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} Fruits AI\\. All rights reserved\\.`)),
    ).toBeInTheDocument();

    expect(screen.getByTestId("about-resources")).toBeInTheDocument();
    expect(screen.getByTestId("about-resources")).toHaveAttribute(
      "data-about-layout",
      "quick-links",
    );
    expect(screen.getAllByTestId("about-resource-card")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /官方网站/i })).toHaveAttribute(
      "href",
      "https://banana.willxue.com",
    );
    expect(screen.getByRole("link", { name: /GitHub/i })).toHaveAttribute(
      "href",
      "https://github.com/FruitsAI/Banana",
    );
    expect(screen.getByRole("link", { name: /文档/i })).toHaveAttribute(
      "href",
      "https://docs.banana.willxue.com",
    );
    expect(screen.getByTestId("about-tech-stack")).toBeInTheDocument();
    expect(screen.getByText("技术栈")).toBeInTheDocument();
    expect(screen.getAllByTestId("about-tech-card")).toHaveLength(4);
    expect(screen.getByText("Tauri 2")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Vercel AI SDK")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();

    expect(screen.queryByText("Tiny AI Assistant")).not.toBeInTheDocument();
    expect(screen.queryByText("产品事实")).not.toBeInTheDocument();
    expect(screen.queryByText("技术透明度")).not.toBeInTheDocument();
    expect(
      screen.queryByText("访问 Banana 官方站点，了解产品介绍与最新公开信息。"),
    ).not.toBeInTheDocument();
  });

  it("opens resource links through the runtime-specific external opener", () => {
    const openWindowSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<AboutSetting />);

    fireEvent.click(screen.getByRole("link", { name: /官方网站/i }));

    expect(openWindowSpy).toHaveBeenCalledWith(
      "https://banana.willxue.com",
      "_blank",
      "noopener,noreferrer",
    );
    expect(mockOpenUrl).not.toHaveBeenCalled();

    openWindowSpy.mockRestore();
  });

  it("uses the tauri opener for resource links inside the desktop runtime", () => {
    const openWindowSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};

    render(<AboutSetting />);

    fireEvent.click(screen.getByRole("link", { name: /GitHub/i }));

    expect(mockOpenUrl).toHaveBeenCalledWith("https://github.com/FruitsAI/Banana");
    expect(openWindowSpy).not.toHaveBeenCalled();

    openWindowSpy.mockRestore();
  });

  it("switches the primary action to install when a new stable version is available", () => {
    updateStoreRef.current = {
      ...updateStoreRef.current,
      latestVersion: "0.2.0",
      checkState: "available",
    };

    render(<AboutSetting />);

    expect(screen.getByTestId("about-update-status")).toHaveTextContent(
      "发现 v0.2.0，可在应用内完成更新",
    );
    expect(screen.getByTestId("about-update-dot")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("about-update-trigger"));

    expect(mockInstallUpdate).toHaveBeenCalledTimes(1);
  });

  it("switches the primary action to restart after the update is ready", () => {
    updateStoreRef.current = {
      ...updateStoreRef.current,
      latestVersion: "0.2.0",
      checkState: "available",
      installState: "ready_to_restart",
    };

    render(<AboutSetting />);

    expect(screen.getByTestId("about-update-status")).toHaveTextContent(
      "v0.2.0 已准备完成，重启后即可使用",
    );
    expect(screen.getByTestId("about-update-dot")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("about-update-trigger"));

    expect(mockRestartToApplyUpdate).toHaveBeenCalledTimes(1);
  });

  it("surfaces installation failures with an explicit error message", () => {
    updateStoreRef.current = {
      ...updateStoreRef.current,
      latestVersion: "0.2.0",
      checkState: "available",
      installState: "error",
      errorMessage: "安装更新失败，请稍后重试。",
    };

    render(<AboutSetting />);

    expect(screen.getByTestId("about-update-status")).toHaveTextContent(
      "安装更新失败，请稍后重试。",
    );
  });

  it("uses a platform-neutral fallback when in-app updates are unavailable", () => {
    updateStoreRef.current = {
      ...updateStoreRef.current,
      canInstallInApp: false,
      reason: null,
    };

    render(<AboutSetting />);

    expect(screen.getByTestId("about-update-status")).toHaveTextContent(
      "当前安装包暂不支持应用内更新",
    );
  });
});
