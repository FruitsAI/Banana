"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { IridescentBorder } from "@/components/ui/iridescent-border"
import {
  getMaterialSurfaceStyle,
  type MaterialRole,
} from "@/components/ui/material-surface"
import { useAnimationIntensity } from "@/components/animation-intensity-provider"

/**
 * Input Component
 * @description 
 *   Premium input component with Apple visionOS Liquid Glass design.
 *   Features iridescent border effects and smooth focus transitions.
 * @example
 * <Input placeholder="Enter text..." />
 * <Input type="password" />
 */

function Input({
  className,
  type,
  iridescent = false,
  iridescentAnimated = false,
  surface = "content",
  ...props
}: React.ComponentProps<"input"> & {
  iridescent?: boolean
  iridescentAnimated?: boolean
  surface?: Exclude<MaterialRole, "chrome">
}) {
  const { intensity } = useAnimationIntensity()
  const allowAnimatedIridescence = iridescent && iridescentAnimated && intensity !== "low"

  return (
    <div
      className="relative group border rounded-xl"
      data-material-role={surface}
      data-iridescent={String(iridescent)}
      data-iridescent-animated={String(allowAnimatedIridescence)}
      style={getMaterialSurfaceStyle(surface, surface === "floating" ? "md" : "sm")}
    >
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-10 w-full min-w-0 rounded-xl border border-transparent bg-transparent px-4 py-2 text-base file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground selection:bg-primary selection:text-primary-foreground placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary-light)] focus-visible:border-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        {...props}
      />
      {iridescent ? (
        <IridescentBorder
          className="opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
          animated={allowAnimatedIridescence}
        />
      ) : null}
      <span 
        className="absolute inset-x-0 top-0 h-px opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, var(--material-highlight), transparent)",
        }}
      />
    </div>
  )
}

export { Input }
