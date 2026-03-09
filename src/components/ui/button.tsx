import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Button 组件 (按钮)
 * @description 
 *   基于 `Radix UI` 封装的无障碍按钮组件，使用 `cva` 管理样式变体。
 *   内建了 `framer-motion` 以支持物理弹簧反馈的点击缩放效果，并针对 `glass` (玻璃) 等
 *   变体加入了复杂的液态光泽反射效果。
 * @example
 * <Button variant="default">默认按钮</Button>
 * <Button variant="outline">边框按钮</Button>
 * <Button size="sm">小按钮</Button>
 */

const buttonVariants = cva(
  "relative isolate inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium outline-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100 before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_72%)] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:shadow-[0_10px_24px_var(--brand-primary-glow)]",
        destructive: "bg-destructive text-white shadow-sm hover:shadow-[0_10px_24px_var(--danger-glow)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-transparent shadow-sm hover:shadow-md",
        secondary: "border bg-transparent text-secondary-foreground shadow-sm hover:shadow-md",
        ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary/20 data-[state=active]:font-semibold",
        glass: "border bg-transparent text-primary-foreground shadow-sm hover:shadow-[0_8px_20px_var(--brand-primary-light)]",
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
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const isGlassEffect = variant === "glass" || variant === "outline" || variant === "secondary"
  const glassBackground =
    variant === "glass"
      ? "var(--glass-elevated)"
      : variant === "secondary"
        ? "var(--glass-subtle)"
        : "var(--glass-surface)"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      style={
        isGlassEffect
          ? {
              background: glassBackground,
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }
          : undefined
      }
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Comp>
  )
}

export { Button, buttonVariants }
