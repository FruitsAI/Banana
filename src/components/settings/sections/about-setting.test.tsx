/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import packageJson from "../../../../package.json";
import { AboutSetting } from "./about-setting";

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

describe("AboutSetting", () => {
  it("shows the synced app version, current copyright year, and actionable external links", () => {
    render(<AboutSetting />);

    expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} Fruits AI\\. All rights reserved\\.`)),
    ).toBeInTheDocument();

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
  });
});
