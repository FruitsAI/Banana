import {
  createThread as dbCreateThread,
  deleteThread as dbDeleteThread,
  getMcpServers as dbGetMcpServers,
  getModelsByProvider as dbGetModelsByProvider,
  getProviders as dbGetProviders,
  getThreads as dbGetThreads,
  updateThreadTitle as dbUpdateThreadTitle,
  type McpServer,
  type Model,
  type Provider,
} from "@/lib/db";
import type { Thread } from "@/domain/chat/types";
import { AppError, normalizeError } from "@/shared/errors";
import {
  fromStoredMessageRecord as fromStoredMessageRecordInternal,
  loadPersistedMessages as loadPersistedMessagesInternal,
  toStoredMessageRecord as toStoredMessageRecordInternal,
} from "./persistence";
import {
  createRuntimeToolMap as createRuntimeToolMapInternal,
  normalizeToolFailure as normalizeToolFailureInternal,
  preloadRuntimeToolDiscovery as preloadRuntimeToolDiscoveryInternal,
  normalizeToolSuccess as normalizeToolSuccessInternal,
} from "./mcp-tools";
import {
  buildChatRequestBody as buildChatRequestBodyInternal,
  createChatRuntime as createChatRuntimeInternal,
} from "./runtime";
import { generateConversationTitle as generateConversationTitleInternal } from "./title";

function wrapError(operation: string, error: unknown): AppError {
  return normalizeError(error, {
    domain: "chat",
    operation,
    code: "SERVICE_ERROR",
  });
}

export async function getThreads(): Promise<Thread[]> {
  try {
    return await dbGetThreads();
  } catch (error) {
    throw wrapError("getThreads", error);
  }
}

export async function createThread(
  id: string,
  title: string,
  modelId?: string,
): Promise<void> {
  try {
    await dbCreateThread(id, title, modelId);
  } catch (error) {
    throw wrapError("createThread", error);
  }
}

export async function updateThreadTitle(id: string, title: string): Promise<void> {
  try {
    await dbUpdateThreadTitle(id, title);
  } catch (error) {
    throw wrapError("updateThreadTitle", error);
  }
}

export async function deleteThread(id: string): Promise<void> {
  try {
    await dbDeleteThread(id);
  } catch (error) {
    throw wrapError("deleteThread", error);
  }
}

export async function getProvidersForChat(): Promise<Provider[]> {
  try {
    return await dbGetProviders();
  } catch (error) {
    throw wrapError("getProvidersForChat", error);
  }
}

export async function getModelsByProviderForChat(providerId: string): Promise<Model[]> {
  try {
    return await dbGetModelsByProvider(providerId);
  } catch (error) {
    throw wrapError("getModelsByProviderForChat", error);
  }
}

export async function getMcpServersForChat(): Promise<McpServer[]> {
  try {
    return await dbGetMcpServers();
  } catch (error) {
    throw wrapError("getMcpServersForChat", error);
  }
}

export function toStoredMessageRecord(
  ...args: Parameters<typeof toStoredMessageRecordInternal>
): ReturnType<typeof toStoredMessageRecordInternal> {
  try {
    return toStoredMessageRecordInternal(...args);
  } catch (error) {
    throw wrapError("toStoredMessageRecord", error);
  }
}

export function fromStoredMessageRecord(
  ...args: Parameters<typeof fromStoredMessageRecordInternal>
): ReturnType<typeof fromStoredMessageRecordInternal> {
  try {
    return fromStoredMessageRecordInternal(...args);
  } catch (error) {
    throw wrapError("fromStoredMessageRecord", error);
  }
}

export async function loadPersistedMessages(
  ...args: Parameters<typeof loadPersistedMessagesInternal>
): ReturnType<typeof loadPersistedMessagesInternal> {
  try {
    return await loadPersistedMessagesInternal(...args);
  } catch (error) {
    throw wrapError("loadPersistedMessages", error);
  }
}

export async function createRuntimeToolMap(
  ...args: Parameters<typeof createRuntimeToolMapInternal>
): ReturnType<typeof createRuntimeToolMapInternal> {
  try {
    return await createRuntimeToolMapInternal(...args);
  } catch (error) {
    throw wrapError("createRuntimeToolMap", error);
  }
}

export async function preloadRuntimeToolDiscovery(
  ...args: Parameters<typeof preloadRuntimeToolDiscoveryInternal>
): ReturnType<typeof preloadRuntimeToolDiscoveryInternal> {
  try {
    return await preloadRuntimeToolDiscoveryInternal(...args);
  } catch (error) {
    throw wrapError("preloadRuntimeToolDiscovery", error);
  }
}

export function normalizeToolSuccess(
  ...args: Parameters<typeof normalizeToolSuccessInternal>
): ReturnType<typeof normalizeToolSuccessInternal> {
  try {
    return normalizeToolSuccessInternal(...args);
  } catch (error) {
    throw wrapError("normalizeToolSuccess", error);
  }
}

export function normalizeToolFailure(
  ...args: Parameters<typeof normalizeToolFailureInternal>
): ReturnType<typeof normalizeToolFailureInternal> {
  try {
    return normalizeToolFailureInternal(...args);
  } catch (error) {
    throw wrapError("normalizeToolFailure", error);
  }
}

export function buildChatRequestBody(
  ...args: Parameters<typeof buildChatRequestBodyInternal>
): ReturnType<typeof buildChatRequestBodyInternal> {
  try {
    return buildChatRequestBodyInternal(...args);
  } catch (error) {
    throw wrapError("buildChatRequestBody", error);
  }
}

export function createChatRuntime(
  ...args: Parameters<typeof createChatRuntimeInternal>
): ReturnType<typeof createChatRuntimeInternal> {
  try {
    return createChatRuntimeInternal(...args);
  } catch (error) {
    throw wrapError("createChatRuntime", error);
  }
}

export async function generateConversationTitle(
  ...args: Parameters<typeof generateConversationTitleInternal>
): ReturnType<typeof generateConversationTitleInternal> {
  try {
    return await generateConversationTitleInternal(...args);
  } catch (error) {
    throw wrapError("generateConversationTitle", error);
  }
}
