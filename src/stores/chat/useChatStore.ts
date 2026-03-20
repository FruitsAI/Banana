import { useCallback } from "react";
import type { BananaUIMessage, Thread } from "@/domain/chat/types";
import {
  createThread,
  deleteThread,
  getThreads,
  loadPersistedMessages,
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
    loadCanonicalMessages,
    replaceCanonicalMessages,
  };
}
