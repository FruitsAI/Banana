# Fullstack Refactor Final Closure Plan (2026-03-18)

## 目标
在当前 `codex/fullstack-refactor-impl` 分支内完成剩余迁移收口，使 Banana 达到“主链路全部分层迁移 + 构建可发布 + lint 仅保留可解释遗留或全部清零”的状态。

## 现状快照
- 已完成：Chat / Models / MCP 主域迁移（frontend domain/services/stores + backend commands/services/db）。
- 已完成：统一错误模型（`src/shared/errors.ts`）。
- 已完成：文档刷新与冒烟记录。
- 未收口：
  - 全局配置仍有少量组件直连 `lib/db`（`animation-intensity-provider`）。
  - 组件层仍存在从 `lib/db` 引用类型（`stage.tsx` / `manage-models-dialog.tsx`）。
  - lint 基线仍失败（主要 `no-explicit-any`，集中在 API route 与聊天 Hook）。

## 执行范围

### Task A: Global Config Domain Migration
- Create: `src/domain/config/types.ts`
- Create: `src/services/config/index.ts`
- Create: `src/stores/config/useConfigStore.ts`
- Modify: `src/components/animation-intensity-provider.tsx`

目标：`animation-intensity-provider` 不再直接依赖 `lib/db`，改用 store/service 调用。

### Task B: Type Boundary Cleanup
- Modify: `src/components/layout/stage.tsx`
- Modify: `src/components/models/manage-models-dialog.tsx`

目标：组件层不再从 `lib/db` 导入 `Model/Provider` 类型，统一从 `domain/*/types.ts` 引用。

### Task C: Lint Baseline Cleanup (Critical)
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/models/route.ts`
- Modify: `src/app/api/test-connection/route.ts`
- Modify: `src/hooks/useBananaChat.ts`
- Optional minor fixes if needed: `src/components/layout/stage.tsx`, `src/components/settings/settings-sidebar.tsx`

目标：消除当前 `no-explicit-any` 主要错误，保证 `npm run lint` 可通过。

### Task D: Final Verification & Record
- Run: `cargo build` (`src-tauri`)
- Run: `npm run build`
- Run: `npm run lint`
- 记录最终结果并提交。

## 质量门禁
- 必须：`cargo build` PASS。
- 必须：`npm run build` PASS。
- 目标：`npm run lint` PASS；如无法全过，必须精确说明剩余项并保证“非本轮新增”。
- 必须：不引入新的组件层直连 `lib/db`（业务域）。

## 提交策略
- `refactor: migrate global config to service-store boundary`
- `refactor: align component type imports with domain modules`
- `refactor: remove any usage from api routes and chat hook`
- `chore: finalize fullstack refactor closure verification`

