export const APP_UPDATE_LAST_CHECKED_AT_CONFIG_KEY = "app_update_last_checked_at";
export const APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY = "app_update_last_skipped_version";

export type ConfigKey = string;

export interface ConfigEntry {
  key: ConfigKey;
  value: string | null;
}
