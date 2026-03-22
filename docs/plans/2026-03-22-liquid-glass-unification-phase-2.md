# Liquid Glass Unification Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish the remaining high-value Apple-like liquid-glass refactor work by restoring build health, polishing the chat workspace, refining the Models settings scene, and closing with cross-scene verification.

**Architecture:** Keep the shared material and motion system as the source of truth, then refine each remaining scene to feel like one native desktop product instead of several web screens sharing blur tokens. Prioritize fixes that unblock production verification first, then move from shared chat surfaces to scene-specific settings polish, and end with full-scene QA against the unified design language.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind utilities, Framer Motion, Vitest, Testing Library

---

## Execution Board

- `Done`: Task 1 build-health sweep
  - fixed nullable reduced-motion regressions in chat surfaces
  - restored `pnpm build`, `pnpm test`, and `pnpm lint` to green before the next UI pass
- `In Progress`: Task 2 chat workspace native polish
  - message actions: move from hover-only floating controls to persistent content-adjacent action strips
  - tool surfaces: add calmer nested metadata and align them with the shared message material family
  - assistant message stack: tighten reasoning/tool/content spacing so one reply reads like one composed surface
- `Next`: Task 3 stage chrome and composer
  - titlebar: add native desktop control rhythm and preserve drag-region behavior
  - empty conversation: turn the welcome card into a macOS-style workspace vignette
  - composer: collapse toolbar-like affordances into one integrated input surface
- `Queued`: Task 4 Models preferences polish
  - provider picker: soften list rows into a native settings selector
  - model groups: reduce admin/table feel and strengthen grouped card hierarchy
  - scene rhythm: rebalance spacing so provider, connection, and models read as one pane
- `Final Gate`: Task 5 cross-scene QA
  - verify light/dark, low motion, empty/error/disabled states, then rerun full lint, tests, and build

---

## Remaining Work List

### P0 Build and Surface Baseline
- Restore `pnpm build` by fixing the `useReducedMotion()` nullability regression in the chat tool invocation path.
- Keep the fix aligned with the current animation-intensity abstraction so build health does not regress during later UI passes.

### P1 Chat Workspace Native Polish
- Make titlebar chrome feel more macOS-native instead of a generic glass header.
- Replace hover-only message actions with a more stable, keyboard-friendly action strip.
- Refine message, reasoning, and tool surfaces so they read like native translucent cards rather than web chat bubbles.
- Rebalance composer spacing, controls, and empty-state layout so the whole stage feels like a coherent workspace.

### P2 Models Settings Native Polish
- Soften the provider picker from an admin list into a native preferences selector.
- Reduce the “table-like” feeling in model groups and management affordances.
- Rebalance the overall Models scene spacing so the shell, provider picker, and models area read as one unified preferences space.

### P3 Unified QA and Verification
- Verify light/dark mode, reduced/low motion, empty states, and error/disabled states across settings and chat.
- Run final lint, tests, and build once the unrelated build blocker is cleared.

---

### Task 1: Restore Build Health for Chat Tool Invocation Motion

**Files:**
- Modify: `src/components/chat/tool-invocation-card.tsx`
- Modify: `src/components/chat/__tests__/message-surface.test.tsx`

**Step 1: Write the failing regression coverage**

Add a regression test in `src/components/chat/__tests__/message-surface.test.tsx` that renders `ToolInvocationCard` when reduced-motion returns a nullable value and verifies the tool card still mounts with the correct status text.

**Step 2: Run test to verify the current gap**

Run: `pnpm test src/components/chat/__tests__/message-surface.test.tsx`

Expected: the new regression fails or reveals the current gap in the reduced-motion path.

**Step 3: Fix the nullability regression with minimal code**

Update `src/components/chat/tool-invocation-card.tsx` so reduced-motion handling accepts the `boolean | null` return shape from `useReducedMotion()` and passes a proper boolean/undefined value into `isReducedMotionMode`.

Implementation target:
- Do not change the visual behavior yet.
- Keep the fix local to the tool invocation card.
- Prefer a narrow normalization like `const prefersReducedMotion = shouldReduceMotion ?? undefined`.

**Step 4: Verify the regression test**

Run: `pnpm test src/components/chat/__tests__/message-surface.test.tsx`

Expected: PASS

**Step 5: Verify the production gate**

Run: `pnpm build`

Expected: this task removes the current `tool-invocation-card.tsx` type blocker. If another build error appears afterward, capture it before moving on.

**Step 6: Commit**

```bash
git add src/components/chat/tool-invocation-card.tsx src/components/chat/__tests__/message-surface.test.tsx
git commit -m "fix: restore chat tool invocation build health"
```

---

### Task 2: Make Message Actions and Tool Surfaces Feel Native

**Files:**
- Modify: `src/components/chat/message-toolbar.tsx`
- Modify: `src/components/chat/message-surface.tsx`
- Modify: `src/components/chat/tool-invocation-card.tsx`
- Modify: `src/components/layout/stage/assistant-message.tsx`
- Modify: `src/components/chat/__tests__/message-surface.test.tsx`

**Step 1: Write the failing tests**

Extend `src/components/chat/__tests__/message-surface.test.tsx` with focused cases that verify:
- the toolbar stays docked in the owning surface with a stable, always-available or focus-within-visible action strip instead of a pure hover-only pattern
- tool cards expose richer state metadata and remain visually nested under the same message surface system

**Step 2: Run test to verify it fails**

Run: `pnpm test src/components/chat/__tests__/message-surface.test.tsx`

Expected: FAIL on the new toolbar/tool-surface assertions.

**Step 3: Implement the minimal UI changes**

Update the chat shared surfaces to match the spec:
- `src/components/chat/message-toolbar.tsx`
  - remove the purely hover-only “floating below bubble” behavior
  - convert it to an inline or edge-docked action strip that remains discoverable on focus and touch
  - keep copy/edit/regenerate actions lightweight and content-adjacent
- `src/components/chat/message-surface.tsx`
  - soften bubble borders/shadows for assistant, user, reasoning, and tool variants
  - strengthen the sense that all message blocks belong to one material family
- `src/components/chat/tool-invocation-card.tsx`
  - upgrade state styling so loading/success/failure read as calm nested cards, not status chips
- `src/components/layout/stage/assistant-message.tsx`
  - make sure reasoning, tool blocks, and markdown content stack cleanly within the new shared message language

**Step 4: Verify the focused tests**

Run: `pnpm test src/components/chat/__tests__/message-surface.test.tsx`

Expected: PASS

**Step 5: Verify the surrounding chat stage**

Run: `pnpm test src/components/layout/__tests__/stage.test.tsx`

Expected: PASS

**Step 6: Commit**

```bash
git add src/components/chat/message-toolbar.tsx src/components/chat/message-surface.tsx src/components/chat/tool-invocation-card.tsx src/components/layout/stage/assistant-message.tsx src/components/chat/__tests__/message-surface.test.tsx
git commit -m "feat: refine native chat message actions and tool surfaces"
```

---

### Task 3: Rebalance the Composer and Empty Conversation Workspace

**Files:**
- Modify: `src/components/layout/titlebar.tsx`
- Modify: `src/components/layout/stage/conversation-view.tsx`
- Modify: `src/components/layout/stage/composer-panel.tsx`
- Modify: `src/components/layout/__tests__/stage.test.tsx`

**Step 1: Write the failing tests**

Add or extend chat-stage tests so they verify:
- titlebar exposes native chrome affordances or placeholders for traffic-light-style controls
- the empty conversation state and composer keep their shared workspace hierarchy
- the composer control row stays in the same semantic grouping after the redesign

**Step 2: Run test to verify it fails**

Run: `pnpm test src/components/layout/__tests__/stage.test.tsx`

Expected: FAIL on the new chrome/composer expectations.

**Step 3: Implement the minimal UI changes**

Update the stage and chrome:
- `src/components/layout/titlebar.tsx`
  - introduce native desktop window-control affordances and keep the centered brand + drag region
- `src/components/layout/stage/conversation-view.tsx`
  - tighten the empty-state visual rhythm so it feels like a macOS workspace welcome card, not a web hero
  - keep quick actions secondary and quieter than the main prompt invitation
- `src/components/layout/stage/composer-panel.tsx`
  - restyle the textarea, toggles, model selector, and send affordance as one integrated input surface
  - reduce the “toolbar inside a card” feeling and make it read as a single native composer

**Step 4: Verify the targeted tests**

Run: `pnpm test src/components/layout/__tests__/stage.test.tsx`

Expected: PASS

**Step 5: Verify adjacent stage behavior**

Run: `pnpm test src/components/chat/__tests__/message-surface.test.tsx`

Expected: PASS

**Step 6: Commit**

```bash
git add src/components/layout/titlebar.tsx src/components/layout/stage/conversation-view.tsx src/components/layout/stage/composer-panel.tsx src/components/layout/__tests__/stage.test.tsx
git commit -m "feat: unify native chat workspace chrome and composer"
```

---

### Task 4: Refine the Models Settings Picker and Model Groups

**Files:**
- Modify: `src/components/settings/sections/models-setting.tsx`
- Modify: `src/components/settings/sections/models-setting/provider-sidebar.tsx`
- Modify: `src/components/settings/sections/models-setting/model-groups-panel.tsx`
- Modify: `src/components/settings/sections/models-setting.test.tsx`

**Step 1: Write the failing tests**

Extend `src/components/settings/sections/models-setting.test.tsx` to verify:
- provider rows behave like a native settings picker rather than a compact admin list
- the model groups area presents clearer, softer group hierarchy and preserves action affordances

**Step 2: Run test to verify it fails**

Run: `pnpm test src/components/settings/sections/models-setting.test.tsx`

Expected: FAIL on the new provider/group hierarchy assertions.

**Step 3: Implement the minimal UI changes**

Update the Models scene:
- `src/components/settings/sections/models-setting/provider-sidebar.tsx`
  - replace dense bordered list rows with softer grouped picker rows
  - demote raw status badges and emphasize selected-state continuity
- `src/components/settings/sections/models-setting/model-groups-panel.tsx`
  - reduce the current table/collapsible feel
  - present model rows and actions as calmer grouped cards with clearer default/active emphasis
- `src/components/settings/sections/models-setting.tsx`
  - rebalance spacing and grid rhythm so provider, connection, and model management read as one preferences scene

**Step 4: Verify the focused tests**

Run: `pnpm test src/components/settings/sections/models-setting.test.tsx`

Expected: PASS

**Step 5: Verify the settings area**

Run: `pnpm test src/components/settings`

Expected: PASS

**Step 6: Commit**

```bash
git add src/components/settings/sections/models-setting.tsx src/components/settings/sections/models-setting/provider-sidebar.tsx src/components/settings/sections/models-setting/model-groups-panel.tsx src/components/settings/sections/models-setting.test.tsx
git commit -m "feat: refine native models settings hierarchy"
```

---

### Task 5: Final Cross-Scene Verification and Visual QA

**Files:**
- Modify if needed after QA: `src/app/globals.css`
- Modify if needed after QA: shared surface files touched in earlier tasks

**Step 1: Run the full automated verification**

Run:
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Expected:
- lint PASS
- test PASS
- build PASS

**Step 2: Run visual QA in browser**

Verify:
- `/settings` in `Models`, `MCP`, `Theme`, `About`
- empty chat workspace
- conversation with assistant/user/tool/reasoning blocks
- dark mode
- low/reduced motion behavior where applicable

**Step 3: Apply only the minimal fixes discovered in QA**

Touch only the files required by the QA findings.

**Step 4: Re-run automated verification**

Run:
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Expected: all PASS

**Step 5: Commit**

```bash
git add src/app/globals.css src/components
git commit -m "feat: finalize liquid glass app unification"
```
