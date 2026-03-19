# Home Chat Refactor Design

## Summary

Refactor the home page chat experience around a chat-domain state machine that is compatible with the latest Vercel AI SDK message flow, preserves local persistence, and supports stable multi-turn conversations with MCP tools, edit-and-regenerate, and thread hydration.

## Goals

- Replace the overloaded home chat hook with a clearer chat-domain architecture.
- Adopt AI SDK 6 style `UIMessage`-driven streaming and persistence.
- Preserve local thread/message persistence across refreshes and thread switches.
- Keep existing user-facing capabilities:
  - multi-turn conversation
  - MCP tool usage
  - search / think runtime options
  - edit user message and regenerate from that point
  - retry / rerun from prior context
- Reduce frontend coupling between page components, streaming logic, persistence, and tool orchestration.

## Non-Goals

- Redesign the chat UI or visual layout.
- Rework thread list UX beyond what is required for the new data flow.
- Introduce cloud sync or remote persistence.
- Rewrite unrelated settings, model management, or non-chat Tauri modules.

## Current Problems

The current implementation in `src/hooks/useBananaChat.ts` combines too many concerns in one place:

- thread initialization
- optimistic UI updates
- local persistence
- manual stream parsing
- MCP tool orchestration
- multi-step assistant looping
- regenerate / edit replay behavior
- routing side effects

This creates several practical issues:

- Multi-turn and tool-driven turns are hard to reason about because the hook manually reconstructs assistant and tool messages.
- The current flow stores only plain text message fields, so richer AI SDK message structure is lost after refresh.
- The streaming loop is hand-maintained even though the latest AI SDK already provides a message-oriented flow.
- The page component still owns too much interaction logic and depends on hook internals.

## Proposed Architecture

The refactor should split the chat domain into four layers.

### 1. Domain Layer

Create chat-domain state and message definitions under `src/domain/chat`.

This layer should define:

- `BananaChatStatus`
- `ChatSessionState`
- `ChatSessionEvent`
- `ChatSessionCommand`
- `BananaUIMessage`
- thread hydration and replay helpers

This layer must stay framework-agnostic. It should not import React, database code, Tauri APIs, or fetch clients.

### 2. Services Layer

Move side effects into focused chat services under `src/services/chat`.

Recommended service split:

- `persistence.ts`
  - load thread messages
  - create thread
  - append / replace / truncate persisted messages
  - migrate old rows to richer message format
- `runtime.ts`
  - send chat requests to `/api/chat`
  - bridge AI SDK message streaming into store updates
  - pass per-turn runtime options such as search / think
- `mcp-tools.ts`
  - resolve enabled MCP servers
  - map MCP tools into client-side tool executors
  - normalize tool success and error payloads

### 3. Store Layer

Create a chat session store under `src/stores/chat` that owns the session state machine and exposes UI-facing actions.

This store should:

- hydrate the active thread
- submit user messages
- manage streaming status
- handle MCP tool execution lifecycle
- persist completed turns
- support regenerate and edit-and-regenerate
- expose stable selectors and actions to the page

### 4. UI Layer

Keep page components under `src/components/layout` and related UI code presentation-focused.

The home page should only:

- read message state
- render `UIMessage` parts
- dispatch actions such as send, regenerate, edit, retry, stop
- show status and error feedback

The page should no longer parse streams, construct tool state manually, or perform persistence operations directly.

## Message Model

The refactor should use a `UIMessage`-based model as the single source of truth for home chat sessions.

### Canonical Message Shape

Define a `BananaUIMessage` type that wraps AI SDK `UIMessage` and adds metadata required by the app, such as:

- `threadId`
- `modelId`
- `providerId`
- `createdAt`
- `searchEnabled`
- `thinkEnabled`

### Persistence Strategy

The current database stores only:

- `role`
- `content`
- `model_id`
- `created_at`

That is insufficient for preserving tool calls and richer assistant parts. The refactor should keep summary-friendly columns but add a serialized canonical message field.

Recommended schema addition for `messages`:

- `ui_message_json TEXT`

Recommended persistence behavior:

- `content` remains the searchable plain-text summary.
- `ui_message_json` stores the full serialized `BananaUIMessage`.
- Reads prefer `ui_message_json` when present.
- Legacy rows without `ui_message_json` are mapped into the new shape at hydration time.

This preserves backward compatibility while allowing the app to restore assistant parts and tool outputs accurately after refresh.

## Runtime Data Flow

### Thread Hydration

When a thread is opened:

1. The store enters `hydrating`.
2. Persistence service loads rows from SQLite.
3. Rows are converted into `BananaUIMessage[]`.
4. The store enters `ready`.

### Send Message

When the user sends a message:

1. Ensure the thread exists.
2. Persist the user message immediately.
3. Update in-memory state optimistically.
4. Transition store state to `submitting`.
5. Start assistant streaming through the runtime service.

### Stream Assistant Response

The runtime service should follow AI SDK 6 message-oriented streaming:

1. Send `UIMessage[]` plus runtime metadata to `/api/chat`.
2. Server validates UI messages and converts them to model messages.
3. `streamText(...).toUIMessageStreamResponse(...)` produces the response stream.
4. The store consumes the streamed message updates and applies them as canonical state.

### Tool Execution

MCP should move to client-side dynamic tools orchestrated by the store.

The model emits tool calls through the AI SDK message flow. The store:

1. resolves the target MCP tool
2. executes it through the MCP service
3. returns success or error output back into the chat runtime
4. allows the model to continue naturally into the next step

This replaces the manual tool loop currently embedded inside `useBananaChat.ts`.

### Regenerate

When regenerating from a message:

1. identify the replay boundary
2. truncate all later persisted messages
3. keep the earlier context
4. start a fresh assistant turn from the preserved context

### Edit and Regenerate

When editing a user message:

1. update that user message in persistence
2. truncate later messages
3. hydrate the preserved prefix
4. rerun the assistant turn from the edited point

## State Machine

The chat session store should explicitly model state transitions instead of deriving them from mutable refs.

Recommended statuses:

- `hydrating`
- `ready`
- `submitting`
- `streaming`
- `tool-running`
- `error`

Recommended events:

- `HYDRATE_THREAD`
- `HYDRATE_SUCCESS`
- `HYDRATE_FAILURE`
- `SEND_MESSAGE`
- `STREAM_UPDATE`
- `TOOL_CALL_STARTED`
- `TOOL_CALL_FINISHED`
- `TURN_PERSISTED`
- `REGENERATE_FROM_MESSAGE`
- `EDIT_USER_MESSAGE`
- `RETRY_LAST_TURN`
- `STOP_STREAM`
- `SWITCH_THREAD`

Recommended public store actions:

- `loadThread(threadId)`
- `sendMessage(text, options)`
- `regenerate(messageId, options)`
- `editUserMessage(messageId, content, options)`
- `retry()`
- `stop()`

## API Route Refactor

`src/app/api/chat/route.ts` should be simplified around the latest AI SDK server flow.

The route should:

- accept `UIMessage[]` and runtime metadata
- validate incoming UI messages
- convert them to model messages
- inject system prompts and runtime flags in one predictable place
- use `streamText`
- return `toUIMessageStreamResponse`

The route should not contain compatibility shims that encode older client assumptions when they are no longer needed.

## Error Handling

The new store should separate failure modes instead of collapsing them into a single generic error string.

Recommended categories:

- `hydrate-error`
- `stream-error`
- `tool-error`
- `persistence-error`

Expected behavior:

- streaming failures should keep already-saved user context and allow retry
- tool failures should feed structured tool error output back to the model so the turn can complete
- persistence failures should surface to the user but avoid discarding the current in-memory session when possible

## Testing Strategy

This refactor should add focused tests around the chat domain rather than starting with UI snapshots.

### Domain / Store Tests

Add tests for:

- thread hydration
- send message transition flow
- streaming updates
- tool call lifecycle
- regenerate boundary selection
- edit-and-regenerate replay
- switch-thread recovery

### Persistence Tests

Add tests for:

- serializing and deserializing `BananaUIMessage`
- legacy row fallback without `ui_message_json`
- truncation behavior for regenerate flows

### Runtime / Route Tests

Add tests for:

- route request validation
- conversion from UI messages to model messages
- runtime metadata injection
- MCP tool mapping and result normalization

## Migration Strategy

The refactor should be introduced incrementally.

### Phase 1

Add the new message model, persistence helpers, and schema support while preserving compatibility with existing rows.

### Phase 2

Introduce the new chat session store and wire it into the home page behind the existing UI.

### Phase 3

Replace the legacy `useBananaChat.ts` implementation with either:

- a thin compatibility adapter over the new store, or
- direct removal if all callers have migrated

### Phase 4

Remove obsolete manual stream parsing, pending-message caches, and tool-loop code paths.

## File Plan

Expected file work for this refactor:

- Create: `src/domain/chat/session.ts`
- Create: `src/domain/chat/ui-message.ts`
- Create: `src/services/chat/persistence.ts`
- Create: `src/services/chat/runtime.ts`
- Create: `src/services/chat/mcp-tools.ts`
- Create: `src/stores/chat/useChatSession.ts`
- Modify: `src/domain/chat/types.ts`
- Modify: `src/services/chat/index.ts`
- Modify: `src/hooks/useBananaChat.ts`
- Modify: `src/components/layout/stage.tsx`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/lib/db.ts`
- Modify: `src-tauri/src/db/models.rs`
- Modify: `src-tauri/src/db/mod.rs`
- Modify: `src-tauri/src/services/chat.rs` if needed for persistence API expansion
- Modify: `src-tauri/src/commands.rs` if new DB commands are required

## Risks

- Persisting richer messages adds a schema change and requires safe fallback for old local databases.
- Tool execution must always produce a matching result event or the model can become stuck waiting.
- Editing and replay logic must avoid off-by-one truncation errors in persisted history.
- The current home page UI assumes plain text plus ad hoc tool state, so rendering needs to shift carefully to `UIMessage.parts`.

## Success Criteria

The refactor is successful when:

- the home page supports stable multi-turn chat using the latest AI SDK flow
- refresh and thread switches restore full message state including tool outputs
- edit and regenerate replay the correct context boundary
- MCP tools continue to work without custom manual stream parsing
- the home chat page consumes a small, stable store API instead of a monolithic hook
