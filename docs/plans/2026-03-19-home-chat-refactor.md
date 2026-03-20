# Home Chat Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the home page chat flow around a state-machine-driven chat domain that uses the latest Vercel AI SDK message model, supports multi-turn conversations, and preserves full local thread history including tool outputs.

**Architecture:** Introduce a canonical `BananaUIMessage` model plus a chat session state machine, then move persistence, runtime streaming, and MCP tool orchestration into dedicated services. Keep the home page UI thin by having it read a small chat-session store API instead of owning stream parsing or persistence behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vercel AI SDK 6, Vitest, Tauri 2, Rust, SQLite, MCP.

---

### Task 1: Establish Chat Domain Test Fixtures

**Files:**
- Create: `src/domain/chat/__tests__/fixtures.ts`
- Create: `src/domain/chat/__tests__/ui-message.test.ts`
- Modify: `vitest.config.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createLegacyRow, createToolAssistantMessage } from "./fixtures";
import { coerceStoredMessageToUIMessage, summarizeMessageText } from "@/domain/chat/ui-message";

describe("chat ui message normalization", () => {
  it("maps a legacy stored row into a UI message", () => {
    const result = coerceStoredMessageToUIMessage(createLegacyRow());

    expect(result.id).toBe("msg-user-1");
    expect(result.role).toBe("user");
    expect(result.parts).toEqual([{ type: "text", text: "hello banana" }]);
  });

  it("extracts summary text from assistant parts", () => {
    const result = summarizeMessageText(createToolAssistantMessage());
    expect(result).toContain("final answer");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/domain/chat/__tests__/ui-message.test.ts`

Expected: FAIL because `src/domain/chat/ui-message.ts` and fixture helpers do not exist yet.

**Step 3: Write minimal implementation**

Create reusable fixture builders and the first shape of the UI-message helpers so the test can compile:

```ts
export function summarizeMessageText(message: BananaUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/domain/chat/__tests__/ui-message.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/chat/__tests__/fixtures.ts src/domain/chat/__tests__/ui-message.test.ts src/domain/chat/ui-message.ts vitest.config.ts
git commit -m "test: add chat ui message fixtures"
```

### Task 2: Define Canonical Chat Message Types

**Files:**
- Create: `src/domain/chat/ui-message.ts`
- Modify: `src/domain/chat/types.ts`
- Test: `src/domain/chat/__tests__/ui-message.test.ts`

**Step 1: Write the failing test**

Add a new test that asserts metadata and legacy fallback are preserved:

```ts
it("preserves banana metadata when normalizing serialized ui messages", () => {
  const result = coerceStoredMessageToUIMessage({
    id: "msg-assistant-1",
    role: "assistant",
    content: "fallback",
    ui_message_json: JSON.stringify({
      id: "msg-assistant-1",
      role: "assistant",
      parts: [{ type: "text", text: "streamed answer" }],
      metadata: { modelId: "gpt-4o-mini", threadId: "thread-1" },
    }),
  });

  expect(result.metadata?.modelId).toBe("gpt-4o-mini");
  expect(result.metadata?.threadId).toBe("thread-1");
  expect(summarizeMessageText(result)).toBe("streamed answer");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/domain/chat/__tests__/ui-message.test.ts`

Expected: FAIL because metadata-aware parsing is not implemented yet.

**Step 3: Write minimal implementation**

Add:

- `BananaUIMessage`
- `BananaMessageMetadata`
- `StoredChatMessageRow`
- `coerceStoredMessageToUIMessage`
- `serializeUIMessage`

Keep the types narrow and centered on the fields the app actually needs:

```ts
export interface BananaMessageMetadata {
  threadId: string;
  modelId?: string;
  providerId?: string;
  createdAt?: string;
  searchEnabled?: boolean;
  thinkEnabled?: boolean;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/domain/chat/__tests__/ui-message.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/chat/ui-message.ts src/domain/chat/types.ts src/domain/chat/__tests__/ui-message.test.ts
git commit -m "feat: define canonical chat ui messages"
```

### Task 3: Add Chat Session State Machine Primitives

**Files:**
- Create: `src/domain/chat/session.ts`
- Create: `src/domain/chat/__tests__/session.test.ts`
- Modify: `src/domain/chat/types.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createInitialChatSessionState, reduceChatSession } from "@/domain/chat/session";

describe("chat session reducer", () => {
  it("moves from ready to submitting when a message is sent", () => {
    const initial = createInitialChatSessionState("thread-1");
    const next = reduceChatSession(initial, {
      type: "SEND_MESSAGE",
      messageId: "msg-user-2",
    });

    expect(next.status).toBe("submitting");
    expect(next.activeThreadId).toBe("thread-1");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/domain/chat/__tests__/session.test.ts`

Expected: FAIL because the reducer and state helpers do not exist.

**Step 3: Write minimal implementation**

Add:

- `BananaChatStatus`
- `ChatSessionState`
- `ChatSessionEvent`
- `createInitialChatSessionState`
- `reduceChatSession`

Keep the reducer pure. It should only compute the next state and never call services directly.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/domain/chat/__tests__/session.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/chat/session.ts src/domain/chat/__tests__/session.test.ts src/domain/chat/types.ts
git commit -m "feat: add chat session state machine primitives"
```

### Task 4: Add Persistence Serialization and Legacy Fallback

**Files:**
- Create: `src/services/chat/persistence.ts`
- Create: `src/services/chat/__tests__/persistence.test.ts`
- Modify: `src/services/chat/index.ts`
- Modify: `src/lib/db.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createToolAssistantMessage, createLegacyRow } from "@/domain/chat/__tests__/fixtures";
import { toStoredMessageRecord, fromStoredMessageRecord } from "@/services/chat/persistence";

describe("chat persistence", () => {
  it("stores assistant tool parts in ui_message_json while keeping plain-text content", () => {
    const record = toStoredMessageRecord("thread-1", createToolAssistantMessage());

    expect(record.content).toContain("final answer");
    expect(record.ui_message_json).toContain("\"toolName\"");
  });

  it("hydrates legacy rows without ui_message_json", () => {
    const message = fromStoredMessageRecord(createLegacyRow());

    expect(message.role).toBe("user");
    expect(message.parts[0]).toEqual({ type: "text", text: "hello banana" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/services/chat/__tests__/persistence.test.ts`

Expected: FAIL because the persistence module does not exist and `ui_message_json` is unknown.

**Step 3: Write minimal implementation**

Implement:

- `toStoredMessageRecord(threadId, message)`
- `fromStoredMessageRecord(row)`
- `loadPersistedMessages(threadId)`
- `replacePersistedMessages(threadId, messages)`

Also update `src/lib/db.ts` types to include:

```ts
type PersistedMessageRecord = Omit<Message, "created_at"> & {
  created_at?: string;
  ui_message_json?: string | null;
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/services/chat/__tests__/persistence.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/chat/persistence.ts src/services/chat/__tests__/persistence.test.ts src/services/chat/index.ts src/lib/db.ts
git commit -m "feat: add chat persistence serializer"
```

### Task 5: Expand SQLite Message Schema for Canonical UI Messages

**Files:**
- Modify: `src-tauri/src/db/models.rs`
- Modify: `src-tauri/src/db/mod.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/services/chat.rs`
- Modify: `src/lib/db.ts`

**Step 1: Write the failing test**

Add one TypeScript persistence test that expects `ui_message_json` to survive a round trip through the DB record type:

```ts
it("keeps ui_message_json on stored records", () => {
  const record = toStoredMessageRecord("thread-1", createToolAssistantMessage());
  expect(record.ui_message_json).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/services/chat/__tests__/persistence.test.ts`

Expected: FAIL if the DB-facing record shape still strips `ui_message_json`.

**Step 3: Write minimal implementation**

Update the Rust `messages` table and model:

```rust
pub struct Message {
    pub id: String,
    pub thread_id: String,
    pub role: String,
    pub content: String,
    pub model_id: Option<String>,
    pub ui_message_json: Option<String>,
    pub created_at: String,
}
```

Add:

- `ALTER TABLE messages ADD COLUMN ui_message_json TEXT`
- SELECT / INSERT statements that include the new column
- command payload plumbing in Tauri and `src/lib/db.ts`

**Step 4: Run verification**

Run: `pnpm exec vitest run src/services/chat/__tests__/persistence.test.ts`

Expected: PASS

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: PASS

**Step 5: Commit**

```bash
git add src-tauri/src/db/models.rs src-tauri/src/db/mod.rs src-tauri/src/commands.rs src-tauri/src/services/chat.rs src/lib/db.ts
git commit -m "feat: persist canonical chat ui messages"
```

### Task 6: Refactor the Chat API Route to AI SDK 6 Flow

**Files:**
- Create: `src/app/api/chat/__tests__/route.test.ts`
- Modify: `src/app/api/chat/route.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  validateUIMessages: vi.fn((messages) => messages),
  convertToModelMessages: vi.fn((messages) => messages),
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: () => new Response("ok"),
  })),
}));

it("validates ui messages and returns a ui message stream response", async () => {
  const request = new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify({
      messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }],
      apiKey: "test-key",
      modelId: "gpt-4o-mini",
    }),
  });

  const response = await POST(request);
  expect(response.status).toBe(200);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/app/api/chat/__tests__/route.test.ts`

Expected: FAIL because the current route still assumes legacy message handling.

**Step 3: Write minimal implementation**

Refactor `route.ts` to:

- parse `UIMessage[]`
- call `validateUIMessages`
- call `convertToModelMessages`
- build system instructions in one place
- call `streamText`
- return `toUIMessageStreamResponse`

Preserve runtime metadata needed by search / think and model/provider selection.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/app/api/chat/__tests__/route.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/chat/__tests__/route.test.ts src/app/api/chat/route.ts
git commit -m "refactor: align chat route with ai sdk 6"
```

### Task 7: Build Runtime and MCP Tool Orchestration Services

**Files:**
- Create: `src/services/chat/runtime.ts`
- Create: `src/services/chat/mcp-tools.ts`
- Create: `src/services/chat/__tests__/runtime.test.ts`
- Modify: `src/services/chat/index.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createRuntimeToolMap } from "@/services/chat/mcp-tools";

describe("chat runtime tools", () => {
  it("maps enabled MCP tools into executable chat tools", async () => {
    const tools = await createRuntimeToolMap([
      { id: "server-1", name: "Clock", is_enabled: true } as any,
    ]);

    expect(typeof tools.get_current_time.execute).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/services/chat/__tests__/runtime.test.ts`

Expected: FAIL because the runtime and tool-map services do not exist.

**Step 3: Write minimal implementation**

Implement:

- `createRuntimeToolMap`
- `createChatRuntime`
- normalized tool success and error outputs
- request body builder for `/api/chat`

The runtime service should expose clear callbacks for:

- `onMessagesUpdate`
- `onStatusChange`
- `onError`

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/services/chat/__tests__/runtime.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/chat/runtime.ts src/services/chat/mcp-tools.ts src/services/chat/__tests__/runtime.test.ts src/services/chat/index.ts
git commit -m "feat: add chat runtime and mcp tool orchestration"
```

### Task 8: Create the Chat Session Store

**Files:**
- Create: `src/stores/chat/useChatSession.ts`
- Create: `src/stores/chat/__tests__/useChatSession.test.ts`
- Modify: `src/stores/chat/useChatStore.ts`

**Step 1: Write the failing test**

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useChatSession } from "@/stores/chat/useChatSession";

describe("useChatSession", () => {
  it("hydrates a thread and exposes ready status", async () => {
    const { result } = renderHook(() => useChatSession("thread-1"));

    expect(result.current.status).toBe("hydrating");
  });
});
```

Add follow-up tests for:

- `sendMessage`
- `regenerate`
- `editUserMessage`
- tool-running transition

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/stores/chat/__tests__/useChatSession.test.ts`

Expected: FAIL because `useChatSession` does not exist.

**Step 3: Write minimal implementation**

Wire the session reducer to:

- persistence service
- runtime service
- MCP tool runtime

Expose:

```ts
return {
  status,
  messages,
  error,
  loadThread,
  sendMessage,
  regenerate,
  editUserMessage,
  retry,
  stop,
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/stores/chat/__tests__/useChatSession.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/chat/useChatSession.ts src/stores/chat/__tests__/useChatSession.test.ts src/stores/chat/useChatStore.ts
git commit -m "feat: add chat session store"
```

### Task 9: Migrate the Home Page to the New Store

**Files:**
- Modify: `src/hooks/useBananaChat.ts`
- Modify: `src/components/layout/stage.tsx`
- Modify: `src/app/page.tsx` if needed

**Step 1: Write the failing test**

Add or extend a store-level or component-level test that verifies the page uses canonical messages:

```ts
it("renders tool-backed assistant messages from ui message parts", () => {
  // render StageContent with a mocked session store
  // assert tool status and markdown content are visible
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/stores/chat/__tests__/useChatSession.test.ts src/app/api/chat/__tests__/route.test.ts`

Expected: FAIL because the page and compatibility hook still depend on the legacy shape.

**Step 3: Write minimal implementation**

- convert `useBananaChat.ts` into a thin adapter over `useChatSession`, or remove it if no longer needed
- update `stage.tsx` to render `UIMessage.parts`
- keep existing controls for search, think, edit, regenerate, copy, and model display

Do not reintroduce manual stream parsing or mutable cache refs.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/stores/chat/__tests__/useChatSession.test.ts src/app/api/chat/__tests__/route.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useBananaChat.ts src/components/layout/stage.tsx src/app/page.tsx
git commit -m "refactor: migrate home chat ui to session store"
```

### Task 10: Remove Legacy Flow and Verify End-to-End

**Files:**
- Modify: `src/hooks/useBananaChat.ts`
- Modify: `src/services/chat/index.ts`
- Modify: `src/components/layout/stage.tsx`
- Modify: `package.json` if adding a `test` script is helpful

**Step 1: Write the failing test**

Add one regression test for edit-and-regenerate or multi-turn continuation that currently would fail if legacy replay logic remains:

```ts
it("truncates later assistant turns when editing a prior user message", async () => {
  // hydrate thread with user -> assistant -> user -> assistant
  // edit first user message
  // expect only the preserved prefix to remain before replay starts
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/stores/chat/__tests__/useChatSession.test.ts`

Expected: FAIL until legacy replay edge cases are cleaned up.

**Step 3: Write minimal implementation**

- remove `pendingMessagesCache`
- remove manual `ReadableStream` parsing
- remove custom `MAX_STEPS` loop
- centralize retry / replay semantics in the session store

Optionally add:

```json
"test": "vitest run"
```

to make verification easier.

**Step 4: Run full verification**

Run: `pnpm exec vitest run`
Expected: PASS

Run: `pnpm exec eslint src`
Expected: PASS

Run: `pnpm exec tsc --noEmit`
Expected: PASS

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useBananaChat.ts src/services/chat/index.ts src/components/layout/stage.tsx package.json
git commit -m "refactor: complete home chat session migration"
```
