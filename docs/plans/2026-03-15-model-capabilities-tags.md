# Model Capabilities Tags Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist model capability tags, infer defaults, and replace mock UI tags with real capabilities.

**Architecture:** Extend the models table with capability metadata, keep inference in a small utility for fallback rendering and defaults, and wire the selector to render real tags. DB boundary handles JSON serialization for capabilities.

**Tech Stack:** Tauri (Rust + SQLx), Next.js/React, TypeScript, SQLite.

---

### Task 1: Add capability columns to SQLite schema and migration

**Files:**
- Modify: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/db/mod.rs`

**Step 1: Write the failing test**
Not applicable (no DB test harness in repo).

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- In the `CREATE TABLE IF NOT EXISTS models` statement, add columns:
  - `capabilities TEXT`
  - `capabilities_source TEXT`
- Add migration lines similar to existing `group_name`:
  - `ALTER TABLE models ADD COLUMN capabilities TEXT`
  - `ALTER TABLE models ADD COLUMN capabilities_source TEXT`

**Step 4: Run tests**
Run: `cargo build` (sanity compile)
Expected: PASS

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src-tauri/src/db/mod.rs
git commit -m "feat: add model capabilities columns"
```

---

### Task 2: Extend Rust model storage for capabilities

**Files:**
- Modify: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/db/models.rs`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src-tauri/src/db/model_store.rs`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Extend `Model` struct fields to include:
  - `capabilities: Option<String>`
  - `capabilities_source: Option<String>`
- Update `SELECT` to fetch these columns.
- Update `INSERT/UPSERT` to write these columns.

**Step 4: Run tests**
Run: `cargo build`
Expected: PASS

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src-tauri/src/db/models.rs \
        /Users/willxue/will/FruitsAI/Banana/src-tauri/src/db/model_store.rs
git commit -m "feat: persist model capabilities"
```

---

### Task 3: Extend TS model type and JSON handling at DB boundary

**Files:**
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/lib/db.ts`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Extend `Model` type with `capabilities?: string[]` and `capabilities_source?: "auto" | "manual"`.
- Add helpers to serialize and parse `capabilities` at invocation boundaries so UI receives arrays.

**Step 4: Run tests**
Run: `npm run lint` if available; otherwise skip.
Expected: PASS or skip with note.

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/lib/db.ts
git commit -m "feat: add model capability types"
```

---

### Task 4: Add capability inference helper

**Files:**
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/lib/model-settings.ts`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Add `inferModelCapabilities(providerId: string, modelId: string): string[]` using the rule set:
  - vision: `vision`, `image`, `multimodal`, `mm`
  - audio: `audio`, `speech`, `tts`, `whisper`
  - embedding: `embedding`, `embed`
  - tools: `tool`, `function`, `tools`
  - reasoning: `reason`, `o1`, `o3`, `r1`
  - web: `web`, `browser`, `search`
- Export helper for UI use.

**Step 4: Run tests**
Run: `npm run lint` if available; otherwise skip.
Expected: PASS or skip with note.

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/lib/model-settings.ts
git commit -m "feat: infer model capabilities"
```

---

### Task 5: Store inferred capabilities on model creation

**Files:**
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/components/models/add-model-dialog.tsx`
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/components/settings/sections/models-setting.tsx`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- When creating/upserting a model, if `capabilities` not provided, set it to `inferModelCapabilities(...)` and set `capabilities_source="auto"`.
- Ensure existing models with capabilities are not overwritten.

**Step 4: Run tests**
Run: `npm run lint` if available; otherwise skip.
Expected: PASS or skip with note.

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/components/models/add-model-dialog.tsx \
        /Users/willxue/will/FruitsAI/Banana/src/components/settings/sections/models-setting.tsx
git commit -m "feat: save inferred model capabilities"
```

---

### Task 6: Replace mock tags in selector with real capabilities

**Files:**
- Modify: `/Users/willxue/will/FruitsAI/Banana/src/components/models/model-selector.tsx`

**Step 1: Write the failing test**
Not applicable.

**Step 2: Run test to verify it fails**
Not applicable.

**Step 3: Write minimal implementation**
- Replace mock tag icons with a list driven by `model.capabilities` or inferred fallback.
- Map capability labels to icons and colors (e.g., vision => ViewIcon, tools => Wrench01Icon, reasoning => AiBrain02Icon, web => InternetIcon, audio => AudioWave01Icon if available, embedding => Database01Icon if available).
- If no capabilities, omit the tag row to avoid misleading UI.

**Step 4: Run tests**
Run: `npm run lint` if available; otherwise skip.
Expected: PASS or skip with note.

**Step 5: Commit**
```bash
git add /Users/willxue/will/FruitsAI/Banana/src/components/models/model-selector.tsx
git commit -m "feat: render model capability tags"
```

---

### Task 7: Smoke check + merge

**Files:**
- No new files

**Step 1: Run minimal checks**
Run: `cargo build`
Expected: PASS

**Step 2: Optional lint**
Run: `npm run lint` if script exists.
Expected: PASS or skip with note.

**Step 3: Commit/merge**
- Merge branch or open PR depending on workflow.
