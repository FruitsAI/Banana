"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import {
  getLiquidSelectionState,
  getLiquidSelectionStyle,
} from "@/components/ui/liquid-selection";

type SidebarUtilityDockView = "home" | "settings";

interface SidebarUtilityDockProps {
  activeView: SidebarUtilityDockView;
}

interface SidebarDockButtonProps {
  active?: boolean;
  label: string;
  onClick: () => void;
}

function SidebarDockButton({
  active = false,
  label,
  onClick,
}: SidebarDockButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      className="sidebar-utility-button material-interactive relative flex min-w-0 items-center justify-center overflow-hidden rounded-[20px] border px-3 py-3 text-sm font-medium"
      data-active={active ? "true" : "false"}
      data-hover-surface={active ? "accent" : "floating"}
      data-selection-style={getLiquidSelectionState(active)}
      onClick={onClick}
      style={getLiquidSelectionStyle({
        active,
        inactiveRole: "floating",
        activeFill: "var(--selection-active-fill)",
        activeBorderColor: "var(--selection-active-border)",
        activeTextColor: "var(--selection-active-foreground)",
        inactiveFill:
          "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%), rgba(255,255,255,0.03)",
      })}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      type="button"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-80"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 20%, rgba(255,255,255,0.08) 80%, transparent 100%)",
        }}
      />
      <span className="relative z-10 truncate">{label}</span>
      {active ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] border"
          layoutId="sidebarUtilityDockBorder"
          style={{ borderColor: "var(--selection-active-border)" }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        />
      ) : null}
    </motion.button>
  );
}

export function SidebarUtilityDock({
  activeView,
}: SidebarUtilityDockProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2"
      data-testid="sidebar-utility-dock"
      data-sidebar-dock-position="bottom"
    >
      <motion.div
        className="rounded-[28px] border p-2.5"
        data-material-role="floating"
        style={{
          ...getMaterialSurfaceStyle("floating", "md"),
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%), rgba(255,255,255,0.04)",
        }}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <SidebarDockButton
              active={activeView === "home"}
              label="会话"
              onClick={() => router.push("/")}
            />
            <SidebarDockButton
              active={activeView === "settings"}
              label="设置"
              onClick={() => router.push("/settings")}
            />
          </div>

          <motion.button
            className="sidebar-utility-theme-toggle material-interactive relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-[20px] border"
            data-hover-surface="floating"
            aria-label="切换主题"
            title="切换主题"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              ...getMaterialSurfaceStyle("floating", "sm"),
              background:
                "radial-gradient(circle at 28% 28%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.18) 28%, transparent 58%), linear-gradient(135deg, rgba(255,204,0,0.24) 0%, rgba(59,130,246,0.14) 100%), rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
            }}
            whileHover={shouldReduceMotion ? undefined : { y: -1, scale: 1.015 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            type="button"
          >
            <span className="sr-only">切换主题</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-3 top-0 h-px opacity-85"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.82) 22%, rgba(255,255,255,0.1) 78%, transparent 100%)",
              }}
            />
            <span
              aria-hidden="true"
              className="relative block h-5 w-5 overflow-hidden rounded-full"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.24), inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 20px rgba(59,130,246,0.18)",
                background:
                  "linear-gradient(135deg, rgba(255,204,0,0.95) 0%, rgba(255,255,255,0.86) 34%, rgba(59,130,246,0.92) 100%)",
              }}
            >
              <span
                className="absolute inset-[3px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.84) 0%, rgba(255,255,255,0.18) 34%, transparent 58%), rgba(15,23,42,0.14)",
                  mixBlendMode: "screen",
                }}
              />
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
