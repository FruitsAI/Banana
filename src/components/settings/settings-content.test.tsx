import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsContent } from "./settings-content";

vi.mock("./sections/models-setting", () => ({
  ModelsSetting: () => <div data-testid="models-setting-panel">models</div>,
}));

vi.mock("./sections/mcp-setting", () => ({
  McpSetting: () => <div data-testid="mcp-setting-panel">mcp</div>,
}));

vi.mock("./sections/theme-setting", () => ({
  ThemeSetting: () => <div data-testid="theme-setting-panel">theme</div>,
}));

vi.mock("./sections/about-setting", () => ({
  AboutSetting: () => <div data-testid="about-setting-panel">about</div>,
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

describe("SettingsContent", () => {
  it("renders each settings scene inside a shared transition panel", () => {
    const { rerender } = render(<SettingsContent activeTab="models" />);

    expect(screen.getByTestId("settings-content-scroll")).toHaveAttribute(
      "data-settings-active-tab",
      "models",
    );
    expect(screen.getByTestId("settings-content-panel")).toHaveAttribute(
      "data-settings-active-tab",
      "models",
    );
    expect(screen.getByTestId("settings-content-panel")).toHaveAttribute(
      "data-motion-preset",
      "panel",
    );
    expect(screen.getByTestId("settings-content-panel")).toHaveAttribute("role", "tabpanel");
    expect(screen.getByTestId("settings-content-panel")).toHaveAttribute("id", "settings-panel-models");
    expect(screen.getByTestId("settings-content-panel")).toHaveAttribute(
      "aria-labelledby",
      "settings-tab-models",
    );
    expect(screen.getByTestId("models-setting-panel")).toBeInTheDocument();

    rerender(<SettingsContent activeTab="theme" />);

    expect(screen.getByTestId("settings-content-scroll")).toHaveAttribute(
      "data-settings-active-tab",
      "theme",
    );
    expect(screen.getByTestId("settings-content-panel")).toHaveAttribute(
      "data-settings-active-tab",
      "theme",
    );
    expect(screen.getByTestId("settings-content-panel")).toHaveAttribute("id", "settings-panel-theme");
    expect(screen.getByTestId("settings-content-panel")).toHaveAttribute(
      "aria-labelledby",
      "settings-tab-theme",
    );
    expect(screen.getByTestId("theme-setting-panel")).toBeInTheDocument();
  });
});
