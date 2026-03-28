"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";

interface SettingsSectionShellProps {
  sectionId: string;
  eyebrow?: string;
  title: string;
  headerAccessory?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerMode?: "sticky" | "scroll";
  shellOverflow?: "hidden" | "visible";
}

interface SettingsSectionGroupProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  interactive?: boolean;
}

interface SettingsSectionTitleRowProps {
  accessory?: ReactNode;
  className?: string;
  icon?: ReactNode;
  testId?: string;
  title: string;
}

function findNearestScrollParent(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement ?? null;

  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = `${style.overflowY} ${style.overflow}`;

    if (/(auto|scroll|overlay)/.test(overflowY)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

const HEADER_STICKY_SNAP_PX = 2;
export function SettingsSectionTitleRow({
  accessory,
  className,
  icon,
  testId,
  title,
}: SettingsSectionTitleRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-6 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      data-settings-title-row="shared"
      data-testid={testId}
    >
      <div className="flex min-h-6 items-center gap-2">
        <h3 className="text-sm font-semibold leading-6" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        {icon}
      </div>

      {accessory ? <div className="flex shrink-0 items-center gap-3">{accessory}</div> : null}
    </div>
  );
}

export function SettingsSectionShell({
  sectionId,
  eyebrow,
  title,
  headerAccessory,
  children,
  className,
  contentClassName,
  headerMode = "sticky",
  shellOverflow = "hidden",
}: SettingsSectionShellProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerCondensed, setHeaderCondensed] = useState(false);
  const isStickyHeader = headerMode === "sticky";
  const effectiveHeaderCondensed = isStickyHeader && headerCondensed;

  useEffect(() => {
    if (!isStickyHeader) {
      return;
    }

    const sectionElement = sectionRef.current;
    const headerElement = headerRef.current;

    if (!sectionElement || !headerElement) {
      return;
    }

    const scrollParent = findNearestScrollParent(sectionElement);

    const updateHeaderState = () => {
      const sectionRect = sectionElement.getBoundingClientRect();
      const rootTop = scrollParent?.getBoundingClientRect().top ?? 0;
      const hasReachedScrollEdge = sectionRect.top <= rootTop + HEADER_STICKY_SNAP_PX;
      const nextCondensed = hasReachedScrollEdge;

      setHeaderCondensed((current) => (current === nextCondensed ? current : nextCondensed));
    };

    updateHeaderState();

    const scrollTarget: HTMLElement | Window = scrollParent ?? window;
    scrollTarget.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState);

    return () => {
      scrollTarget.removeEventListener("scroll", updateHeaderState);
      window.removeEventListener("resize", updateHeaderState);
    };
  }, [isStickyHeader]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "flex min-h-full flex-1 flex-col rounded-[28px] border",
        shellOverflow === "visible" ? "overflow-visible" : "overflow-hidden",
        className,
      )}
      data-header-condensed={effectiveHeaderCondensed ? "true" : "false"}
      data-settings-stage-fill="true"
      data-testid="settings-section-shell"
      data-material-role="floating"
      data-settings-section={sectionId}
      style={{
        ...getMaterialSurfaceStyle("floating", "md"),
        boxShadow: "var(--liquid-material-rest-shadow)",
      }}
    >
      <div
        ref={headerRef}
        className={cn(
          "z-10 overflow-hidden rounded-t-[inherit] border-b px-6 transition-[padding,background-color,box-shadow,backdrop-filter] duration-300 ease-out sm:px-7",
          isStickyHeader ? "sticky top-0" : "",
          effectiveHeaderCondensed ? "pb-4 pt-4 sm:pb-5 sm:pt-5" : "pb-5 pt-6 sm:pb-6 sm:pt-7",
        )}
        data-header-condensed={effectiveHeaderCondensed ? "true" : "false"}
        data-testid="settings-section-header"
        data-material-role="floating"
        data-sticky-header={isStickyHeader ? "true" : "false"}
        style={{
          background:
            effectiveHeaderCondensed
              ? "color-mix(in srgb, var(--material-floating-background) 96%, transparent)"
              : "color-mix(in srgb, var(--material-floating-background) 92%, transparent)",
          borderColor: "var(--divider)",
          boxShadow: effectiveHeaderCondensed
            ? "0 14px 28px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.52)"
            : "inset 0 1px 0 rgba(255,255,255,0.24)",
          backdropFilter: effectiveHeaderCondensed
            ? "blur(28px) saturate(190%)"
            : "blur(24px) saturate(175%)",
          WebkitBackdropFilter: effectiveHeaderCondensed
            ? "blur(28px) saturate(190%)"
            : "blur(24px) saturate(175%)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px sm:inset-x-7">
          <div
            className="h-full w-full transition-opacity duration-300 ease-out"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--material-highlight) 58%, transparent) 22%, color-mix(in srgb, var(--brand-primary-light) 28%, transparent) 80%, transparent 100%)",
              opacity: effectiveHeaderCondensed ? 0.96 : 0.48,
            }}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              "max-w-2xl transition-[transform,opacity] duration-300 ease-out",
              effectiveHeaderCondensed ? "-translate-y-px" : "",
            )}
          >
            {eyebrow ? (
              <div
                className={cn(
                  "text-[11px] font-medium uppercase tracking-[0.18em] transition-[margin,opacity] duration-300 ease-out",
                  effectiveHeaderCondensed ? "mb-1 opacity-80" : "mb-2 opacity-100",
                )}
                style={{ color: "var(--text-tertiary)" }}
              >
                {eyebrow}
              </div>
            ) : null}
            <h2
              className={cn(
                "font-semibold transition-[margin,font-size] duration-300 ease-out",
                effectiveHeaderCondensed ? "mb-1 text-[17px]" : "mb-2 text-lg",
              )}
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
          </div>

          {headerAccessory}
        </div>
      </div>

      <div
        className={cn("flex-1 space-y-5 px-6 py-6 sm:px-7 sm:py-7", contentClassName)}
        data-testid="settings-section-body"
        data-settings-body="true"
      >
        {children}
      </div>
    </section>
  );
}

export function SettingsSectionGroup({
  children,
  className,
  contentClassName,
  interactive = true,
}: SettingsSectionGroupProps) {
  return (
    <div
      className={cn(
        "group/settings-section relative isolate overflow-hidden rounded-[24px] border p-5 sm:p-6",
        interactive
          ? "material-interactive relative hover:-translate-y-px focus-within:-translate-y-px"
          : "",
        className,
      )}
      data-testid="settings-section-group"
      data-material-role="content"
      data-group-interactive={interactive ? "true" : "false"}
      data-hover-surface={interactive ? "content" : undefined}
      style={{ ...getMaterialSurfaceStyle("content", "sm") }}
    >
      {interactive ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 ease-out group-hover/settings-section:opacity-100 group-focus-within/settings-section:opacity-100"
            data-group-highlight="true"
            data-testid="settings-section-group-accent"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--material-highlight) 64%, transparent) 0%, transparent 56%, color-mix(in srgb, var(--brand-primary-light) 28%, transparent) 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-px opacity-50 transition-opacity duration-300 ease-out group-hover/settings-section:opacity-100 group-focus-within/settings-section:opacity-100 sm:inset-x-6"
            data-group-edge-highlight="true"
            data-testid="settings-section-group-edge"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--material-highlight) 66%, transparent) 24%, color-mix(in srgb, var(--brand-primary-light) 28%, transparent) 78%, transparent 100%)",
            }}
          />
        </>
      ) : null}

      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}
