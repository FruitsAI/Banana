"use client";

import { invoke } from "@tauri-apps/api/core";
import { APP_VERSION } from "@/config/app-metadata";
import type { AppUpdateInfo, AppUpdateInstallResult } from "@/domain/update/types";
import { detectRuntimeEnvironment } from "@/lib/platform";
import { AppError, normalizeError } from "@/shared/errors";

const BROWSER_UNAVAILABLE_MESSAGE = "当前环境不支持应用内更新。";
const IN_APP_UPDATE_UNAVAILABLE_MESSAGE = "当前安装包暂不支持应用内更新。";

function wrapError(operation: string, error: unknown): AppError {
  const normalized = normalizeError(error, {
    domain: "update",
    operation,
    code: "SERVICE_ERROR",
  });

  return new AppError(mapUpdateErrorMessage(normalized.message), {
    code: normalized.code,
    operation: normalized.operation,
    cause: error,
  });
}

function mapUpdateErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("当前平台暂不支持应用内更新")) {
    return IN_APP_UPDATE_UNAVAILABLE_MESSAGE;
  }

  if (normalized.includes("当前环境不支持应用内更新")) {
    return BROWSER_UNAVAILABLE_MESSAGE;
  }

  if (normalized.includes("更新通道未配置")) {
    return "当前安装包还没接上正式更新源，暂时不能在应用内自检更新。";
  }

  if (normalized.includes("signature") || normalized.includes("minisign")) {
    return "更新签名校验失败，已停止安装。";
  }

  if (normalized.includes("authentication failed")) {
    return "系统授权被取消，更新没有完成。";
  }

  if (normalized.includes("network") || normalized.includes("reqwest")) {
    return "连接 GitHub 更新通道失败，请稍后重试。";
  }

  return message;
}

function createUnsupportedInfo(reason: string): AppUpdateInfo {
  return {
    available: false,
    canInstallInApp: false,
    currentVersion: APP_VERSION,
    downloadUrl: null,
    latestVersion: null,
    notes: null,
    publishedAt: null,
    reason,
    target: null,
  };
}

function isTauriRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  return detectRuntimeEnvironment(window as Window & { __TAURI_INTERNALS__?: unknown }) === "tauri";
}

export async function checkForAppUpdate(): Promise<AppUpdateInfo> {
  if (!isTauriRuntime()) {
    return createUnsupportedInfo(BROWSER_UNAVAILABLE_MESSAGE);
  }

  try {
    const payload = await invoke<AppUpdateInfo>("app_check_update");
    return payload.canInstallInApp
      ? payload
      : { ...payload, reason: payload.reason ?? IN_APP_UPDATE_UNAVAILABLE_MESSAGE };
  } catch (error) {
    const wrapped = wrapError("checkForAppUpdate", error);

    if (
      wrapped.message === IN_APP_UPDATE_UNAVAILABLE_MESSAGE ||
      wrapped.message === BROWSER_UNAVAILABLE_MESSAGE
    ) {
      return createUnsupportedInfo(wrapped.message);
    }

    throw wrapped;
  }
}

export async function installAppUpdate(): Promise<AppUpdateInstallResult> {
  if (!isTauriRuntime()) {
    throw new AppError(BROWSER_UNAVAILABLE_MESSAGE, {
      code: "SERVICE_ERROR",
      operation: "installAppUpdate",
    });
  }

  try {
    return await invoke<AppUpdateInstallResult>("app_install_update");
  } catch (error) {
    throw wrapError("installAppUpdate", error);
  }
}

export async function restartToApplyUpdate(): Promise<void> {
  if (!isTauriRuntime()) {
    throw new AppError(BROWSER_UNAVAILABLE_MESSAGE, {
      code: "SERVICE_ERROR",
      operation: "restartToApplyUpdate",
    });
  }

  try {
    await invoke("app_restart_to_apply_update");
  } catch (error) {
    throw wrapError("restartToApplyUpdate", error);
  }
}
