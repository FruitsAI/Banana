"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshCw } from "lucide-react";
import {
  CodeIcon,
  CpuIcon,
  Layers01Icon,
  LinkSquare02Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import type {
  AppUpdateCheckState,
  AppUpdateInstallState,
} from "@/domain/update/types";
import {
  APP_ABOUT_DESCRIPTION,
  APP_ABOUT_FACTS,
  APP_ABOUT_TECH_BADGES,
  APP_COPYRIGHT_OWNER,
  APP_COPYRIGHT_YEAR,
  APP_DISPLAY_VERSION,
  APP_LINKS,
  APP_NAME,
  APP_TAGLINE,
} from "@/config/app-metadata";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { SettingsPageFrame } from "@/components/settings/settings-page-frame";
import {
  SettingsSectionGroup,
  SettingsSectionShell,
  SettingsSectionTitleRow,
} from "@/components/settings/settings-section-shell";
import { cn } from "@/lib/utils";
import { useAppUpdateStore } from "@/stores/update/useAppUpdateStore";

const ABOUT_FACT_ICONS = [
  Layers01Icon,
  ZapIcon,
  CpuIcon,
] as const;

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
    return reason ?? "当前仅支持 macOS 正式版应用内更新";
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

  return (
    <SettingsPageFrame>
      <SettingsSectionShell
        sectionId="about"
        eyebrow="About"
        title="关于我们"
      >
        <SettingsSectionGroup
          className="overflow-hidden p-0"
          interactive={false}
        >
          <div
            className="relative overflow-hidden rounded-[inherit] px-5 py-5 sm:px-6 sm:py-6"
            data-testid="about-identity"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--material-highlight) 72%, transparent) 0%, transparent 54%, color-mix(in srgb, var(--brand-primary-light) 18%, transparent) 100%)",
              }}
            />
            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
              <motion.div
                className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border"
                style={{ ...getMaterialSurfaceStyle("content", "sm") }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                whileHover={{ y: -2, scale: 1.015 }}
              >
                <Image
                  alt="Banana Logo"
                  className="object-cover"
                  fill
                  sizes="96px"
                  src="/logo.png"
                />
              </motion.div>

              <div className="min-w-0 flex-1">
                <div
                  className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {APP_TAGLINE}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <h3
                      className="text-[1.7rem] font-semibold tracking-tight sm:text-[1.9rem]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {APP_NAME}
                    </h3>
                    <p
                      className="mt-2 max-w-2xl text-sm leading-6 sm:text-[15px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {APP_ABOUT_DESCRIPTION}
                    </p>
                  </div>
                  <div className="flex w-full shrink-0 flex-col items-start gap-2 sm:w-auto sm:min-w-[12rem] sm:items-end">
                    <div className="about-version-actions">
                      <div
                        className="about-version-badge"
                        data-testid="about-version-badge"
                      >
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
                            "relative z-10 size-[0.95rem]",
                            isActionBusy && "animate-spin",
                          )}
                        />
                        {showUpdateDot ? (
                          <span
                            className="about-update-trigger-dot"
                            data-testid="about-update-dot"
                          />
                        ) : null}
                      </button>
                    </div>
                    <div
                      className="min-h-[2.15rem] text-[11px] leading-5 sm:max-w-[15rem] sm:text-right"
                      data-testid="about-update-status"
                      style={{ color: statusColor }}
                    >
                      {statusText}
                    </div>
                  </div>
                </div>
                <p
                  className="mt-4 text-xs leading-5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  © {APP_COPYRIGHT_YEAR} {APP_COPYRIGHT_OWNER}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </SettingsSectionGroup>

        <SettingsSectionGroup interactive={false}>
          <div data-testid="about-facts">
            <SettingsSectionTitleRow title="产品事实" />
            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
              {APP_ABOUT_FACTS.map((fact, index) => (
                <motion.div
                  key={fact.title}
                  className="relative overflow-hidden rounded-[22px] border p-4 sm:p-5"
                  style={{ ...getMaterialSurfaceStyle("content", "sm") }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-75"
                    style={{
                      background:
                        "linear-gradient(180deg, color-mix(in srgb, var(--material-highlight) 62%, transparent) 0%, transparent 100%)",
                    }}
                  />
                  <div className="relative z-10">
                    <div
                      className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
                      style={{
                        background:
                          "color-mix(in srgb, var(--material-content-background) 82%, transparent)",
                        borderColor: "var(--divider)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <HugeiconsIcon icon={ABOUT_FACT_ICONS[index] ?? CodeIcon} size={18} />
                    </div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {fact.title}
                    </h3>
                    <p
                      className="mt-2 text-sm leading-6"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {fact.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </SettingsSectionGroup>

        <SettingsSectionGroup className="overflow-hidden p-0" interactive={false}>
          <div data-testid="about-resources">
            <div className="px-5 pb-3 pt-5 sm:px-6">
              <SettingsSectionTitleRow title="资源入口" />
            </div>
            {APP_LINKS.map((link, index, arr) => (
              <a
                key={link.label}
                className="material-interactive group flex w-full items-start justify-between gap-4 px-5 py-4 text-left sm:px-6"
                data-hover-surface="content"
                href={link.url}
                rel="noreferrer noopener"
                style={{
                  borderTop: index === 0 ? "1px solid var(--divider)" : "none",
                  borderBottom:
                    index < arr.length - 1 ? "1px solid var(--divider)" : "none",
                }}
                target="_blank"
              >
                <div className="min-w-0">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {link.label}
                  </div>
                  <p
                    className="mt-1 text-sm leading-6"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {link.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-3">
                  <span
                    className="text-xs sm:text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {link.value}
                  </span>
                  <HugeiconsIcon
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    icon={LinkSquare02Icon}
                    size={16}
                    style={{ color: "var(--text-quaternary)" }}
                  />
                </div>
              </a>
            ))}
          </div>
        </SettingsSectionGroup>

        <SettingsSectionGroup
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          interactive={false}
        >
          <div
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            data-testid="about-tech-badges"
          >
            <div className="max-w-xl">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                技术透明度
              </h3>
              <p
                className="mt-2 text-sm leading-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Banana 当前桌面客户端基于以下技术构建，技术栈只作为次级透明信息展示。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {APP_ABOUT_TECH_BADGES.map((badge) => {
                const icon = ABOUT_TECH_ICON_MAP[badge] ?? CodeIcon;

                return (
                  <div
                    key={badge}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:text-[13px]"
                    style={{
                      background:
                        "color-mix(in srgb, var(--material-content-background) 88%, transparent)",
                      borderColor: "var(--divider)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <HugeiconsIcon icon={icon} size={14} />
                    <span>{badge}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </SettingsSectionGroup>
      </SettingsSectionShell>
    </SettingsPageFrame>
  );
}
