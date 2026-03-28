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
        headerAccessory={<button type="button">操作</button>}
      >
        <SettingsSectionGroup>内容组</SettingsSectionGroup>
      </SettingsSectionShell>,
    );

    expect(screen.getByTestId("settings-section-shell")).toHaveAttribute(
      "data-settings-section",
      "test",
    );
    expect(screen.getByTestId("settings-section-shell")).toHaveAttribute(
      "data-settings-stage-fill",
      "true",
    );
    expect(screen.getByTestId("settings-section-shell")).toHaveStyle({
      boxShadow: "var(--liquid-material-rest-shadow)",
    });
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

  it("supports a scrolling header mode for pages that should let the title area scroll away", () => {
    render(
      <SettingsSectionShell
        sectionId="test"
        eyebrow="Test"
        title="测试设置"
        headerMode="scroll"
        shellOverflow="visible"
      >
        <SettingsSectionGroup>内容组</SettingsSectionGroup>
      </SettingsSectionShell>,
    );

    expect(screen.getByTestId("settings-section-shell").className).toContain("overflow-visible");
    expect(screen.getByTestId("settings-section-header")).toHaveAttribute(
      "data-sticky-header",
      "false",
    );
    expect(screen.getByTestId("settings-section-header")).not.toHaveClass("sticky");
    expect(screen.getByTestId("settings-section-header").className).toContain(
      "rounded-t-[inherit]",
    );
    expect(screen.getByTestId("settings-section-header").className).toContain("overflow-hidden");
  });

  it("condenses the sticky header when its section reaches the scroll edge", async () => {
    render(
      <div data-testid="settings-scroll-root" style={{ height: 480, overflowY: "auto" }}>
        <SettingsSectionShell
          sectionId="test"
          title="测试设置"
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

    fireEvent.scroll(scrollRoot);

    await waitFor(() => {
      expect(header).toHaveAttribute("data-header-condensed", "false");
    });

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
