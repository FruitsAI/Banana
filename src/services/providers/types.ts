export interface ProviderRuntimeOptions {
  apiKey: string;
  baseURL?: string;
  fetchImpl?: typeof fetch;
  modelId: string;
  providerType?: string;
}

export interface ProviderListModelsOptions {
  apiKey: string;
  baseURL?: string;
  fetchImpl?: typeof fetch;
  providerType?: string;
}

export interface ProviderModelRecord {
  created?: number;
  id: string;
  name: string;
  owned_by?: string;
}
