import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input 组件 (标准输入框)
 * @description 
 *   支持统一的聚焦发光效果和无自动补全的输入域。
 *   通过在 `onFocus` 和 `onBlur` 中动态直接修改 DOM 的 style 属性来规避复杂的状态流转重渲染，以实现绝佳的性能。
 * @example
 * <Input placeholder="请输入内容" />
 * <Input type="password" />
 */

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-10 w-full min-w-0 rounded-xl px-4 py-2 text-base transition-all duration-200 ease-out file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      style={{
        background: 'var(--glass-surface)',
        border: '1px solid var(--glass-border)',
      }}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      onFocus={(e) => {
        e.currentTarget.style.background = 'var(--glass-overlay)';
        e.currentTarget.style.borderColor = 'var(--brand-primary)';
        e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-primary-light)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = 'var(--glass-surface)';
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      {...props}
    />
  )
}

export { Input }
