import { getConfig as dbGetConfig, setConfig as dbSetConfig } from "@/lib/db";
import type { ConfigKey } from "@/domain/config/types";
import { AppError, normalizeError } from "@/shared/errors";

function wrapError(operation: string, error: unknown): AppError {
  return normalizeError(error, {
    domain: "config",
    operation,
    code: "SERVICE_ERROR",
  });
}

export async function getConfigValue(key: ConfigKey): Promise<string | null> {
  try {
    return await dbGetConfig(key);
  } catch (error) {
    throw wrapError("getConfigValue", error);
  }
}

export async function setConfigValue(key: ConfigKey, value: string): Promise<void> {
  try {
    await dbSetConfig(key, value);
  } catch (error) {
    throw wrapError("setConfigValue", error);
  }
}
