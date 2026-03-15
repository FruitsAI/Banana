# Model Capabilities Tags Design

Date: 2026-03-15

## Goal
Replace mock capability tags in the model selector with real, persisted capability data that is auto-inferred by default and can be manually overridden later.

## Scope
- Add capability fields to model storage.
- Infer capabilities on create as a default.
- Render real capabilities in the model selector UI.
- Keep backward compatibility for existing databases.

## Non-Goals
- UI for manual editing of capabilities (future extension).
- Live remote capability discovery from providers.

## Data Model
### Database
Add to `models` table:
- `capabilities TEXT` (JSON string array, e.g. `["vision","tools"]`)
- `capabilities_source TEXT` (`"auto"` or `"manual"`)

Migration approach: extend `src-tauri/src/db/mod.rs` with `ALTER TABLE` statements like existing `group_name` migration, safe to run repeatedly.

### Backend (Rust)
- Extend `Model` struct with:
  - `capabilities: Option<String>`
  - `capabilities_source: Option<String>`
- Update `SELECT` and `INSERT/UPSERT` to include these columns.

### Frontend (TypeScript)
- Extend `Model` type:
  - `capabilities?: string[]`
  - `capabilities_source?: "auto" | "manual"`
- Convert JSON string <-> array at the DB boundary.

## Capability Inference
When no persisted capabilities exist, infer by `provider_id + model_id` (case-insensitive). Rules append tags if matched:
- `vision`: `vision`, `image`, `multimodal`, `mm`
- `audio`: `audio`, `speech`, `tts`, `whisper`
- `embedding`: `embedding`, `embed`
- `tools`: `tool`, `function`, `tools`
- `reasoning`: `reason`, `o1`, `o3`, `r1`
- `web`: `web`, `browser`, `search`

If no rules match, show no capability tags to avoid misinformation.

## UI Behavior
- Model selector uses `model.capabilities` if present; otherwise falls back to inference.
- New model creation defaults to inferred capabilities and stores them with `capabilities_source="auto"`.

## Error Handling
- Invalid JSON in `capabilities` should be caught and treated as empty.
- If a column doesn’t exist (older DB), migration adds it at startup.

## Files To Update
- `src-tauri/src/db/mod.rs`
- `src-tauri/src/db/models.rs` (if model struct defined here)
- `src-tauri/src/db/model_store.rs`
- `src/lib/db.ts`
- `src/lib/model-settings.ts` (or new util)
- `src/components/models/model-selector.tsx`

## Verification
- Add a model and verify tags appear.
- Ensure old models without `capabilities` still display inferred tags.
- Restart app to confirm migration is safe/idempotent.
