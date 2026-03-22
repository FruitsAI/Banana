"use client";

import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";

const WINDOW_CONTROLS = [
  { id: "close", label: "关闭窗口", tone: "#ff5f57" },
  { id: "minimize", label: "最小化窗口", tone: "#febc2e" },
  { id: "zoom", label: "调整窗口", tone: "#28c840" },
] as const;

/**
 * @function Titlebar
 * @description App window titlebar with centered brand label.
 */
export function Titlebar() {
  return (
    <header
      className="titlebar relative z-50 flex h-12 items-center overflow-hidden border-b px-3 sm:px-4"
      data-tauri-drag-region="true"
      style={{
        ...getMaterialSurfaceStyle("chrome", "md"),
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%), var(--material-chrome-background)",
        borderColor: "var(--material-chrome-border)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 32%), radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 30%)",
        }}
      />

      <div className="relative z-10 flex w-24 flex-shrink-0 items-center sm:w-28" data-tauri-drag-region="false">
        <div
          className="flex items-center gap-2 rounded-full border px-2.5 py-1.5"
          data-testid="titlebar-window-controls"
          style={{
            ...getMaterialSurfaceStyle("floating", "sm"),
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.1) 100%), rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.14)",
          }}
        >
          {WINDOW_CONTROLS.map((control) => (
            <button
              key={control.id}
              aria-label={control.label}
              className="relative h-3.5 w-3.5 rounded-full border"
              style={{
                background: `linear-gradient(180deg, rgba(255,255,255,0.38) 0%, ${control.tone} 100%)`,
                borderColor: "rgba(15, 23, 42, 0.12)",
                boxShadow: `0 0 0 1px rgba(255,255,255,0.18) inset, 0 6px 12px ${control.tone}22`,
              }}
              type="button"
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 items-center justify-center" data-tauri-drag-region="true">
        <div
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm"
          style={{
            ...getMaterialSurfaceStyle("content", "sm"),
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.1) 100%), var(--material-content-background)",
          }}
        >
          <span
            className="text-[10px] font-medium uppercase tracking-[0.22em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Workspace
          </span>
          <span className="h-1 w-1 rounded-full" style={{ background: "var(--text-quaternary)" }} />
          <span
            className="text-sm font-semibold tracking-[0.01em]"
            style={{ color: "var(--text-primary)", textShadow: "0 1px 6px rgba(255,255,255,0.18)" }}
          >
            Banana
          </span>
        </div>
      </div>

      <div className="relative z-10 w-24 flex-shrink-0 sm:w-28" data-tauri-drag-region="true" />
    </header>
  );
}
