import {
  appendMessage as dbAppendMessage,
  createThread as dbCreateThread,
  deleteMessagesAfter as dbDeleteMessagesAfter,
  deleteThread as dbDeleteThread,
  getMessages as dbGetMessages,
  getMcpServers as dbGetMcpServers,
  getModelsByProvider as dbGetModelsByProvider,
  getProviders as dbGetProviders,
  getThreads as dbGetThreads,
  updateMessage as dbUpdateMessage,
  updateThreadTitle as dbUpdateThreadTitle,
  type McpServer,
  type Model,
  type Provider,
} from "@/lib/db";
import type { Message, Thread } from "@/domain/chat/types";
import { AppError, normalizeError } from "@/shared/errors";

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

export async function getMessages(threadId: string): Promise<Message[]> {
  try {
    return await dbGetMessages(threadId);
  } catch (error) {
    throw wrapError("getMessages", error);
  }
}

export async function appendMessage(msg: Omit<Message, "created_at">): Promise<void> {
  try {
    await dbAppendMessage(msg);
  } catch (error) {
    throw wrapError("appendMessage", error);
  }
}

export async function deleteMessagesAfter(threadId: string, messageId: string): Promise<void> {
  try {
    await dbDeleteMessagesAfter(threadId, messageId);
  } catch (error) {
    throw wrapError("deleteMessagesAfter", error);
  }
}

export async function updateMessage(id: string, content: string): Promise<void> {
  try {
    await dbUpdateMessage(id, content);
  } catch (error) {
    throw wrapError("updateMessage", error);
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
