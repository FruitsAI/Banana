"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { APP_VERSION } from "@/config/app-metadata";
import {
  APP_UPDATE_LAST_CHECKED_AT_CONFIG_KEY,
  APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY,
} from "@/domain/config/types";
import type {
  AppUpdateCheckOptions,
  AppUpdateCheckState,
  AppUpdateInfo,
  AppUpdateInstallState,
} from "@/domain/update/types";
import { detectRuntimeEnvironment } from "@/lib/platform";
import { getConfigValue, setConfigValue } from "@/services/config";
import {
  checkForAppUpdate,
  installAppUpdate,
  restartToApplyUpdate,
} from "@/services/update";
import { getErrorMessage } from "@/shared/errors";

interface AppUpdateStoreValue extends AppUpdateInfo {
  checkForUpdates: (options?: AppUpdateCheckOptions) => Promise<void>;
  checkState: AppUpdateCheckState;
  errorMessage: string | null;
  installState: AppUpdateInstallState;
  lastCheckedAt: string | null;
  lastSkippedVersion: string | null;
  restartToApplyUpdate: () => Promise<void>;
  skipVersion: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

interface AppUpdateStoreState extends AppUpdateInfo {
  checkState: AppUpdateCheckState;
  errorMessage: string | null;
  installState: AppUpdateInstallState;
  lastCheckedAt: string | null;
  lastSkippedVersion: string | null;
}

const INITIAL_UPDATE_INFO: AppUpdateInfo = {
  available: false,
  canInstallInApp: true,
  currentVersion: APP_VERSION,
  downloadUrl: null,
  latestVersion: null,
  notes: null,
  publishedAt: null,
  reason: null,
  target: null,
};

const AppUpdateContext = createContext<AppUpdateStoreValue | null>(null);

function normalizeConfigValue(value: string | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isTauriRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  return detectRuntimeEnvironment(window as Window & { __TAURI_INTERNALS__?: unknown }) === "tauri";
}

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppUpdateStoreState>({
    ...INITIAL_UPDATE_INFO,
    checkState: "idle",
    errorMessage: null,
    installState: "idle",
    lastCheckedAt: null,
    lastSkippedVersion: null,
  });
  const activeRef = useRef(true);
  const initializedRef = useRef(false);
  const lastSkippedVersionRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      activeRef.current = false;
    };
  }, []);

  const persistConfigValue = useCallback(async (key: string, value: string) => {
    if (!isTauriRuntime()) {
      return;
    }

    try {
      await setConfigValue(key, value);
    } catch (error) {
      console.error(`Failed to persist ${key}:`, error);
    }
  }, []);

  const checkForUpdates = useCallback(async (options?: AppUpdateCheckOptions) => {
    const manual = options?.manual ?? false;

    setState((current) => ({
      ...current,
      checkState: "checking",
      errorMessage: null,
      installState: current.installState === "error" ? "idle" : current.installState,
    }));

    try {
      const info = await checkForAppUpdate();
      const checkedAt = new Date().toISOString();
      const shouldSuppress =
        !manual &&
        info.available &&
        info.latestVersion !== null &&
        lastSkippedVersionRef.current === info.latestVersion;

      if (!activeRef.current) {
        return;
      }

      if (
        lastSkippedVersionRef.current &&
        info.latestVersion &&
        lastSkippedVersionRef.current !== info.latestVersion
      ) {
        lastSkippedVersionRef.current = null;
        void persistConfigValue(APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY, "");
      }

      setState((current) => ({
        ...current,
        ...info,
        checkState: shouldSuppress
          ? "suppressed"
          : info.available
            ? "available"
            : info.canInstallInApp
              ? "latest"
              : "idle",
        errorMessage: null,
        installState:
          current.installState === "ready_to_restart" ? "ready_to_restart" : "idle",
        lastCheckedAt: checkedAt,
        lastSkippedVersion: lastSkippedVersionRef.current,
      }));

      void persistConfigValue(APP_UPDATE_LAST_CHECKED_AT_CONFIG_KEY, checkedAt);
    } catch (error) {
      if (!activeRef.current) {
        return;
      }

      setState((current) => ({
        ...current,
        checkState: "error",
        errorMessage: getErrorMessage(error, "检查更新失败，请稍后重试。"),
        installState: current.installState === "ready_to_restart" ? "ready_to_restart" : "idle",
      }));
    }
  }, [persistConfigValue]);

  const installUpdate = useCallback(async () => {
    setState((current) => ({
      ...current,
      installState: "downloading",
      errorMessage: null,
    }));

    try {
      const result = await installAppUpdate();

      if (!activeRef.current) {
        return;
      }

      setState((current) => ({
        ...current,
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
        installState: result.readyToRestart ? "ready_to_restart" : "installing",
        errorMessage: null,
      }));
    } catch (error) {
      if (!activeRef.current) {
        return;
      }

      setState((current) => ({
        ...current,
        installState: "error",
        errorMessage: getErrorMessage(error, "安装更新失败，请稍后重试。"),
      }));
    }
  }, []);

  const restartUpdate = useCallback(async () => {
    setState((current) => ({
      ...current,
      installState: "restarting",
      errorMessage: null,
    }));

    try {
      await restartToApplyUpdate();
    } catch (error) {
      if (!activeRef.current) {
        return;
      }

      setState((current) => ({
        ...current,
        installState: "ready_to_restart",
        errorMessage: getErrorMessage(error, "重启更新失败，请稍后重试。"),
      }));
    }
  }, []);

  const skipVersion = useCallback(async () => {
    setState((current) => {
      const versionToSkip = current.latestVersion;
      if (!versionToSkip) {
        return current;
      }

      lastSkippedVersionRef.current = versionToSkip;
      void persistConfigValue(APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY, versionToSkip);

      return {
        ...current,
        checkState: "suppressed",
        lastSkippedVersion: versionToSkip,
      };
    });
  }, [persistConfigValue]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const initialize = async () => {
      if (isTauriRuntime()) {
        try {
          const [storedCheckedAt, storedSkippedVersion] = await Promise.all([
            getConfigValue(APP_UPDATE_LAST_CHECKED_AT_CONFIG_KEY),
            getConfigValue(APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY),
          ]);

          if (!activeRef.current) {
            return;
          }

          const normalizedCheckedAt = normalizeConfigValue(storedCheckedAt);
          const normalizedSkippedVersion = normalizeConfigValue(storedSkippedVersion);
          const clearedSkippedVersion =
            normalizedSkippedVersion === APP_VERSION ? null : normalizedSkippedVersion;

          lastSkippedVersionRef.current = clearedSkippedVersion;

          setState((current) => ({
            ...current,
            lastCheckedAt: normalizedCheckedAt,
            lastSkippedVersion: clearedSkippedVersion,
          }));

          if (normalizedSkippedVersion && normalizedSkippedVersion === APP_VERSION) {
            void persistConfigValue(APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY, "");
          }
        } catch (error) {
          console.error("Failed to load app update preferences:", error);
        }
      }

      await checkForUpdates({ manual: false });
    };

    void initialize();
  }, [checkForUpdates, persistConfigValue]);

  const value = useMemo<AppUpdateStoreValue>(
    () => ({
      ...state,
      checkForUpdates,
      installUpdate,
      restartToApplyUpdate: restartUpdate,
      skipVersion,
    }),
    [checkForUpdates, installUpdate, restartUpdate, skipVersion, state],
  );

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdateStore() {
  const context = useContext(AppUpdateContext);

  if (!context) {
    throw new Error("useAppUpdateStore must be used within AppUpdateProvider");
  }

  return context;
}
