"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { IridescentBorder } from "@/components/ui/iridescent-border"
import {
  getMaterialSurfaceStyle,
  type MaterialRole,
} from "@/components/ui/material-surface"
import { useAnimationIntensity } from "@/components/animation-intensity-provider"

/**
 * Button Component
 * @description 
 *   Accessible button component with Apple visionOS Liquid Glass design.
 *   Features iridescent edge highlights and premium glass effects.
 * @example
 * <Button variant="default">Default Button</Button>
 * <Button variant="glass">Glass Button</Button>
 * <Button size="sm">Small Button</Button>
 */

const buttonVariants = cva(
  "relative isolate inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none focus-visible:outline-none overflow-hidden",
  {
    variants: {
      variant: {
        default: "border text-white [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        destructive: "border text-white [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        outline: "border [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        secondary: "border [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        ghost: "text-[var(--text-secondary)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        link: "text-[var(--brand-primary)] underline-offset-4 hover:underline data-[state=active]:font-semibold [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        glass: "border [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
      },
      size: {
        default: "h-11 rounded-[22px] px-4 py-2 has-[>svg]:px-3.5",
        xs: "h-7 gap-1 rounded-full px-2.5 text-[11px] has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-[18px] gap-1.5 px-3.5 has-[>svg]:px-3",
        lg: "h-12 rounded-[24px] px-6 has-[>svg]:px-4.5",
        icon: "size-11 rounded-[22px]",
        "icon-xs": "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-[18px]",
        "icon-lg": "size-12 rounded-[24px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  surface,
  iridescent = false,
  iridescentAnimated = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    surface?: Exclude<MaterialRole, "chrome">
    iridescent?: boolean
    iridescentAnimated?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const isMaterialButton = variant !== "ghost" && variant !== "link"
  const { intensity } = useAnimationIntensity()
  const role =
    surface ?? (variant === "default" ? "accent" : variant === "glass" ? "floating" : "content")
  const allowAnimatedIridescence = iridescent && iridescentAnimated && intensity !== "low"
  const depth = size === "lg" || size === "icon-lg" || variant === "default" ? "md" : "sm"
  const tone =
    variant === "default"
      ? "liquid-button-primary"
      : variant === "destructive"
        ? "liquid-button-destructive"
        : variant === "outline"
          ? "liquid-button-outline"
          : variant === "secondary"
            ? "liquid-button-secondary"
            : variant === "glass"
              ? "liquid-button-glass"
              : variant === "ghost"
                ? "liquid-button-ghost"
                : "liquid-button-link"

  const materialStyle = isMaterialButton
    ? {
        ...getMaterialSurfaceStyle(role, depth),
        ["--liquid-surface-fill" as string]:
          variant === "default"
            ? "linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 74%, rgba(255,255,255,0.2)) 0%, color-mix(in srgb, var(--brand-primary) 92%, rgba(15,23,42,0.05)) 100%)"
            : variant === "destructive"
              ? "linear-gradient(180deg, color-mix(in srgb, var(--danger) 74%, rgba(255,255,255,0.14)) 0%, color-mix(in srgb, var(--danger) 90%, rgba(15,23,42,0.04)) 100%)"
              : role === "floating"
                ? "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--liquid-material-base-background)"
                : "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--liquid-material-base-background)",
        borderColor:
          variant === "default"
            ? "color-mix(in srgb, var(--brand-primary) 54%, rgba(255,255,255,0.42))"
            : variant === "destructive"
              ? "color-mix(in srgb, var(--danger) 54%, rgba(255,255,255,0.28))"
              : `var(--material-${role}-border)`,
        color: variant === "default" || variant === "destructive" ? "#ffffff" : "var(--text-primary)",
        boxShadow:
          variant === "default"
            ? "0 14px 30px var(--brand-primary-glow), inset 0 1px 0 rgba(255,255,255,0.32)"
            : variant === "destructive"
              ? "0 14px 28px color-mix(in srgb, var(--danger) 28%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)"
              : "var(--liquid-material-rest-shadow)",
      }
    : undefined

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-liquid-interactive={isMaterialButton ? "true" : undefined}
      data-material-role={isMaterialButton ? role : undefined}
      data-iridescent={isMaterialButton ? String(iridescent) : undefined}
      data-iridescent-animated={isMaterialButton ? String(allowAnimatedIridescence) : undefined}
      data-surface-tone={tone}
      className={cn(buttonVariants({ variant, size, className }))}
      style={
        materialStyle
      }
      {...props}
    >
      {isMaterialButton ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-80"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.74) 18%, rgba(255,255,255,0.12) 82%, transparent 100%)",
          }}
        />
      ) : null}
      {isMaterialButton && iridescent ? (
        <IridescentBorder opacity={0.28} animated={allowAnimatedIridescence} />
      ) : null}
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-2 text-center leading-none",
          variant === "ghost" && "opacity-90 hover:opacity-100",
        )}
      >
        {children}
      </span>
    </Comp>
  )
}

export { Button, buttonVariants }
