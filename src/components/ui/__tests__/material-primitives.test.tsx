import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const { mockUseAnimationIntensity } = vi.hoisted(() => ({
  mockUseAnimationIntensity: vi.fn(),
}));

vi.mock("@/components/animation-intensity-provider", () => ({
  useAnimationIntensity: mockUseAnimationIntensity,
}));

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
});
