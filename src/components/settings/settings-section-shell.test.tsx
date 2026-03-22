import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsSectionGroup, SettingsSectionShell } from "./settings-section-shell";

describe("SettingsSectionShell", () => {
  it("renders a sticky shared header and interactive grouped content surfaces", () => {
    render(
      <SettingsSectionShell
        sectionId="test"
        eyebrow="Test"
        title="测试设置"
        description="用于验证共享设置壳子的层级与交互属性。"
        headerAccessory={<button type="button">操作</button>}
      >
        <SettingsSectionGroup>内容组</SettingsSectionGroup>
      </SettingsSectionShell>,
    );

    expect(screen.getByTestId("settings-section-shell")).toHaveAttribute(
      "data-settings-section",
      "test",
    );
    expect(screen.getByTestId("settings-section-header")).toHaveAttribute(
      "data-sticky-header",
      "true",
    );
    expect(screen.getByTestId("settings-section-header")).toHaveAttribute(
      "data-material-role",
      "floating",
    );
    expect(screen.getByTestId("settings-section-body")).toHaveAttribute(
      "data-settings-body",
      "true",
    );
    expect(screen.getByTestId("settings-section-group")).toHaveAttribute(
      "data-group-interactive",
      "true",
    );
    expect(screen.getByTestId("settings-section-group")).toHaveAttribute(
      "data-hover-surface",
      "content",
    );
    expect(
      within(screen.getByTestId("settings-section-group")).getByTestId(
        "settings-section-group-accent",
      ),
    ).toHaveAttribute("data-group-highlight", "true");
    expect(
      within(screen.getByTestId("settings-section-group")).getByTestId(
        "settings-section-group-edge",
      ),
    ).toHaveAttribute("data-group-edge-highlight", "true");
  });

  it("condenses the sticky header when its section reaches the scroll edge", async () => {
    render(
      <div data-testid="settings-scroll-root" style={{ height: 480, overflowY: "auto" }}>
        <SettingsSectionShell
          sectionId="test"
          title="测试设置"
          description="用于验证滚动时的标题压缩状态。"
        >
          <SettingsSectionGroup>内容组</SettingsSectionGroup>
        </SettingsSectionShell>
      </div>,
    );

    const scrollRoot = screen.getByTestId("settings-scroll-root");
    const section = screen.getByTestId("settings-section-shell");
    const header = screen.getByTestId("settings-section-header");

    let sectionTop = 92;

    Object.defineProperty(scrollRoot, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        x: 0,
        y: 24,
        width: 960,
        height: 480,
        top: 24,
        right: 960,
        bottom: 504,
        left: 0,
        toJSON: () => ({}),
      }),
    });

    Object.defineProperty(section, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        x: 0,
        y: sectionTop,
        width: 960,
        height: 680,
        top: sectionTop,
        right: 960,
        bottom: sectionTop + 680,
        left: 0,
        toJSON: () => ({}),
      }),
    });

    Object.defineProperty(header, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        x: 0,
        y: 0,
        width: 960,
        height: 132,
        top: 0,
        right: 960,
        bottom: 132,
        left: 0,
        toJSON: () => ({}),
      }),
    });

    expect(header).toHaveAttribute("data-header-condensed", "false");

    sectionTop = 20;
    fireEvent.scroll(scrollRoot);

    await waitFor(() => {
      expect(header).toHaveAttribute("data-header-condensed", "true");
    });

    sectionTop = 112;
    fireEvent.scroll(scrollRoot);

    await waitFor(() => {
      expect(header).toHaveAttribute("data-header-condensed", "false");
    });
  });
});
