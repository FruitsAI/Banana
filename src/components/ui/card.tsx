"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card 组件 (黏土风格卡片)
 * @description
 *   黏土形态的卡片容器，带有蓬松的立体感和柔和的阴影。
 *   支持多种变体：默认悬浮、凹陷、平面等。
 *   所有交互都带有弹性动画效果。
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>标题</CardTitle>
 *     <CardDescription>描述</CardDescription>
 *   </CardHeader>
 *   <CardContent>内容</CardContent>
 * </Card>
 */

interface CardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "inset" | "flat" | "elevated"
  hover?: boolean
}

function Card({
  className,
  variant = "default",
  hover = false,
  ...props
}: CardProps) {
  const variantStyles = {
    default: cn(
      "bg-[var(--clay-surface)] shadow-[var(--shadow-clay-md)]",
      hover && "hover:shadow-[var(--shadow-clay-lg)] hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]"
    ),
    inset: "bg-[var(--clay-surface-dark)] shadow-[var(--shadow-clay-inset)]",
    flat: "bg-[var(--clay-surface)] shadow-none border border-[var(--divider)]",
    elevated: cn(
      "bg-[var(--clay-surface-light)] shadow-[var(--shadow-clay-lg)]",
      hover && "hover:shadow-[var(--shadow-clay-xl)] hover:-translate-y-1.5 transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]"
    ),
  }

  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        "rounded-[var(--r-xl)]",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-2 p-6", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-bold leading-none text-[var(--text-primary)]", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-[var(--text-secondary)] leading-relaxed", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3 p-6 pt-0", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}
