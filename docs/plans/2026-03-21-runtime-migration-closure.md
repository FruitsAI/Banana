# Runtime And Migration Closure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the remaining runtime gaps and migration debt so provider behavior, seed lifecycle, MCP execution, backend boundaries, and visible UI affordances all match the current product surface.

**Architecture:** Keep the existing `Stage -> useBananaChat -> useChatSession -> services/chat -> /api/*` flow, but introduce a provider runtime adapter layer so protocol behavior lives in one place instead of being duplicated across routes. Treat system-seeded providers/models as explicitly managed records with a persisted lifecycle state, remove deprecated MCP branches, and then finish the remaining frontend/backend migration seams before doing a full verification pass.

**Tech Stack:** Next.js 16, React 19, AI SDK 6, Tauri 2, SQLite, Vitest, ESLint, TypeScript, Rust.

---

### Task 1: Lock Down Provider Runtime Gaps With Failing Tests

**Files:**
- Modify: `src/app/api/chat/__tests__/route.test.ts`
- Create: `src/app/api/models/__tests__/route.test.ts`
- Create: `src/app/api/test-connection/__tests__/route.test.ts`
- Modify: `package.json` (only if additional test deps are required)

**Step 1: Write failing tests for provider-specific runtime behavior**

Add tests for:
- `provider_type="openai"` continues to use the OpenAI-compatible path.
- `provider_type="openai-response"` uses the responses client path.
- `provider_type="anthropic"` does not go through `createOpenAI`.
- `/api/models` does not blindly append `/models` for non-OpenAI providers.
- `/api/test-connection` uses the same provider adapter as `/api/chat`.

**Step 2: Run focused tests to verify RED**

Run:
```bash
npx vitest run src/app/api/chat/__tests__/route.test.ts src/app/api/models/__tests__/route.test.ts src/app/api/test-connection/__tests__/route.test.ts
```

Expected: failures showing `provider_type` is not yet honored end-to-end.

**Step 3: Keep failures minimal**

One test per broken behavior. Remove duplicate assertions that restate the same protocol mismatch.

### Task 2: Introduce A Shared Provider Runtime Adapter

**Files:**
- Create: `src/services/providers/index.ts`
- Create: `src/services/providers/types.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/models/route.ts`
- Modify: `src/app/api/test-connection/route.ts`
- Modify: `src/components/settings/sections/models-setting.tsx`
- Test: `src/app/api/chat/__tests__/route.test.ts`
- Test: `src/app/api/models/__tests__/route.test.ts`
- Test: `src/app/api/test-connection/__tests__/route.test.ts`

**Step 1: Define the adapter contract**

Introduce a shared provider runtime service that answers:
- how to build a chat model/client
- how to test connectivity
- how to discover models
- whether the provider is OpenAI-compatible or native

Keep the API small:
```ts
interface ProviderRuntimeAdapter {
  type: string;
  createLanguageModel(...): LanguageModelLike;
  testConnection(...): Promise<void>;
  listModels(...): Promise<ProviderModel[]>;
}
```

**Step 2: Implement adapters incrementally**

Implement minimal working adapters for:
- `openai`
- `openai-response`
- `gemini`
- `openrouter`
- `ollama`
- `anthropic`

If a provider remains OpenAI-compatible, share one adapter implementation. Only split native behavior where required.

**Step 3: Rewire all three API routes**

Make `/api/chat`, `/api/models`, and `/api/test-connection` call the shared adapter service instead of rolling their own provider logic.

**Step 4: Align the settings preview**

Ensure the preview suffix and route behavior are generated from the same provider metadata, not two disconnected tables.

**Step 5: Run focused tests to verify GREEN**

Run:
```bash
npx vitest run src/app/api/chat/__tests__/route.test.ts src/app/api/models/__tests__/route.test.ts src/app/api/test-connection/__tests__/route.test.ts
```

Expected: PASS.

### Task 3: Make Seeded Providers And Models Deletable Without Resurrection

**Files:**
- Modify: `src/lib/model-settings.ts`
- Modify: `src/services/models/index.ts`
- Modify: `src/lib/db.ts`
- Modify: `src/components/settings/sections/models-setting.tsx`
- Modify: `src/stores/models/useModelsStore.ts`
- Create: `src/lib/__tests__/model-seed-lifecycle.test.ts`
- Modify: `src/lib/__tests__/model-settings.test.ts`

**Step 1: Write failing lifecycle tests**

Add tests for:
- deleting a seeded provider does not recreate it on the next `ensureProvidersReady()`
- deleting a seeded model does not recreate it on the next `ensureProviderModelsReady()`
- migrations still backfill newly introduced seeds when the provider/model has not been explicitly dismissed

**Step 2: Run the focused tests to verify RED**

Run:
```bash
npx vitest run src/lib/__tests__/model-settings.test.ts src/lib/__tests__/model-seed-lifecycle.test.ts
```

**Step 3: Persist seed lifecycle state**

Add explicit config-backed lifecycle markers, for example:
- provider seed status: active / dismissed
- model seed status: active / dismissed

Do not infer deletion intent from absence in the tables.

**Step 4: Update ensure/backfill logic**

Only auto-create or auto-backfill seeded records that are not explicitly dismissed.

**Step 5: Update deletion flows**

When a user deletes a system-seeded provider/model, write the dismissal marker before removing the record.

**Step 6: Run lifecycle tests again**

Run:
```bash
npx vitest run src/lib/__tests__/model-settings.test.ts src/lib/__tests__/model-seed-lifecycle.test.ts
```

Expected: PASS.

### Task 4: Remove Deprecated MCP Transport And Collapse On One Runtime Path

**Files:**
- Modify: `src/lib/mcp.ts`
- Modify: `src/services/mcp/index.ts`
- Modify: `src/services/chat/mcp-tools.ts`
- Modify: `src-tauri/src/mcp.rs`
- Modify: `src-tauri/src/services/mcp.rs`
- Test: `src/services/chat/__tests__/runtime.test.ts`

**Step 1: Write a failing regression test**

Capture the intended MCP path:
- tool discovery goes through `mcp_list_tools`
- tool execution goes through `mcp_call_tool`
- no runtime code depends on `start_mcp_server` or `send_mcp_message`

**Step 2: Run the MCP-focused tests to verify RED**

Run:
```bash
npx vitest run src/services/chat/__tests__/runtime.test.ts
```

**Step 3: Remove or quarantine deprecated transport code**

Either:
- delete `TauriMcpTransport` entirely if unused, or
- move it behind an explicit legacy-only boundary with no production references

Also remove the deprecated Tauri command exposure if the frontend no longer needs it.

**Step 4: Run MCP-focused tests**

Run:
```bash
npx vitest run src/services/chat/__tests__/runtime.test.ts
```

Expected: PASS.

### Task 5: Finish Backend Domain Migration

**Files:**
- Modify: `src-tauri/src/domain/chat.rs`
- Modify: `src-tauri/src/domain/models.rs`
- Modify: `src-tauri/src/domain/mcp.rs`
- Modify: `src-tauri/src/domain/mod.rs`
- Modify: `src-tauri/src/services/chat.rs`
- Modify: `src-tauri/src/services/models.rs`
- Modify: `src-tauri/src/services/mcp.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Write failing Rust-side compile or unit checks**

Add minimal compile-driven or unit test coverage for the new domain boundary responsibilities:
- value normalization
- lifecycle transitions
- service/domain mapping boundaries

**Step 2: Run Rust checks to verify RED**

Run:
```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: compile/test pressure that forces real domain modules instead of placeholders.

**Step 3: Move pure rules and value logic into `domain/*`**

Keep:
- invariants
- normalization
- state transition rules

out of service modules. Services should coordinate IO only.

**Step 4: Re-run Rust verification**

Run:
```bash
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

Expected: PASS.

### Task 6: Close Visible UI And Hook Stubs

**Files:**
- Modify: `src/components/layout/threads-sidebar.tsx`
- Modify: `src/components/models/model-selector.tsx`
- Modify: `src/hooks/useBananaChat.ts`
- Modify: `src/components/layout/stage.tsx` (only if message-delete affordance is surfaced there)
- Create: `src/components/layout/__tests__/threads-sidebar.test.tsx`
- Modify: `src/components/layout/__tests__/stage.test.tsx`
- Modify: `src/hooks/__tests__/useBananaChat.test.ts`

**Step 1: Write failing tests for visible stubs**

Cover:
- quick actions button either opens a real surface or is removed from the UI
- model selector tags actually filter the list or are converted to passive labels without filter wording
- `deleteMessage` is either implemented or removed from the public hook contract

**Step 2: Run focused UI tests to verify RED**

Run:
```bash
npx vitest run src/components/layout/__tests__/threads-sidebar.test.tsx src/components/layout/__tests__/stage.test.tsx src/hooks/__tests__/useBananaChat.test.ts
```

**Step 3: Implement the minimal behavior**

Do not invent new product surface area. Prefer:
- removing misleading affordances
- or wiring them to existing flows

**Step 4: Re-run UI tests**

Run:
```bash
npx vitest run src/components/layout/__tests__/threads-sidebar.test.tsx src/components/layout/__tests__/stage.test.tsx src/hooks/__tests__/useBananaChat.test.ts
```

Expected: PASS.

### Task 7: Global Type And Verification Closure

**Files:**
- Modify: `src/app/api/chat/__tests__/route.test.ts`
- Modify: `src/components/layout/__tests__/stage.test.tsx`
- Modify any supporting fixtures/types required by the fixes above

**Step 1: Run the full verification suite in current state**

Run:
```bash
npx tsc --noEmit --pretty false
npx eslint src
npx vitest run
```

Record the remaining failures before changing code.

**Step 2: Fix type/test debt without widening public behavior**

Focus on:
- test fixture typing
- helper return types
- mock typing that currently collapses to `never` or `{}`

**Step 3: Run final verification**

Run:
```bash
npx tsc --noEmit --pretty false
npx eslint src
npx vitest run
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: all commands pass.

**Step 4: Final integration commit**

```bash
git add docs/plans/2026-03-21-runtime-migration-closure.md src src-tauri package.json
git commit -m "refactor: close runtime and migration gaps"
```
