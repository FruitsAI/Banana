import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { motion } from "framer-motion"

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
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-glass-subtle shadow-sm",
        secondary: "bg-secondary text-secondary-foreground shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary/20 data-[state=active]:font-semibold",
        glass: "border bg-glass-surface text-primary-foreground shadow-sm",
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

  // 判定是否激活液态玻璃特效
  // 为什么：这几种按钮视觉层级较低或为特别强调设计的次级按钮，通过透明磨砂质感和多层边框高光反映苹果原生应用的质感。
  const glassEffect = variant === 'glass' || variant === 'outline' || variant === 'secondary'

  return (
    <motion.div
      className="inline-block"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        style={
          glassEffect
            ? {
                background: variant === 'glass' ? 'var(--glass-surface)' : undefined,
                borderColor: 'var(--glass-border)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }
            : undefined
        }
        {...props}
      >
        {/* 液态玻璃光泽效果 */}
        {glassEffect && (
          <>
            {/* 顶部高光 */}
            <span 
              className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ 
                background: 'linear-gradient(90deg, transparent, var(--glass-highlight), transparent)',
              }}
            />
            {/* 悬浮光晕 */}
            <span 
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center top, var(--glass-glow) 0%, transparent 70%)',
              }}
            />
            {/* 底部阴影 */}
            <span 
              className="absolute -inset-x-2 -bottom-2 h-4 opacity-0 group-hover:opacity-60 transition-opacity duration-300 blur-lg pointer-events-none"
              style={{
                background: 'var(--shadow-lg)',
              }}
            />
          </>
        )}
        
        {/* 主要按钮的液态效果 */}
        {variant === 'default' && (
          <>
            {/* 光泽反射 */}
            <span 
              className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
              }}
            />
            {/* 悬浮光晕 */}
            <span 
              className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-lg pointer-events-none"
              style={{
                background: 'var(--brand-primary)',
              }}
            />
          </>
        )}
        
        {/* 内容层 */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    </motion.div>
  )
}

export { Button, buttonVariants }
