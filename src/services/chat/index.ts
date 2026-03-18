import {
  appendMessage as dbAppendMessage,
  createThread as dbCreateThread,
  deleteMessagesAfter as dbDeleteMessagesAfter,
  deleteThread as dbDeleteThread,
  getMessages as dbGetMessages,
  getThreads as dbGetThreads,
  updateMessage as dbUpdateMessage,
  updateThreadTitle as dbUpdateThreadTitle,
} from "@/lib/db";
import type { Message, Thread } from "@/domain/chat/types";

export class ChatServiceError extends Error {
  readonly operation: string;

  constructor(operation: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`[chat:${operation}] ${detail}`);
    this.name = "ChatServiceError";
    this.operation = operation;
    (this as Error & { cause?: unknown }).cause = cause;
  }
}

function wrapError(operation: string, error: unknown): ChatServiceError {
  if (error instanceof ChatServiceError) {
    return error;
  }
  return new ChatServiceError(operation, error);
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
