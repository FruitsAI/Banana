import { useCallback } from "react";
import type { ConfigKey } from "@/domain/config/types";
import { getConfigValue, setConfigValue } from "@/services/config";

export function useConfigStore() {
  const loadConfig = useCallback(async (key: ConfigKey): Promise<string | null> => {
    return await getConfigValue(key);
  }, []);

  const saveConfig = useCallback(async (key: ConfigKey, value: string): Promise<void> => {
    await setConfigValue(key, value);
  }, []);

  return {
    loadConfig,
    saveConfig,
  };
}
