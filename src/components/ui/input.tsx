"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { FieldShell } from "@/components/ui/field-shell"
import { type MaterialRole } from "@/components/ui/material-surface"

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
  return (
    <FieldShell
      iridescent={iridescent}
      iridescentAnimated={iridescentAnimated}
      surface={surface === "accent" ? "content" : surface}
      tone="liquid-field"
    >
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-full w-full min-w-0 border-0 bg-transparent p-0 text-sm file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground selection:bg-primary selection:text-primary-foreground placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)] outline-none disabled:pointer-events-none disabled:cursor-not-allowed",
          className
        )}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        {...props}
      />
    </FieldShell>
  )
}

export { Input }
