export type AppUpdateCheckState =
  | "idle"
  | "checking"
  | "available"
  | "latest"
  | "suppressed"
  | "error";

export type AppUpdateInstallState =
  | "idle"
  | "downloading"
  | "installing"
  | "ready_to_restart"
  | "restarting"
  | "error";

export interface AppUpdateInfo {
  available: boolean;
  canInstallInApp: boolean;
  currentVersion: string;
  downloadUrl: string | null;
  latestVersion: string | null;
  notes: string | null;
  publishedAt: string | null;
  reason: string | null;
  target: string | null;
}

export interface AppUpdateInstallResult {
  currentVersion: string;
  latestVersion: string;
  readyToRestart: boolean;
}

export interface AppUpdateCheckOptions {
  manual?: boolean;
}
