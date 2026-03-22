import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "@/components/ui/select";

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => null,
}));

vi.mock("@hugeicons/core-free-icons", () => ({
  ArrowDown01Icon: "icon",
  Tick02Icon: "icon",
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement(tag, props, children),
    },
  ),
  useReducedMotion: () => false,
}));

vi.mock("@/components/ui/popover", () => {
  const PopoverContext = React.createContext<{
    open: boolean;
    onOpenChange: (next: boolean) => void;
  }>({
    open: false,
    onOpenChange: () => undefined,
  });

  return {
    Popover: ({
      children,
      open = false,
      onOpenChange = () => undefined,
    }: {
      children: React.ReactNode;
      open?: boolean;
      onOpenChange?: (next: boolean) => void;
    }) => (
      <PopoverContext.Provider value={{ open, onOpenChange }}>
        {children}
      </PopoverContext.Provider>
    ),
    PopoverTrigger: ({
      children,
      asChild,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) => {
      const { open, onOpenChange } = React.useContext(PopoverContext);

      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
          onClick: () => onOpenChange(!open),
        });
      }

      return <button onClick={() => onOpenChange(!open)}>{children}</button>;
    },
    PopoverContent: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement>) => {
      const { open } = React.useContext(PopoverContext);

      if (!open) {
        return null;
      }

      return <div {...props}>{children}</div>;
    },
  };
});

describe("Select", () => {
  it("renders a liquid-glass trigger and custom option list for selection changes", () => {
    const onValueChange = vi.fn();

    render(
      <Select
        aria-label="Provider type"
        value="openai"
        onValueChange={onValueChange}
        options={[
          { label: "OpenAI", value: "openai" },
          { label: "Gemini", value: "gemini" },
          { label: "Anthropic", value: "anthropic" },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Provider type" });
    expect(trigger).toHaveAttribute("data-surface-tone", "liquid-select-trigger");
    expect(trigger).toHaveAttribute("data-liquid-interactive", "true");

    fireEvent.click(trigger);

    const listbox = screen.getByRole("listbox", { name: "Provider type" });
    expect(listbox).toHaveAttribute("data-surface-tone", "liquid-select-content");

    expect(screen.getByRole("option", { name: "Gemini" })).toHaveAttribute(
      "data-liquid-interactive",
      "true",
    );

    fireEvent.click(screen.getByRole("option", { name: "Gemini" }));

    expect(onValueChange).toHaveBeenCalledWith("gemini");
  });
});
