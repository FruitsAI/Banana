"use client";

/**
 * @function Titlebar
 * @description App window titlebar with centered brand label.
 */
export function Titlebar() {
  return (
    <header
      className="titlebar h-9 flex items-center px-3 sm:px-4 relative z-50"
      data-tauri-drag-region="true"
    >
      <div className="w-16 sm:w-20 flex-shrink-0" style={{ pointerEvents: "none" }} />

      <div
        className="flex-1 flex items-center justify-center min-w-0"
        data-tauri-drag-region="true"
      >
        <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Banana
        </span>
      </div>

      <div className="w-16 sm:w-20 flex-shrink-0" style={{ pointerEvents: "none" }} />
    </header>
  );
}
