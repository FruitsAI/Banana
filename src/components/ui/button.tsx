import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Button 组件 (黏土风格按钮)
 * @description
 *   基于 `Radix UI` 封装的黏土形态按钮组件。
 *   采用双重阴影系统模拟黏土的蓬松感和按压效果。
 *   悬停时元素上浮，点击时模拟被按下的物理状态。
 * @example
 * <Button variant="default">默认按钮</Button>
 * <Button variant="clay">黏土按钮</Button>
 * <Button variant="primary">主按钮</Button>
 * <Button size="sm">小按钮</Button>
 */

const buttonVariants = cva(
  "relative isolate inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none focus-visible:ring-[4px] focus-visible:ring-[var(--focus-ring)] overflow-hidden transition-all duration-250",
  {
    variants: {
      variant: {
        default: "clay-button text-[var(--text-primary)]",
        primary: "clay-primary text-white",
        clay: "clay-button text-[var(--text-primary)]",
        secondary: "bg-[var(--clay-surface)] text-[var(--text-primary)] shadow-[var(--shadow-clay-sm)] hover:shadow-[var(--shadow-clay-md)] hover:-translate-y-0.5 active:shadow-[var(--shadow-clay-pressed)] active:scale-[0.97]",
        outline: "bg-transparent border-2 border-[var(--glass-border-strong)] text-[var(--text-primary)] hover:bg-[var(--clay-surface)] hover:border-[var(--brand-primary)] hover:-translate-y-0.5 active:translate-y-0",
        ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--clay-surface)] hover:text-[var(--text-primary)] hover:-translate-y-0.5",
        destructive: "bg-[var(--danger)] text-white shadow-[var(--shadow-clay-sm)] hover:shadow-[var(--shadow-clay-md)] hover:-translate-y-0.5 active:shadow-[var(--shadow-clay-pressed)] active:scale-[0.97]",
        soft: "bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shadow-none hover:bg-[var(--brand-primary-lighter)] hover:-translate-y-0.5",
        link: "text-[var(--brand-primary)] underline-offset-4 hover:underline bg-transparent shadow-none",
      },
      size: {
        default: "h-11 px-5 py-2.5 rounded-[var(--r-lg)] text-sm font-semibold",
        xs: "h-7 gap-1 rounded-[var(--r-sm)] px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-[var(--r-md)] gap-1.5 px-3.5 text-sm has-[>svg]:px-3",
        lg: "h-13 rounded-[var(--r-xl)] px-7 text-base has-[>svg]:px-5",
        xl: "h-14 rounded-[var(--r-xl)] px-8 text-base has-[>svg]:px-6",
        icon: "size-11 rounded-[var(--r-lg)]",
        "icon-xs": "size-7 rounded-[var(--r-sm)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-[var(--r-md)]",
        "icon-lg": "size-13 rounded-[var(--r-xl)]",
        "icon-xl": "size-14 rounded-[var(--r-xl)]",
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

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      style={{
        transitionTimingFunction: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      }}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Comp>
  )
}

export { Button, buttonVariants }
