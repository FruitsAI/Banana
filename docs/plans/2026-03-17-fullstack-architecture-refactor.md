# Full-Stack Architecture Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Re-architect the codebase into production-grade domain modules with clear frontend/backend layers, without functional regressions.

**Architecture:** Introduce domain-driven module boundaries on both frontend and backend, add service layers, migrate logic domain-by-domain (Chat → Models → MCP), and keep a single-direction data flow from UI to DB.

**Tech Stack:** Next.js, Tauri (Rust), SQLite, SQLx, TypeScript.

---

### Task 1: Create module scaffolding (frontend + backend)

**Files:**
- Create: `/Users/willxue/will/FruitsAI/Banana/src/domain/README.md`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/services/README.md`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/stores/README.md`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/features/README.md`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/shared/README.md`
- Create: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/domain/mod.rs`
- Create: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/services/mod.rs`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/lib.rs`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Add README placeholders describing intended usage for each frontend folder.
- Add Rust `domain` and `services` modules with empty submodules.
- Register new Rust modules in `lib.rs`.

**Step 4: Run tests**
Run: `cargo build`
Expected: PASS

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/domain /Users/willxue/will/FruitsAI/Banana/src/services /Users/willxue/will/FruitsAI/Banana/src/stores /Users/willxue/will/FruitsAI/Banana/src/features /Users/willxue/will/FruitsAI/Banana/src/shared /Users/willxue/will/FruitsAI/Banana/src-tauri/src/domain /Users/willxue/will/FruitsAI/Banana/src-tauri/src/services /Users/willxue/will/FruitsAI/Banana/src-tauri/src/lib.rs
git commit -m "chore: add domain module scaffolding"
```

---

### Task 2: Migrate Chat domain (frontend services + store, backend service)

**Files:**
- Create: `/Users/willxue/will/FruitsAI/Banana/src/domain/chat/types.ts`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/services/chat/index.ts`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/stores/chat/useChatStore.ts`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/hooks/useBananaChat.ts`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/components/layout/threads-sidebar.tsx`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/components/layout/stage.tsx`
- Create: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/services/chat.rs`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/commands.rs`

**Step 1: Write the failing test**
Not applicable (add unit tests later).

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Move thread/message types into `domain/chat/types.ts`.
- Add `services/chat` that wraps existing DB calls with normalized errors.
- Create `useChatStore` and replace direct DB calls in UI/hooks with store/service calls.
- Backend: introduce `services/chat.rs` and route thread/message commands through it (no behavior change).

**Step 4: Run tests**
Run: `cargo build`
Expected: PASS

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/domain/chat /Users/willxue/will/FruitsAI/Banana/src/services/chat /Users/willxue/will/FruitsAI/Banana/src/stores/chat /Users/willxue/will/FruitsAI/Banana/src/hooks/useBananaChat.ts /Users/willxue/will/FruitsAI/Banana/src/components/layout/threads-sidebar.tsx /Users/willxue/will/FruitsAI/Banana/src/components/layout/stage.tsx /Users/willxue/will/FruitsAI/Banana/src-tauri/src/services/chat.rs /Users/willxue/will/FruitsAI/Banana/src-tauri/src/commands.rs
git commit -m "refactor: migrate chat domain to services and store"
```

---

### Task 3: Migrate Models/Providers domain (frontend services + store, backend service)

**Files:**
- Create: `/Users/willxue/will/FruitsAI/Banana/src/domain/models/types.ts`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/services/models/index.ts`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/stores/models/useModelsStore.ts`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/components/settings/sections/models-setting.tsx`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/components/models/model-selector.tsx`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/lib/model-settings.ts`
- Create: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/services/models.rs`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/commands.rs`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Move Provider/Model types into `domain/models/types.ts`.
- Add `services/models` with methods for provider/model CRUD and selection.
- Replace component-level DB invocations with store/service calls.
- Backend: introduce `services/models.rs` and route existing commands through it.

**Step 4: Run tests**
Run: `cargo build`
Expected: PASS

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/domain/models /Users/willxue/will/FruitsAI/Banana/src/services/models /Users/willxue/will/FruitsAI/Banana/src/stores/models /Users/willxue/will/FruitsAI/Banana/src/components/settings/sections/models-setting.tsx /Users/willxue/will/FruitsAI/Banana/src/components/models/model-selector.tsx /Users/willxue/will/FruitsAI/Banana/src/lib/model-settings.ts /Users/willxue/will/FruitsAI/Banana/src-tauri/src/services/models.rs /Users/willxue/will/FruitsAI/Banana/src-tauri/src/commands.rs
git commit -m "refactor: migrate models domain to services and store"
```

---

### Task 4: Migrate MCP domain (frontend services + store, backend service)

**Files:**
- Create: `/Users/willxue/will/FruitsAI/Banana/src/domain/mcp/types.ts`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/services/mcp/index.ts`
- Create: `/Users/willxue/will/FruitsAI/Banana/src/stores/mcp/useMcpStore.ts`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/components/settings/sections/mcp-setting.tsx`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/lib/mcp.ts`
- Create: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/services/mcp.rs`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/commands.rs`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/mcp.rs`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Move MCP types into `domain/mcp/types.ts`.
- Add `services/mcp` wrapping current MCP calls and error normalization.
- Wire MCP UI to store/service.
- Backend: create `services/mcp.rs` for server management and tool invocation wrappers.

**Step 4: Run tests**
Run: `cargo build`
Expected: PASS

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/domain/mcp /Users/willxue/will/FruitsAI/Banana/src/services/mcp /Users/willxue/will/FruitsAI/Banana/src/stores/mcp /Users/willxue/will/FruitsAI/Banana/src/components/settings/sections/mcp-setting.tsx /Users/willxue/will/FruitsAI/Banana/src/lib/mcp.ts /Users/willxue/will/FruitsAI/Banana/src-tauri/src/services/mcp.rs /Users/willxue/will/FruitsAI/Banana/src-tauri/src/commands.rs /Users/willxue/will/FruitsAI/Banana/src-tauri/src/mcp.rs
git commit -m "refactor: migrate mcp domain to services and store"
```

---

### Task 5: Wire AppError normalization and shared utilities

**Files:**
- Create: `/Users/willxue/will/FruitsAI/Banana/src/shared/errors.ts`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/services/chat/index.ts`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/services/models/index.ts`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/services/mcp/index.ts`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/hooks/useToast.ts`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Add `AppError` shape and `normalizeError` helper.
- Use `AppError` in all services.
- Toast layer consumes only `message`.

**Step 4: Run tests**
Run: `npm run lint` if available; otherwise skip.
Expected: PASS or skip with note.

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/shared/errors.ts /Users/willxue/will/FruitsAI/Banana/src/services/chat/index.ts /Users/willxue/will/FruitsAI/Banana/src/services/models/index.ts /Users/willxue/will/FruitsAI/Banana/src/services/mcp/index.ts /Users/willxue/will/FruitsAI/Banana/src/hooks/useToast.ts
git commit -m "refactor: add shared error normalization"
```

---

### Task 6: Documentation refresh

**Files:**
- Modify: `/Users/willxue/will/FruitsAI/Banana/README.md`
- Modify: `/Users/willxue/will/FruitsAI/Banana/docs/PRD.md`
- Modify: `/Users/willxue/will/FruitsAI/Banana/docs/PLAN.md`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Replace template README with product overview, dev setup, and architecture summary.
- Update PRD/PLAN to match new module boundaries and migration phases.

**Step 4: Run tests**
Not applicable.

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/README.md /Users/willxue/will/FruitsAI/Banana/docs/PRD.md /Users/willxue/will/FruitsAI/Banana/docs/PLAN.md
git commit -m "docs: update architecture and roadmap"
```

---

### Task 7: Smoke checks

**Step 1: Build backend**
Run: `cargo build` in `src-tauri`
Expected: PASS

**Step 2: Lint frontend**
Run: `npm run lint` if available
Expected: PASS or skip with note

**Step 3: Document results**
Record outcomes in commit message notes.
