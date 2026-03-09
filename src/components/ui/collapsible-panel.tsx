"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  headerActions?: React.ReactNode;
  iconColor?: string;
}

/**
 * CollapsiblePanel Component
 * @description 全局折叠面板组件，使用 framer-motion 实现平滑动画
 */
export function CollapsiblePanel({
  title,
  children,
  defaultOpen = true,
  className,
  headerClassName,
  headerStyle,
  headerActions,
  iconColor = "currentColor",
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center gap-2 p-3 text-sm font-medium transition-colors",
            headerActions ? "pr-12" : undefined,
            headerClassName
          )}
          style={headerStyle}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} style={{ color: iconColor }} />
          </motion.div>
          <div className="flex-1 text-left flex items-center gap-2">
            {title}
          </div>
        </button>
        {headerActions ? (
          <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
            {headerActions}
          </div>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
