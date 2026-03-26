# Liquid Glass Unification Phase 3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish the remaining cross-scene Apple-native polish by unifying global chrome, sidebars, empty states, and shared dark/motion material behavior.

**Architecture:** Treat the rail, thread list, settings navigation, and shared material CSS as one global shell system rather than separate feature surfaces. First tighten structural rhythm and semantics in the sidebars, then tune the shared material behavior for dark mode, reduced motion, and disabled/empty states, and finally verify the entire scene set together.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind utilities, Framer Motion, Vitest, Testing Library

---

## Execution Board

- `Done`: Task 1 global navigation chrome unification
  - rail, thread sidebar, and settings sidebar now share a calmer docked shell rhythm
  - settings navigation now exposes grouped tab semantics and stronger selection continuity
  - thread sidebar now keeps a structured toolbar and no-thread empty state
- `Done`: Task 2 shared material and empty-state polish
  - search surfaces and sidebar empty states now use the same material family
  - dark-mode hover/focus behavior was tightened for rail buttons, thread rows, and quick actions
- `Done`: Task 3 verification
  - targeted sidebar/settings/stage suites passed
  - full `pnpm test`, `pnpm lint`, and `pnpm build` passed

---

### Task 1: Unify Rail, Threads Sidebar, and Settings Sidebar Chrome

**Files:**
- Modify: `src/components/layout/rail.tsx`
- Modify: `src/components/layout/threads-sidebar.tsx`
- Modify: `src/components/layout/__tests__/threads-sidebar.test.tsx`
- Modify: `src/components/settings/settings-sidebar.tsx`
- Modify: `src/components/settings/settings-sidebar.test.tsx`
- Modify: `src/components/settings/settings-container.tsx`

**Step 1: Write the failing tests**

Extend the sidebar-focused tests so they verify:
- the thread sidebar exposes a dedicated toolbar/header surface and an explicit empty-state surface for no threads
- the settings sidebar exposes a proper grouped navigation semantics layer for the current section
- the outer settings scene still keeps the chrome/content split after the sidebar rhythm changes

**Step 2: Run the focused tests to verify they fail**

Run:
- `pnpm test src/components/layout/__tests__/threads-sidebar.test.tsx`
- `pnpm test src/components/settings/settings-sidebar.test.tsx`
- `pnpm test src/components/settings/settings-container.test.tsx`

Expected: FAIL on the new shell/semantics assertions.

**Step 3: Implement the minimal chrome unification**

Update the global shell surfaces:
- `src/components/layout/rail.tsx`
  - group primary and utility controls into calmer docked capsules
  - make the rail feel like part of the same desktop chrome family as the titlebar and settings shell
- `src/components/layout/threads-sidebar.tsx`
  - give the header/search/new-thread area a more intentional toolbar rhythm
  - add an explicit no-threads empty state instead of leaving the content area visually blank
  - keep active-thread and context-menu behavior intact
- `src/components/settings/settings-sidebar.tsx`
  - tighten the navigation and overview cards into one preferences-side rail rhythm
  - expose stronger navigation semantics and selection continuity
- `src/components/settings/settings-container.tsx`
  - rebalance shell spacing/divider treatment so the sidebar and content frame feel like one scene

**Step 4: Verify the focused tests**

Run:
- `pnpm test src/components/layout/__tests__/threads-sidebar.test.tsx`
- `pnpm test src/components/settings/settings-sidebar.test.tsx`
- `pnpm test src/components/settings/settings-container.test.tsx`

Expected: PASS

**Step 5: Verify the adjacent settings/chat shells**

Run:
- `pnpm test src/components/layout/__tests__/stage.test.tsx`
- `pnpm test src/components/settings`

Expected: PASS

---

### Task 2: Tune Shared Material Behavior for Dark Mode, Motion, and Empty States

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/nav-item.tsx`
- Modify: `src/components/ui/search-input.tsx`
- Modify: `src/components/layout/threads-sidebar.tsx`
- Modify if needed: `src/components/settings/settings-container.tsx`

**Step 1: Write the failing tests**

Add focused assertions that verify:
- navigation items and search surfaces keep the expected semantic hooks after shared-style tuning
- the thread sidebar empty state remains visible and structurally nested under the same shell

**Step 2: Run the focused tests to verify they fail**

Run:
- `pnpm test src/components/layout/__tests__/threads-sidebar.test.tsx`
- `pnpm test src/components/settings/settings-sidebar.test.tsx`

Expected: FAIL on the new empty-state/material assertions.

**Step 3: Implement the minimal material polish**

Update the shared layer:
- `src/app/globals.css`
  - tune global hover, focus, and dark-mode response for rail buttons, thread rows, and settings shell chrome
  - keep reduced-motion behavior restrained and avoid flashy effects
- `src/components/ui/nav-item.tsx`
  - let navigation items accept stronger semantic attributes without duplicating styling logic
- `src/components/ui/search-input.tsx`
  - slightly refine inset search-field rhythm so sidebars feel more native and less form-like
- `src/components/layout/threads-sidebar.tsx`
  - add the final empty-state presentation and keep search/no-results states coherent with the shared material system

**Step 4: Verify the focused tests**

Run:
- `pnpm test src/components/layout/__tests__/threads-sidebar.test.tsx`
- `pnpm test src/components/settings/settings-sidebar.test.tsx`

Expected: PASS

**Step 5: Verify broad UI coverage**

Run:
- `pnpm test src/components/layout`
- `pnpm test src/components/settings`

Expected: PASS

---

### Task 3: Cross-Scene Verification

**Files:**
- Modify only if QA reveals a concrete regression: `src/app/globals.css`, shared shell files, or sidebar files touched above

**Step 1: Run the full automated verification**

Run:
- `pnpm test`
- `pnpm lint`
- `pnpm build`

Expected: PASS

**Step 2: Run visual QA**

Check:
- `/` main workspace with no threads and with selected thread state
- `/settings` navigation rhythm and section switching
- dark mode
- low/reduced motion

**Step 3: Apply only minimal fixes from QA**

Touch only the files required by real findings.

**Step 4: Re-run the final gate**

Run:
- `pnpm test`
- `pnpm lint`
- `pnpm build`

Expected: PASS
