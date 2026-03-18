export type AppErrorCode = "UNKNOWN_ERROR" | "SERVICE_ERROR";

interface AppErrorOptions {
  code?: AppErrorCode;
  operation?: string;
  cause?: unknown;
}

interface NormalizeErrorOptions {
  code?: AppErrorCode;
  domain?: string;
  operation?: string;
  fallbackMessage?: string;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly operation?: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? "UNKNOWN_ERROR";
    this.operation = options.operation;
    (this as Error & { cause?: unknown }).cause = options.cause;
  }
}

export function getErrorMessage(error: unknown, fallbackMessage = "未知错误"): string {
  if (error instanceof Error) {
    const message = error.message?.trim();
    return message || fallbackMessage;
  }

  if (typeof error === "string") {
    const message = error.trim();
    return message || fallbackMessage;
  }

  return fallbackMessage;
}

export function normalizeError(error: unknown, options: NormalizeErrorOptions = {}): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const message = getErrorMessage(error, options.fallbackMessage ?? "未知错误");
  const contextPrefix =
    options.domain && options.operation
      ? `[${options.domain}:${options.operation}] `
      : options.operation
        ? `[${options.operation}] `
        : "";

  return new AppError(`${contextPrefix}${message}`, {
    code: options.code ?? "SERVICE_ERROR",
    operation: options.operation,
    cause: error,
  });
}
