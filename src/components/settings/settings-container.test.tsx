import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsContainer from "./settings-container";

vi.mock("./settings-sidebar", () => ({
  SettingsSidebar: ({
    activeTab,
    onTabChange,
  }: {
    activeTab: string;
    onTabChange: (tab: "models" | "mcp" | "theme" | "about") => void;
  }) => (
    <div data-testid="settings-sidebar-mock">
      <span data-testid="settings-sidebar-active">{activeTab}</span>
      <button onClick={() => onTabChange("theme")}>切到主题</button>
    </div>
  ),
}));

vi.mock("./settings-content", () => ({
  SettingsContent: ({ activeTab }: { activeTab: string }) => (
    <div data-testid="settings-content-active">{activeTab}</div>
  ),
}));

describe("SettingsContainer", () => {
  it("renders the layered settings shell and switches tabs through the sidebar", () => {
    render(<SettingsContainer />);

    expect(screen.getByTestId("settings-scene")).toHaveAttribute("data-material-role", "chrome");
    expect(screen.getByTestId("settings-shell")).toHaveAttribute("data-material-role", "chrome");
    expect(screen.getByTestId("settings-shell")).toHaveAttribute("data-settings-shell-tone", "desktop-pane");
    expect(screen.getByTestId("settings-content-frame")).toHaveAttribute(
      "data-material-role",
      "content",
    );
    expect(screen.getByTestId("settings-content-frame")).toHaveAttribute(
      "data-settings-active-tab",
      "models",
    );
    expect(screen.getByTestId("settings-content-atmosphere")).toHaveAttribute(
      "data-settings-atmosphere",
      "models",
    );
    expect(screen.getByTestId("settings-sidebar-active")).toHaveTextContent("models");
    expect(screen.getByTestId("settings-content-active")).toHaveTextContent("models");

    fireEvent.click(screen.getByRole("button", { name: "切到主题" }));

    expect(screen.getByTestId("settings-content-frame")).toHaveAttribute(
      "data-settings-active-tab",
      "theme",
    );
    expect(screen.getByTestId("settings-content-atmosphere")).toHaveAttribute(
      "data-settings-atmosphere",
      "theme",
    );
    expect(screen.getByTestId("settings-sidebar-active")).toHaveTextContent("theme");
    expect(screen.getByTestId("settings-content-active")).toHaveTextContent("theme");
  });
});
