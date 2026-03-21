import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import {
  isAnthropicProviderType,
  normalizeProviderType,
  isOpenAICompatibleProviderType,
} from "@/config/providers";
import type {
  ProviderListModelsOptions,
  ProviderModelRecord,
  ProviderRuntimeOptions,
} from "./types";

const DEFAULT_ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const ANTHROPIC_VERSION = "2023-06-01";
const CONNECTION_PROBE_TIMEOUT_MS = 5000;
const CONNECTION_PROBE_PROMPT = "ping";

function createTimeoutAbortSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Probe timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return controller.signal;
}

interface ProviderModelCandidate {
  created?: number;
  id: string;
  owned_by?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProviderModelCandidate(value: unknown): value is ProviderModelCandidate {
  return isRecord(value) && typeof value.id === "string";
}

function resolveBaseURL(options: {
  baseURL?: string;
  providerType?: string;
}): string {
  return options.baseURL?.trim()
    || (isAnthropicProviderType(options.providerType)
      ? DEFAULT_ANTHROPIC_BASE_URL
      : DEFAULT_OPENAI_BASE_URL);
}

function buildModelsHeaders(options: {
  apiKey: string;
  providerType?: string;
}): HeadersInit {
  if (isAnthropicProviderType(options.providerType)) {
    return {
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
      "x-api-key": options.apiKey,
    };
  }

  return {
    Authorization: `Bearer ${options.apiKey}`,
    "Content-Type": "application/json",
  };
}

function normalizeProviderModels(data: unknown): ProviderModelRecord[] {
  let rawModels: ProviderModelCandidate[] = [];

  if (Array.isArray(data)) {
    rawModels = data.filter(isProviderModelCandidate);
  } else if (isRecord(data) && Array.isArray(data.data)) {
    rawModels = data.data.filter(isProviderModelCandidate);
  } else if (isRecord(data)) {
    rawModels = Object.values(data).filter(isProviderModelCandidate);
  }

  return rawModels.map((model) => ({
    id: model.id,
    name: model.id,
    created: model.created,
    owned_by: model.owned_by,
  }));
}

export function createProviderLanguageModel(
  options: ProviderRuntimeOptions,
) {
  const normalizedType = normalizeProviderType(options.providerType);
  const resolvedBaseURL = resolveBaseURL(options);

  if (normalizedType === "anthropic") {
    const provider = createAnthropic({
      apiKey: options.apiKey,
      baseURL: resolvedBaseURL,
      ...(options.fetchImpl ? { fetch: options.fetchImpl } : {}),
    });

    return provider.chat(options.modelId);
  }

  if (!isOpenAICompatibleProviderType(normalizedType)) {
    throw new Error(`Unsupported provider type: ${normalizedType}`);
  }

  const provider = createOpenAI({
    apiKey: options.apiKey,
    baseURL: resolvedBaseURL,
    ...(options.fetchImpl ? { fetch: options.fetchImpl } : {}),
  });

  return normalizedType === "openai-response"
    ? provider(options.modelId)
    : provider.chat(options.modelId);
}

export async function testProviderConnection(
  options: ProviderRuntimeOptions,
): Promise<void> {
  const model = createProviderLanguageModel(options);

  await generateText({
    abortSignal: createTimeoutAbortSignal(CONNECTION_PROBE_TIMEOUT_MS),
    maxOutputTokens: 1,
    model,
    messages: [{ role: "user", content: CONNECTION_PROBE_PROMPT }],
  });
}

export async function listProviderModels(
  options: ProviderListModelsOptions,
): Promise<ProviderModelRecord[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const resolvedBaseURL = resolveBaseURL(options).replace(/\/+$/, "");

  const response = await fetchImpl(`${resolvedBaseURL}/models`, {
    method: "GET",
    headers: buildModelsHeaders({
      apiKey: options.apiKey,
      providerType: options.providerType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (isRecord(errorData)
        ? (errorData.error as { message?: string } | undefined)?.message
        : undefined)
      || `Failed to fetch models from provider (${response.status})`,
    );
  }

  return normalizeProviderModels(await response.json());
}
