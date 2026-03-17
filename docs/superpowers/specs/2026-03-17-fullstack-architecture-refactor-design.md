# Full-Stack Architecture Refactor Design (Production-Grade)

Date: 2026-03-17

## Goal
Refactor the existing codebase into a production-grade, modular, and extensible architecture without functional regressions. Prioritize clear domain boundaries and a predictable data flow across frontend and backend.

## Scope (Phase 1)
Domains in this phase:
- Chat (threads/messages)
- Models/Providers (configuration + selection)
- MCP/Tools (server management + invocation)

Non-goals in this phase:
- Authentication / cloud sync
- Plugin marketplace / distribution
- Large UX redesigns unrelated to architecture

## Design Principles
- **No regressions**: functionality must remain intact during migration.
- **Single direction data flow**: UI → store → service → command → service → db.
- **Clear ownership**: every feature belongs to exactly one domain.
- **Incremental migration**: add new layers first, then move logic step-by-step.

---

## Architecture

### Frontend (Next.js)
- `app/`: routing + layout shell only
- `features/<domain>/`: domain UI & page-level components
- `stores/`: state containers per domain
- `services/`: side-effect boundary (Tauri invoke, API, error normalization)
- `domain/`: pure types + domain rules
- `shared/`: reusable UI, utilities, constants

**Constraint:** UI never calls Tauri directly; only services may.

### Backend (Tauri/Rust)
- `commands/`: thin I/O boundary
- `services/`: business logic, validation, orchestration
- `db/`: storage access (SQLx)
- `domain/`: shared models + validation rules

**Constraint:** commands should not contain SQL; services own rules.

---

## Domain Breakdown

### 1) Chat (threads/messages)
**Frontend**
- `features/chat`: ThreadsSidebar, Stage, MessageList, Composer
- `domain/chat`: Thread/Message types, chat state machine
- `services/chat`: getThreads, getMessages, appendMessage, streamChat
- `stores/chat`: activeThreadId, message list, loading/streaming state

**Backend**
- `domain/chat`: Thread/Message structs + validation
- `services/chat`: thread lifecycle (create/update/delete), message persistence
- `db/thread_store` + `db/message_store`: SQLx CRUD

### 2) Models/Providers
**Frontend**
- `features/models`: ProviderList, ModelList, Add/Edit dialogs, Selector
- `domain/models`: Provider/Model/Capability rules
- `services/models`: getProviders, upsertProvider, getModels, upsertModel
- `stores/models`: activeProvider, activeModel, search/filter state

**Backend**
- `domain/models`: provider/model validation, capability rules
- `services/models`: CRUD + defaults + inference logic
- `db/provider_store` + `db/model_store`: SQLx CRUD

### 3) MCP/Tools
**Frontend**
- `features/mcp`: Servers list, edit, tool invocation status
- `domain/mcp`: server/tool/invocation types
- `services/mcp`: getServers, upsertServer, deleteServer, invokeTool
- `stores/mcp`: servers list, connection status, invocation state

**Backend**
- `domain/mcp`: server/tool models
- `services/mcp`: process lifecycle, tool discovery, invocation orchestration
- `db/mcp_store`: SQLx CRUD

---

## Data Flow & Error Handling

**Frontend**
- UI → store → service → Tauri invoke
- Service normalizes errors into `AppError { code, message, detail }`
- UI shows only `message` in toast

**Backend**
- `commands` map to `services` only
- `services` return `Result<T>` with explicit error codes
- Map errors to structured responses for frontend

---

## Migration Strategy (No Regression)
1. **Create new folders** (`features/`, `domain/`, `services/`, `stores/`, `shared/`)
2. **Add service layer adapters** mirroring existing APIs
3. **Migrate domain-by-domain** in this order:
   - Chat → Models/Providers → MCP
4. **Remove old paths** only after domain migration is stable
5. **Keep data flow single-direction** throughout

---

## Testing & Release Guardrails
- Minimum checks: `lint` + `cargo build`
- Smoke flows: create thread → send message → select model → call MCP tool
- Add domain/service unit tests incrementally
- CI stage 1: lint + build + unit tests
- CI stage 2: add e2e checks (manual trigger initially)

---

## Deliverables
- New module scaffolding (frontend + backend)
- First domain migrated end-to-end (Chat)
- No functional regressions
- Updated docs for architecture + migration steps

