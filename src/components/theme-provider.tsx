"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

/**
 * ThemeProvider 组件 (主题状态提供方)
 * @description 
 *   基于 `next-themes` 封装的主题上下文 (Context) 提供者。
 *   通常放置在应用根节点，向整个 React 构建树注入浅色/深色/系统偏好的主题状态管理器。
 * @example
 * <ThemeProvider attribute="class" defaultTheme="system">
 *   {children}
 * </ThemeProvider>
 */

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
