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
  "relative isolate inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium outline-none transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none focus-visible:ring-[3px] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:shadow-[0_10px_24px_var(--brand-primary-glow)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        destructive: "bg-destructive text-white shadow-sm hover:shadow-[0_10px_24px_var(--danger-glow)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        outline: "border bg-transparent shadow-sm hover:shadow-md [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        secondary: "border bg-transparent text-secondary-foreground shadow-sm hover:shadow-md [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary/20 data-[state=active]:font-semibold [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        glass: "border bg-transparent text-primary-foreground shadow-sm hover:shadow-[0_8px_20px_var(--brand-primary-light)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
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
  const isGlassEffect = variant === "glass" || variant === "outline" || variant === "secondary"
  const { intensity } = useAnimationIntensity()
  const role =
    surface ?? (variant === "glass" ? "floating" : variant === "secondary" ? "content" : "content")
  const allowAnimatedIridescence = iridescent && iridescentAnimated && intensity !== "low"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-material-role={isGlassEffect ? role : undefined}
      data-iridescent={isGlassEffect ? String(iridescent) : undefined}
      data-iridescent-animated={isGlassEffect ? String(allowAnimatedIridescence) : undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      style={
        isGlassEffect
          ? {
              ...getMaterialSurfaceStyle(role, variant === "glass" ? "md" : "sm"),
            }
          : undefined
      }
      {...props}
    >
      {isGlassEffect && iridescent ? (
        <IridescentBorder opacity={0.28} animated={allowAnimatedIridescence} />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Comp>
  )
}

export { Button, buttonVariants }
