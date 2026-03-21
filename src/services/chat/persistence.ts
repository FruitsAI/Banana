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

function hasMessageId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeIdToken(value: string | undefined, fallback: string): string {
  const normalized = (value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : fallback;
}

function synthesizePersistedMessageId(options: {
  content?: string;
  createdAt?: string;
  role: BananaUIMessage["role"];
  threadId: string;
}): string {
  return [
    "persisted",
    normalizeIdToken(options.threadId, "thread"),
    normalizeIdToken(options.role, "assistant"),
    normalizeIdToken(options.createdAt, "time"),
    normalizeIdToken(options.content?.slice(0, 24), "message"),
  ].join("-");
}

export function toStoredMessageRecord(
  threadId: string,
  message: BananaUIMessage,
): Omit<PersistedMessageRecord, "created_at"> {
  const content = summarizeMessageText(message);
  const id = hasMessageId(message.id)
    ? message.id
    : synthesizePersistedMessageId({
        threadId,
        role: message.role,
        createdAt: message.metadata?.createdAt,
        content,
      });

  return {
    id,
    thread_id: threadId,
    role: message.role,
    content,
    model_id: message.metadata?.modelId,
    ui_message_json: serializeUIMessage({
      ...message,
      id,
    }),
  };
}

export function fromStoredMessageRecord(
  row: Pick<PersistedMessageRecord, "id" | "role" | "thread_id" | "ui_message_json" | "created_at"> & {
    content?: string;
  },
): BananaUIMessage {
  const normalized: StoredChatMessageRow = {
    id: row.id,
    role: normalizeRole(row.role),
    content: row.content,
    ui_message_json: row.ui_message_json,
  };

  const message = coerceStoredMessageToUIMessage(normalized);
  const content = summarizeMessageText(message);
  const id = hasMessageId(message.id)
    ? message.id
    : synthesizePersistedMessageId({
        threadId: row.thread_id,
        role: message.role,
        createdAt: row.created_at,
        content,
      });

  return {
    ...message,
    id,
    metadata: {
      threadId: message.metadata?.threadId ?? row.thread_id,
      modelId: message.metadata?.modelId,
      providerId: message.metadata?.providerId,
      createdAt: message.metadata?.createdAt ?? row.created_at,
      searchEnabled: message.metadata?.searchEnabled,
      thinkEnabled: message.metadata?.thinkEnabled,
    },
  };
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
    try {
      const partial = await getPersistedMessages(threadId);
      if (partial.length > 0) {
        await deleteMessagesAfter(threadId, partial[0].id);
      }

      if (existing.length > 0) {
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
      }
    } catch (rollbackError) {
      const rollbackErrorMessage =
        rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      throw new Error(
        `replacePersistedMessages failed and rollback also failed; thread may be inconsistent. replacementError=${replacementErrorMessage}; rollbackError=${rollbackErrorMessage}`,
      );
    }

    throw error;
  }
}
