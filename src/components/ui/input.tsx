import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component
 * @description 
 *   Premium input component with Apple visionOS Liquid Glass design.
 *   Features iridescent border effects and smooth focus transitions.
 * @example
 * <Input placeholder="Enter text..." />
 * <Input type="password" />
 */

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="relative group">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-10 w-full min-w-0 rounded-xl border bg-[var(--glass-surface)] px-4 py-2 text-base file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground selection:bg-primary selection:text-primary-foreground placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary-light)] focus-visible:border-[var(--brand-primary)] focus-visible:bg-[var(--glass-overlay)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        style={{
          borderColor: "var(--glass-border)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        {...props}
      />
      <span 
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
        style={{
          padding: "1px",
          background: "var(--iridescent-border)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <span 
        className="absolute inset-x-0 top-0 h-px opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
        }}
      />
    </div>
  )
}

export { Input }
