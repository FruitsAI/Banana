import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Switch } from "@/components/ui/switch";
import { TextareaField } from "@/components/ui/textarea-field";
import { SelectionCard } from "@/components/ui/selection-card";
import { CollapsiblePanel } from "@/components/ui/collapsible-panel";
import { NavItem } from "@/components/ui/nav-item";
import { IridescentBorder } from "@/components/ui/iridescent-border";
import { getLiquidSelectionStyle } from "@/components/ui/liquid-selection";

const { mockUseAnimationIntensity } = vi.hoisted(() => ({
  mockUseAnimationIntensity: vi.fn(),
}));

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: mockUseAnimationIntensity,
}));

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  Tick02Icon: "icon",
  ArrowDown01Icon: "icon",
  Search01Icon: "icon",
}));

vi.mock("framer-motion", () => {
  const createMotionComponent = (tag: string) => {
    const Component = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function MotionComponent(
      { children, ...props },
      ref,
    ) {
      const domProps = { ...props } as React.HTMLAttributes<HTMLElement> & Record<string, unknown>;
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.initial;
      delete domProps.layoutId;
      delete domProps.transition;
      delete domProps.whileHover;
      delete domProps.whileTap;
      return React.createElement(tag, { ...domProps, ref }, children);
    });

    Component.displayName = `Motion${tag}`;
    return Component;
  };

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) => createMotionComponent(tag),
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => false,
  };
});

vi.mock("radix-ui", () => {
  const passthrough = (tag = "div") => {
    const Component = ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
      React.createElement(tag, props, children);
    Component.displayName = `Radix${tag}`;
    return Component;
  };

  return {
    Switch: {
      Root: passthrough("button"),
      Thumb: passthrough("span"),
    },
    Label: {
      Root: passthrough("label"),
    },
    Slot: {
      Root: passthrough("button"),
    },
  };
});

describe("material primitives", () => {
  beforeEach(() => {
    mockUseAnimationIntensity.mockReturnValue({
      intensity: "medium",
      factors: { duration: 1, distance: 1, scale: 1 },
      isLoading: false,
      setIntensity: vi.fn(),
    });
  });

  it("exposes explicit material roles for shared surfaces", () => {
    render(
      <>
        <GlassCard data-testid="surface-card" surface="floating">
          floating
        </GlassCard>
        <GlassPanel data-testid="surface-panel" surface="chrome">
          chrome
        </GlassPanel>
      </>,
    );

    expect(screen.getByTestId("surface-card")).toHaveAttribute(
      "data-material-role",
      "floating",
    );
    expect(screen.getByTestId("surface-panel")).toHaveAttribute(
      "data-material-role",
      "chrome",
    );
  });

  it("keeps default glass controls free of iridescent edging unless requested", () => {
    render(
      <>
        <Button variant="glass">Launch</Button>
        <Input aria-label="Material field" />
      </>,
    );

    expect(screen.getByRole("button", { name: "Launch" })).toHaveAttribute(
      "data-iridescent",
      "false",
    );
    expect(
      screen.getByLabelText("Material field").closest("[data-iridescent]"),
    ).toHaveAttribute("data-iridescent", "false");
  });

  it("opts shared glass controls into the runtime liquid interaction layer", () => {
    render(
      <>
        <Button variant="glass">Launch</Button>
        <Input aria-label="Material field" />
      </>,
    );

    expect(screen.getByRole("button", { name: "Launch" })).toHaveAttribute(
      "data-liquid-interactive",
      "true",
    );
    expect(
      screen.getByLabelText("Material field").closest("[data-material-role]"),
    ).toHaveAttribute("data-liquid-interactive", "true");
  });

  it("disables continuous decorative border motion in low intensity mode", () => {
    mockUseAnimationIntensity.mockReturnValue({
      intensity: "low",
      factors: { duration: 0.82, distance: 0.55, scale: 0.6 },
      isLoading: false,
      setIntensity: vi.fn(),
    });

    render(
      <GlassCard
        data-testid="animated-card"
        iridescent
        iridescentAnimated
        surface="floating"
      >
        reduced
      </GlassCard>,
    );

    expect(screen.getByTestId("animated-card")).toHaveAttribute(
      "data-iridescent-animated",
      "false",
    );
  });

  it("keeps iridescent borders on longhand background styles when animation toggles", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(<IridescentBorder animated opacity={0.24} />);

    const border = document.querySelector("[data-iridescent='true']");
    expect(border).toHaveStyle({
      backgroundImage: "var(--iridescent-border)",
      backgroundSize: "300% 300%",
    });

    rerender(<IridescentBorder animated={false} opacity={0.24} />);

    expect(border).toHaveStyle({
      backgroundImage: "var(--iridescent-border)",
      backgroundSize: "100% 100%",
    });
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("exposes liquid-glass surface tones for interactive field and selection primitives", () => {
    render(
      <>
        <Input aria-label="Refined field" />
        <SearchInput aria-label="Search field" />
        <TextareaField aria-label="Detailed field" />
        <Switch aria-label="Refined switch" />
        <SelectionCard isActive onClick={vi.fn()}>
          Active choice
        </SelectionCard>
      </>,
    );

    expect(screen.getByLabelText("Refined field").closest("[data-surface-tone]")).toHaveAttribute(
      "data-surface-tone",
      "liquid-field",
    );
    expect(screen.getByLabelText("Search field").closest("[data-surface-tone]")).toHaveAttribute(
      "data-surface-tone",
      "liquid-search-field",
    );
    expect(screen.getByLabelText("Detailed field").closest("[data-surface-tone]")).toHaveAttribute(
      "data-surface-tone",
      "liquid-textarea-field",
    );
    expect(screen.getByRole("button", { name: "Refined switch" })).toHaveAttribute(
      "data-surface-tone",
      "liquid-switch",
    );
    expect(screen.getByRole("button", { name: /Active choice/i })).toHaveAttribute(
      "data-surface-tone",
      "liquid-selection-card",
    );
  });

  it("keeps shared button and switch controls on the unified desktop control family", () => {
    render(
      <>
        <Button variant="default">Send</Button>
        <Switch aria-label="Enabled switch" checked />
      </>,
    );

    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "data-surface-tone",
      "liquid-button-primary",
    );
    expect(screen.getByRole("button", { name: "Enabled switch" })).toHaveAttribute(
      "data-switch-accent",
      "system-blue",
    );
  });

  it("keeps navigation and collapsible section shells in the same liquid-glass family", () => {
    render(
      <>
        <NavItem icon={"icon"} label="Models" isActive onClick={vi.fn()} />
        <CollapsiblePanel title="Advanced">
          <div>Panel content</div>
        </CollapsiblePanel>
      </>,
    );

    expect(screen.getByRole("button", { name: "Models" })).toHaveAttribute(
      "data-surface-tone",
      "liquid-nav-item",
    );
    expect(screen.getByRole("button", { name: /Advanced/i })).toHaveAttribute(
      "data-surface-tone",
      "liquid-section-trigger",
    );
    expect(screen.getByText("Panel content").closest("[data-surface-tone]")).toHaveAttribute(
      "data-surface-tone",
      "liquid-section-body",
    );
  });

  it("keeps the active navigation selection on the deeper blue liquid accent treatment", () => {
    render(<NavItem icon={"icon"} label="Models" isActive onClick={vi.fn()} />);

    const activeItem = screen.getByRole("button", { name: "Models" });

    expect(activeItem).toHaveAttribute("data-selection-style", "liquid-accent");
    expect(activeItem.getAttribute("style")).toContain("var(--selection-active-fill)");
    expect(activeItem.getAttribute("style")).toContain("var(--selection-active-border)");
    expect(activeItem.getAttribute("style")).toContain("var(--selection-active-shadow)");
  });

  it("keeps idle selection rows flat until hover while preserving a lifted resting shadow for active rows", () => {
    const idleStyle = getLiquidSelectionStyle({
      active: false,
      inactiveRole: "content",
    });
    const activeStyle = getLiquidSelectionStyle({
      active: true,
      inactiveRole: "content",
    });

    expect(idleStyle["--liquid-selection-rest-shadow" as keyof typeof idleStyle]).toBe(
      "var(--liquid-material-rest-shadow)",
    );
    expect(idleStyle["--liquid-selection-hover-shadow" as keyof typeof idleStyle]).toBe(
      "var(--liquid-material-base-shadow)",
    );
    expect(idleStyle.boxShadow).toBe(
      "var(--liquid-selection-shadow, var(--liquid-selection-rest-shadow, var(--liquid-surface-shadow, var(--liquid-material-base-shadow))))",
    );

    expect(activeStyle["--liquid-selection-rest-shadow" as keyof typeof activeStyle]).toBe(
      "var(--selection-active-shadow, var(--liquid-material-base-shadow))",
    );
    expect(activeStyle["--liquid-selection-hover-shadow" as keyof typeof activeStyle]).toBe(
      "var(--selection-active-shadow, var(--liquid-material-base-shadow))",
    );
  });

  it("allows list rows to opt into the stronger shared list shadow token", () => {
    const activeStyle = getLiquidSelectionStyle({
      active: true,
      inactiveRole: "content",
      activeShadow: "var(--selection-active-list-shadow, var(--selection-active-shadow))",
    });

    expect(activeStyle["--liquid-selection-rest-shadow" as keyof typeof activeStyle]).toBe(
      "var(--selection-active-list-shadow, var(--selection-active-shadow))",
    );
    expect(activeStyle["--liquid-selection-hover-shadow" as keyof typeof activeStyle]).toBe(
      "var(--selection-active-list-shadow, var(--selection-active-shadow))",
    );
  });
});
