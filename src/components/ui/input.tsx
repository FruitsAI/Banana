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
      className="group relative overflow-hidden rounded-[20px] border"
      data-liquid-interactive="true"
      data-material-role={surface}
      data-surface-tone="liquid-field"
      data-iridescent={String(iridescent)}
      data-iridescent-animated={String(allowAnimatedIridescence)}
      style={{
        ...getMaterialSurfaceStyle(surface, surface === "floating" ? "md" : "sm"),
        ["--liquid-surface-fill" as string]:
          surface === "floating"
            ? "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)"
            : "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 100%), var(--material-content-background)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-70"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 16%, rgba(255,255,255,0.16) 84%, transparent 100%)",
        }}
      />
      <input
        type={type}
        data-slot="input"
        className={cn(
          "relative z-10 h-11 w-full min-w-0 rounded-[20px] border border-transparent bg-transparent px-4 py-2 text-base file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground selection:bg-primary selection:text-primary-foreground placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary-light)] focus-visible:border-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        {...props}
      />
      {iridescent ? (
        <IridescentBorder
          className="opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
          animated={allowAnimatedIridescence}
        />
      ) : null}
      <span 
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
        style={{
          background: "linear-gradient(90deg, transparent, var(--material-highlight), transparent)",
        }}
      />
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
        aria-hidden="true"
        style={{
          background: "radial-gradient(circle at top left, rgba(255,255,255,0.12), transparent 32%)",
        }}
      />
    </div>
  )
}

export { Input }
