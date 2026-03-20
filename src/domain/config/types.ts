export type ConfigKey = string;

export interface ConfigEntry {
  key: ConfigKey;
  value: string | null;
}
