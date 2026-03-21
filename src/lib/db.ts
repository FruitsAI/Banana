import { invoke } from '@tauri-apps/api/core';
import type { Message, Thread } from '@/domain/chat/types';
import type { Model, Provider } from '@/domain/models/types';
import type { McpServer } from '@/domain/mcp/types';

export type { Message, Thread } from '@/domain/chat/types';
export type { Model, Provider } from '@/domain/models/types';
export type { McpServer } from '@/domain/mcp/types';

export type PersistedMessageRecord = Omit<Message, "created_at"> & {
  created_at?: string;
  ui_message_json?: string | null;
};

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

export async function deleteMessagesAfter(threadId: string, messageId: string): Promise<void> {
  await invoke('db_delete_messages_after', { threadId, messageId });
}

export async function getPersistedMessages(threadId: string): Promise<PersistedMessageRecord[]> {
  const rows = await invoke<PersistedMessageRecord[]>('db_get_messages', { threadId });
  return rows.map((row) => ({
    ...row,
    ui_message_json: row.ui_message_json ?? null,
  }));
}

export async function appendPersistedMessage(
  msg: Omit<PersistedMessageRecord, 'created_at'>
): Promise<void> {
  await invoke('db_append_message', { msg: { ...msg, created_at: new Date().toISOString() } });
}

/**
 * AI Provider / Model / MCP
 */

export async function getProviders(): Promise<Provider[]> {
  return await invoke('db_get_providers');
}

export async function upsertProvider(p: Provider): Promise<void> {
  await invoke('db_upsert_provider', { provider: p });
}

export async function deleteProvider(providerId: string): Promise<void> {
  await invoke('db_delete_provider', { providerId });
}

type ModelPayload = Omit<Model, "capabilities" | "capabilities_source"> & {
  capabilities?: string | null;
  capabilities_source?: Model["capabilities_source"] | null;
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

export async function deleteModel(providerId: string, modelId: string): Promise<void> {
  await invoke('db_delete_model', { providerId, modelId });
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
