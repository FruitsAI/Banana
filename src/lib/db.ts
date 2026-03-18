import { invoke } from '@tauri-apps/api/core';
import type { Message, Thread } from '@/domain/chat/types';

export type { Message, Thread } from '@/domain/chat/types';

/**
 * 持久化全局配置 (setConfig)
 * @description 存储全局级别的 Key-Value 配置映射，比如：API Key、Base URL 以及 MCP 服务的各类启动参数。
 * 这些关键凭据保存在本地 SQLite 中以保障隐私安全。
 */
export async function setConfig(key: string, value: string): Promise<void> {
  await invoke('db_set_config', { key, value });
}

export async function getConfig(key: string): Promise<string | null> {
  return await invoke('db_get_config', { key });
}

export async function getThreads(): Promise<Thread[]> {
  return await invoke('db_get_threads');
}

export async function createThread(id: string, title: string, model_id?: string): Promise<void> {
  await invoke('db_create_thread', { id, title, modelId: model_id });
}

export async function updateThreadTitle(id: string, title: string): Promise<void> {
  await invoke('db_update_thread_title', { id, title });
}

export async function deleteThread(id: string): Promise<void> {
  await invoke('db_delete_thread', { id });
}

export async function updateThreadTime(): Promise<void> {
  // Update thread time is handled automatically by rust when saving a message. 
  // Should rarely be needed on frontend directly now, but we'll leave invoke if needed.
}

export async function getMessages(threadId: string): Promise<Message[]> {
  return await invoke('db_get_messages', { threadId });
}

export async function appendMessage(msg: Omit<Message, 'created_at'>): Promise<void> {
  await invoke('db_append_message', { msg: { ...msg, created_at: new Date().toISOString() } });
}

export async function deleteMessagesAfter(threadId: string, messageId: string): Promise<void> {
  await invoke('db_delete_messages_after', { threadId, messageId });
}

export async function updateMessage(id: string, content: string): Promise<void> {
  await invoke('db_update_message', { id, content });
}

/**
 * AI Provider / Model / MCP
 */
export interface Provider {
  id: string;
  name: string;
  icon: string;
  is_enabled: boolean;
  api_key?: string;
  base_url?: string;
  provider_type?: string;
}

export async function getProviders(): Promise<Provider[]> {
  return await invoke('db_get_providers');
}

export async function upsertProvider(p: Provider): Promise<void> {
  await invoke('db_upsert_provider', { provider: p });
}

export interface Model {
  id: string;
  provider_id: string;
  name: string;
  is_enabled: boolean;
  group_name?: string | null;
  capabilities?: string[];
  capabilities_source?: "auto" | "manual";
}

type ModelPayload = Omit<Model, "capabilities" | "capabilities_source"> & {
  capabilities?: string | null;
  capabilities_source?: string | null;
};

function parseCapabilities(raw?: string | null): string[] | undefined {
  if (!raw || !raw.trim()) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function serializeCapabilities(value?: string[] | null): string | null {
  if (!value || value.length === 0) {
    return null;
  }
  return JSON.stringify(value);
}

function normalizeModel(raw: ModelPayload): Model {
  return {
    ...raw,
    capabilities: parseCapabilities(raw.capabilities),
    capabilities_source: raw.capabilities_source ?? undefined,
  };
}

export async function getModelsByProvider(providerId: string): Promise<Model[]> {
  const rows = await invoke<ModelPayload[]>('db_get_models_by_provider', { providerId });
  return rows.map(normalizeModel);
}

export async function upsertModel(m: Model): Promise<void> {
  const payload: ModelPayload = {
    ...m,
    capabilities: serializeCapabilities(m.capabilities),
    capabilities_source: m.capabilities_source ?? null,
  };
  await invoke('db_upsert_model', { model: payload });
}

export async function deleteModel(modelId: string): Promise<void> {
  await invoke('db_delete_model', { modelId });
}

export interface McpServer {
  id: string;
  name: string;
  description?: string;
  type: string;
  command: string;
  args?: string;
  env_vars?: string;
  is_enabled: boolean;
}

export async function getMcpServers(): Promise<McpServer[]> {
  return await invoke('db_get_mcp_servers');
}

export async function upsertMcpServer(s: McpServer): Promise<void> {
  await invoke('db_upsert_mcp_server', { server: s });
}

export async function deleteMcpServer(serverId: string): Promise<void> {
  await invoke('db_delete_mcp_server', { serverId });
}
