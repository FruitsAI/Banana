export type ProviderType =
  | "anthropic"
  | "gemini"
  | "new-api"
  | "ollama"
  | "openai"
  | "openai-response";

interface ProviderRuntimeDescriptor {
  apiSuffix: string;
  isOpenAICompatible: boolean;
  type: ProviderType;
}

const PROVIDER_RUNTIME_DESCRIPTORS: Record<ProviderType, ProviderRuntimeDescriptor> = {
  openai: {
    type: "openai",
    apiSuffix: "/chat/completions",
    isOpenAICompatible: true,
  },
  "openai-response": {
    type: "openai-response",
    apiSuffix: "/responses",
    isOpenAICompatible: true,
  },
  gemini: {
    type: "gemini",
    apiSuffix: "/chat/completions",
    isOpenAICompatible: true,
  },
  anthropic: {
    type: "anthropic",
    apiSuffix: "/messages",
    isOpenAICompatible: false,
  },
  "new-api": {
    type: "new-api",
    apiSuffix: "/chat/completions",
    isOpenAICompatible: true,
  },
  ollama: {
    type: "ollama",
    apiSuffix: "/chat/completions",
    isOpenAICompatible: true,
  },
};

export function normalizeProviderType(providerType?: string): ProviderType {
  if (!providerType) {
    return "openai";
  }

  const normalized = providerType.trim().toLowerCase();
  return (PROVIDER_RUNTIME_DESCRIPTORS[normalized as ProviderType]?.type ?? "openai");
}

export function resolveProviderRuntimeDescriptor(providerType?: string): ProviderRuntimeDescriptor {
  return PROVIDER_RUNTIME_DESCRIPTORS[normalizeProviderType(providerType)];
}

export function resolveProviderApiSuffix(providerType?: string): string {
  return resolveProviderRuntimeDescriptor(providerType).apiSuffix;
}

export function isOpenAICompatibleProviderType(providerType?: string): boolean {
  return resolveProviderRuntimeDescriptor(providerType).isOpenAICompatible;
}

export function isAnthropicProviderType(providerType?: string): boolean {
  return normalizeProviderType(providerType) === "anthropic";
}
