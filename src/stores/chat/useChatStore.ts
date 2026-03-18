import { useCallback } from "react";
import type { Message, Thread } from "@/domain/chat/types";
import {
  appendMessage,
  createThread,
  deleteMessagesAfter,
  deleteThread,
  getMessages,
  getThreads,
  updateMessage,
  updateThreadTitle,
} from "@/services/chat";

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

  return {
    loadThreads,
    createChatThread,
    renameChatThread,
    removeChatThread,
    loadMessages,
    appendChatMessage,
    truncateMessagesAfter,
    updateChatMessage,
  };
}
