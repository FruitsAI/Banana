"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ZapIcon,
  Layers01Icon,
  CpuIcon,
  CodeIcon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons";
import {
  APP_COPYRIGHT_OWNER,
  APP_COPYRIGHT_YEAR,
  APP_DISPLAY_VERSION,
  APP_LINKS,
  APP_NAME,
} from "@/config/app-metadata";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { SettingsPageFrame } from "@/components/settings/settings-page-frame";
import { SettingsSectionGroup, SettingsSectionShell } from "@/components/settings/settings-section-shell";

export function AboutSetting() {
  const techStack = [
    { name: "Tauri 2", icon: Layers01Icon },
    { name: "Next.js", icon: ZapIcon },
    { name: "Vercel AI SDK", icon: CpuIcon },
    { name: "TypeScript", icon: CodeIcon },
  ];

  return (
    <SettingsPageFrame>
      <SettingsSectionShell
        sectionId="about"
        eyebrow="About"
        title={`${APP_NAME} 桌面应用`}
        headerAccessory={
          <div
            className="inline-flex items-center justify-center self-start rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              background: "var(--brand-primary-light)",
              borderColor: "var(--brand-primary-border)",
              color: "var(--brand-primary)",
            }}
          >
            {APP_DISPLAY_VERSION}
          </div>
        }
      >
          <SettingsSectionGroup>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <motion.div
                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border"
                style={{ ...getMaterialSurfaceStyle("content", "sm") }}
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
              >
                <Image
                  src="/logo.png"
                  alt="Banana Logo"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </motion.div>

              <div className="min-w-0 flex-1">
                <h3 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {APP_NAME}
                </h3>
                <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  © {APP_COPYRIGHT_YEAR} {APP_COPYRIGHT_OWNER}. All rights reserved.
                </p>
              </div>
            </div>
          </SettingsSectionGroup>

          <SettingsSectionGroup>
            <div className="mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                技术栈
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {techStack.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  className="material-interactive flex flex-col items-center gap-3 rounded-[24px] border p-5 text-center"
                  data-hover-surface="content"
                  style={{ ...getMaterialSurfaceStyle("content", "sm") }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.08 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--material-highlight)" }}
                  >
                    <HugeiconsIcon icon={tech.icon} size={24} style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {tech.name}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </SettingsSectionGroup>

          <SettingsSectionGroup className="overflow-hidden p-0">
            <div className="px-5 pb-3 pt-5 sm:px-6">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                相关链接
              </h3>
            </div>
            {APP_LINKS.map((link, index, arr) => (
              <a
                key={link.label}
                className="material-interactive group flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
                data-hover-surface="content"
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  borderTop: index === 0 ? "1px solid var(--divider)" : "none",
                  borderBottom: index < arr.length - 1 ? "1px solid var(--divider)" : "none",
                }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {link.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {link.value}
                  </span>
                  <HugeiconsIcon
                    icon={LinkSquare02Icon}
                    size={16}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: "var(--text-quaternary)" }}
                  />
                </div>
              </a>
            ))}
          </SettingsSectionGroup>
      </SettingsSectionShell>
    </SettingsPageFrame>
  );
}
