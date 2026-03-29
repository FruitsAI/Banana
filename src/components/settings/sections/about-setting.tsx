"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { openUrl } from "@tauri-apps/plugin-opener";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CodeIcon,
  CpuIcon,
  Layers01Icon,
  LinkSquare02Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import type {
  AppUpdateCheckState,
  AppUpdateInstallState,
} from "@/domain/update/types";
import {
  APP_ABOUT_DESCRIPTION,
  APP_ABOUT_TECH_BADGES,
  APP_COPYRIGHT_OWNER,
  APP_COPYRIGHT_YEAR,
  APP_DISPLAY_VERSION,
  APP_LINKS,
  APP_NAME,
} from "@/config/app-metadata";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { SettingsPageFrame } from "@/components/settings/settings-page-frame";
import {
  SettingsSectionGroup,
  SettingsSectionShell,
} from "@/components/settings/settings-section-shell";
import { detectRuntimeEnvironment } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { useAppUpdateStore } from "@/stores/update/useAppUpdateStore";

const ABOUT_TECH_ICON_MAP = {
  "Tauri 2": Layers01Icon,
  "Next.js": ZapIcon,
  "Vercel AI SDK": CpuIcon,
  TypeScript: CodeIcon,
} as const;

function formatVersionTag(version: string | null | undefined) {
  if (!version) {
    return null;
  }

  return version.startsWith("v") ? version : `v${version}`;
}

function getUpdateStatusText({
  canInstallInApp,
  checkState,
  errorMessage,
  installState,
  latestVersionLabel,
  reason,
}: {
  canInstallInApp: boolean;
  checkState: AppUpdateCheckState;
  errorMessage: string | null;
  installState: AppUpdateInstallState;
  latestVersionLabel: string | null;
  reason: string | null;
}) {
  if (!canInstallInApp) {
    return reason ?? "当前安装包暂不支持应用内更新";
  }

  if (installState === "error") {
    return errorMessage ?? "安装更新失败，请稍后重试";
  }

  if (installState === "ready_to_restart" && latestVersionLabel) {
    return `${latestVersionLabel} 已准备完成，重启后即可使用`;
  }

  if ((installState === "downloading" || installState === "installing") && latestVersionLabel) {
    return `正在下载并准备 ${latestVersionLabel}`;
  }

  if (checkState === "checking") {
    return "正在检查 GitHub 稳定版更新";
  }

  if (checkState === "available" && latestVersionLabel) {
    return `发现 ${latestVersionLabel}，可在应用内完成更新`;
  }

  if (checkState === "suppressed" && latestVersionLabel) {
    return `已忽略 ${latestVersionLabel}，手动检查可再次显示`;
  }

  if (checkState === "latest") {
    return "当前已是最新版本";
  }

  if (checkState === "error") {
    return errorMessage ?? "检查更新失败，请稍后重试";
  }

  return "启动时会自动检查一次 GitHub 稳定版更新";
}

function getUpdateStatusColor({
  canInstallInApp,
  checkState,
  errorMessage,
  installState,
}: {
  canInstallInApp: boolean;
  checkState: AppUpdateCheckState;
  errorMessage: string | null;
  installState: AppUpdateInstallState;
}) {
  if (!canInstallInApp) {
    return "var(--text-secondary)";
  }

  if (checkState === "error" || installState === "error") {
    if (errorMessage?.includes("更新源") || errorMessage?.includes("未配置")) {
      return "var(--text-secondary)";
    }

    return "var(--danger)";
  }

  if (
    checkState === "available" ||
    checkState === "checking" ||
    installState === "downloading" ||
    installState === "installing" ||
    installState === "ready_to_restart"
  ) {
    return "var(--brand-primary)";
  }

  return "var(--text-tertiary)";
}

function getPrimaryActionLabel({
  checkState,
  installState,
}: {
  checkState: AppUpdateCheckState;
  installState: AppUpdateInstallState;
}) {
  if (installState === "restarting") {
    return "正在重启";
  }

  if (installState === "error") {
    return "重新安装";
  }

  if (installState === "ready_to_restart") {
    return "立即重启";
  }

  if (installState === "downloading" || installState === "installing") {
    return "正在安装更新";
  }

  if (checkState === "checking") {
    return "检查更新中";
  }

  if (checkState === "available") {
    return "下载并安装";
  }

  if (checkState === "suppressed") {
    return "重新检查";
  }

  return "检查更新";
}

export function AboutSetting() {
  const {
    canInstallInApp,
    checkForUpdates,
    checkState,
    currentVersion,
    errorMessage,
    installState,
    installUpdate,
    latestVersion,
    reason,
    restartToApplyUpdate,
  } = useAppUpdateStore();
  const currentVersionLabel = formatVersionTag(currentVersion) ?? APP_DISPLAY_VERSION;
  const latestVersionLabel = formatVersionTag(latestVersion);
  const primaryActionLabel = getPrimaryActionLabel({ checkState, installState });
  const statusText = getUpdateStatusText({
    canInstallInApp,
    checkState,
    errorMessage,
    installState,
    latestVersionLabel,
    reason,
  });
  const statusColor = getUpdateStatusColor({
    canInstallInApp,
    checkState,
    errorMessage,
    installState,
  });
  const isActionBusy =
    checkState === "checking" ||
    installState === "downloading" ||
    installState === "installing" ||
    installState === "restarting";
  const showUpdateDot =
    (checkState === "available" && latestVersionLabel !== null) ||
    installState === "ready_to_restart";

  const handlePrimaryAction = () => {
    if (!canInstallInApp || isActionBusy) {
      return;
    }

    if (installState === "ready_to_restart") {
      void restartToApplyUpdate();
      return;
    }

    if (checkState === "available") {
      void installUpdate();
      return;
    }

    void checkForUpdates({ manual: true });
  };

  const handleOpenLink = async (url: string) => {
    try {
      const runtime =
        typeof window === "undefined"
          ? "browser"
          : detectRuntimeEnvironment(window as Window & { __TAURI_INTERNALS__?: unknown });

      if (runtime === "tauri") {
        await openUrl(url);
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <SettingsPageFrame>
      <SettingsSectionShell
        sectionId="about"
        eyebrow="About"
        title="关于我们"
      >
        <SettingsSectionGroup className="flex-1 overflow-hidden p-0" interactive={false}>
          <div
            className="relative flex h-full min-h-[460px] flex-col overflow-hidden rounded-[inherit] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7"
            data-about-layout="brand-hero"
            data-testid="about-identity"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--material-highlight) 66%, transparent) 0%, transparent 48%, color-mix(in srgb, var(--brand-primary-light) 22%, transparent) 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 top-8 h-56 w-56 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--brand-primary-light) 24%, transparent) 0%, transparent 72%)",
              }}
            />

            <div className="relative z-10 flex h-full flex-col gap-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-5 sm:gap-6">
                  <motion.div
                    className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[30px] border sm:h-28 sm:w-28"
                    style={{ ...getMaterialSurfaceStyle("content", "sm") }}
                    transition={{ type: "spring", stiffness: 360, damping: 26 }}
                    whileHover={{ y: -2, scale: 1.015 }}
                  >
                    <Image
                      alt="Banana Logo"
                      className="object-cover"
                      fill
                      sizes="112px"
                      src="/logo.png"
                    />
                  </motion.div>

                  <div className="min-w-0 flex-1 pt-1">
                    <h3
                      className="text-[2rem] font-semibold tracking-tight sm:text-[2.3rem]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {APP_NAME}
                    </h3>
                    <p
                      className="mt-3 max-w-2xl text-sm leading-7 sm:text-[15px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {APP_ABOUT_DESCRIPTION}
                    </p>
                    <p
                      className="mt-4 text-xs leading-5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      © {APP_COPYRIGHT_YEAR} {APP_COPYRIGHT_OWNER}. All rights reserved.
                    </p>
                  </div>
                </div>

                <div
                  className="w-full shrink-0 rounded-[24px] border p-4 lg:max-w-[18rem]"
                  data-testid="about-update-panel"
                  style={{ ...getMaterialSurfaceStyle("content", "sm") }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="text-[11px] font-medium uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Version
                    </div>
                    <div className="about-version-actions">
                      <div className="about-version-badge" data-testid="about-version-badge">
                        <span className="relative z-10">{currentVersionLabel}</span>
                      </div>
                      <button
                        aria-label={primaryActionLabel}
                        className="about-update-trigger"
                        data-testid="about-update-trigger"
                        disabled={!canInstallInApp || isActionBusy}
                        onClick={handlePrimaryAction}
                        type="button"
                      >
                        <RefreshCw
                          className={cn(
                            "relative z-10 size-[0.9rem]",
                            isActionBusy && "animate-spin",
                          )}
                        />
                        {showUpdateDot ? (
                          <span className="about-update-trigger-dot" data-testid="about-update-dot" />
                        ) : null}
                      </button>
                    </div>
                  </div>
                  <div
                    className="mt-3 min-h-10 text-xs leading-5 sm:text-[12px]"
                    data-testid="about-update-status"
                    style={{ color: statusColor }}
                  >
                    {statusText}
                  </div>
                </div>
              </div>

              <div
                className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                data-about-layout="quick-links"
                data-testid="about-resources"
              >
                {APP_LINKS.map((link) => (
                  <motion.a
                    key={link.label}
                    className="material-interactive group flex min-h-[104px] items-center gap-4 rounded-[24px] border px-4 py-4 text-left sm:px-5"
                    data-hover-surface="content"
                    data-testid="about-resource-card"
                    href={link.url}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleOpenLink(link.url);
                    }}
                    rel="noreferrer noopener"
                    style={{ ...getMaterialSurfaceStyle("content", "sm") }}
                    target="_blank"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2 }}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border"
                      style={{
                        background:
                          "color-mix(in srgb, var(--material-content-background) 90%, transparent)",
                        borderColor: "var(--divider)",
                        color: "var(--brand-primary)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                      }}
                    >
                      <HugeiconsIcon icon={LinkSquare02Icon} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {link.label}
                      </div>
                      <div
                        className="mt-1 truncate text-xs sm:text-sm"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {link.value}
                      </div>
                    </div>
                    <ArrowUpRight
                      className="size-4 shrink-0 opacity-50 transition-opacity duration-200 group-hover:opacity-100"
                      style={{ color: "var(--text-quaternary)" }}
                    />
                  </motion.a>
                ))}
              </div>

              <div
                className="flex flex-col gap-3 pt-1"
                data-testid="about-tech-stack"
              >
                <div
                  className="text-[11px] font-medium uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  技术栈
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {APP_ABOUT_TECH_BADGES.map((badge) => {
                    const icon = ABOUT_TECH_ICON_MAP[badge] ?? CodeIcon;

                    return (
                      <motion.div
                        key={badge}
                        className="flex min-w-[148px] flex-1 items-center gap-3 rounded-[22px] border px-4 py-3 text-sm font-medium"
                        data-testid="about-tech-card"
                        style={{
                          background:
                            "color-mix(in srgb, var(--material-content-background) 90%, transparent)",
                          borderColor: "var(--divider)",
                          color: "var(--text-secondary)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                        }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -1.5 }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border"
                          style={{
                            background:
                              "color-mix(in srgb, var(--material-content-background) 94%, transparent)",
                            borderColor: "var(--divider)",
                            color: "var(--brand-primary)",
                          }}
                        >
                          <HugeiconsIcon icon={icon} size={15} />
                        </div>
                        <span className="truncate">{badge}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </SettingsSectionGroup>
      </SettingsSectionShell>
    </SettingsPageFrame>
  );
}
