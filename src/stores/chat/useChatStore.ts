import { useCallback } from "react";
import type { BananaUIMessage, Message, Thread } from "@/domain/chat/types";
import {
  appendMessage,
  createThread,
  deleteMessagesAfter,
  deleteThread,
  getMessages,
  getThreads,
  loadPersistedMessages,
  updateMessage,
  updateThreadTitle,
} from "@/services/chat";
import { replacePersistedMessages } from "@/services/chat/persistence";

export function useChatStore() {
  const loadThreads = useCallback(async (): Promise<Thread[]> => {
    return await getThreads();
  }, []);

  const createChatThread = useCallback(
    async (id: string, title: string, modelId?: string): Promise<void> => {
      await createThread(id, title, modelId);
    },
    [],
  );

  const renameChatThread = useCallback(async (id: string, title: string): Promise<void> => {
    await updateThreadTitle(id, title);
  }, []);

  const removeChatThread = useCallback(async (id: string): Promise<void> => {
    await deleteThread(id);
  }, []);

  const loadMessages = useCallback(async (threadId: string): Promise<Message[]> => {
    return await getMessages(threadId);
  }, []);

  const appendChatMessage = useCallback(async (message: Omit<Message, "created_at">): Promise<void> => {
    await appendMessage(message);
  }, []);

  const truncateMessagesAfter = useCallback(async (threadId: string, messageId: string): Promise<void> => {
    await deleteMessagesAfter(threadId, messageId);
  }, []);

  const updateChatMessage = useCallback(async (id: string, content: string): Promise<void> => {
    await updateMessage(id, content);
  }, []);

  const loadCanonicalMessages = useCallback(async (threadId: string): Promise<BananaUIMessage[]> => {
    return await loadPersistedMessages(threadId);
  }, []);

  const replaceCanonicalMessages = useCallback(
    async (threadId: string, messages: BananaUIMessage[]): Promise<void> => {
      await replacePersistedMessages(threadId, messages);
    },
    [],
  );

  return {
    loadThreads,
    createChatThread,
    renameChatThread,
    removeChatThread,
    loadMessages,
    appendChatMessage,
    truncateMessagesAfter,
    updateChatMessage,
    loadCanonicalMessages,
    replaceCanonicalMessages,
  };
}
