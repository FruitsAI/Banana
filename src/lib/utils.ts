import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 核心工具包 (Utility Functions)
 * @description 收录应用中最高频使用、业务无关的纯辅助函数。
 */

/**
 * Class Name Merge Function
 * @description 合并 Tailwind CSS 类名，自动处理冲突
 * @param inputs - 要合并的类名
 * @returns 合并后的类名字符串
 * @example
 * cn("px-4 py-2", "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
