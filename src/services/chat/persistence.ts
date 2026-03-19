import type { BananaUIMessage, StoredChatMessageRow } from "@/domain/chat/types";
import {
  coerceStoredMessageToUIMessage,
  serializeUIMessage,
  summarizeMessageText,
} from "@/domain/chat/ui-message";
import {
  appendPersistedMessage,
  deleteMessagesAfter,
  getPersistedMessages,
  type PersistedMessageRecord,
} from "@/lib/db";

const FALLBACK_ROLE: BananaUIMessage["role"] = "assistant";

function normalizeRole(value: string): BananaUIMessage["role"] {
  if (value === "user" || value === "assistant" || value === "system" || value === "tool") {
    return value;
  }
  return FALLBACK_ROLE;
}

export function toStoredMessageRecord(
  threadId: string,
  message: BananaUIMessage,
): Omit<PersistedMessageRecord, "created_at"> {
  return {
    id: message.id,
    thread_id: threadId,
    role: message.role,
    content: summarizeMessageText(message),
    model_id: message.metadata?.modelId,
    ui_message_json: serializeUIMessage(message),
  };
}

export function fromStoredMessageRecord(
  row: Pick<PersistedMessageRecord, "id" | "role" | "ui_message_json"> & {
    content?: string;
  },
): BananaUIMessage {
  const normalized: StoredChatMessageRow = {
    id: row.id,
    role: normalizeRole(row.role),
    content: row.content,
    ui_message_json: row.ui_message_json,
  };

  return coerceStoredMessageToUIMessage(normalized);
}

export async function loadPersistedMessages(threadId: string): Promise<BananaUIMessage[]> {
  const rows = await getPersistedMessages(threadId);
  return rows.map(fromStoredMessageRecord);
}

export async function replacePersistedMessages(
  threadId: string,
  messages: BananaUIMessage[],
): Promise<void> {
  const existing = await getPersistedMessages(threadId);

  if (existing.length > 0) {
    await deleteMessagesAfter(threadId, existing[0].id);
  }

  try {
    for (const message of messages) {
      await appendPersistedMessage(toStoredMessageRecord(threadId, message));
    }
  } catch (error) {
    const replacementErrorMessage =
      error instanceof Error ? error.message : String(error);

    // Best-effort rollback until backend-side transactions are available.
    if (existing.length > 0) {
      try {
        const partial = await getPersistedMessages(threadId);
        if (partial.length > 0) {
          await deleteMessagesAfter(threadId, partial[0].id);
        }

        for (const row of existing) {
          await appendPersistedMessage({
            id: row.id,
            thread_id: row.thread_id,
            role: row.role,
            content: row.content,
            model_id: row.model_id,
            ui_message_json: row.ui_message_json ?? null,
          });
        }
      } catch (rollbackError) {
        const rollbackErrorMessage =
          rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
        throw new Error(
          `replacePersistedMessages failed and rollback also failed; thread may be inconsistent. replacementError=${replacementErrorMessage}; rollbackError=${rollbackErrorMessage}`,
        );
      }
    }

    throw error;
  }
}
