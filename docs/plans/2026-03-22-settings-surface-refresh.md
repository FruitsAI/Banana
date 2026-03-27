I'm using the writing-plans skill to create the implementation plan.

# Settings Surfaces Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the remaining settings-local component surfaces with the new liquid-glass system so their layering, borders, chips, and interactions feel cohesive with the updated toast/dialog/popover language.

**Architecture:** Surface styling lives in the shared settings sections; we will update the provider sidebar, connection section, and model groups panel to match new layering rules, while polishing the reusable selection card and collapsible panel components they rely on.

**Tech Stack:** React, Tailwind-like utility classes, Vitest + Testing Library.

---

### Task 1: Provider Surface Refinement

**Files:**
- Modify: `src/components/settings/sections/models-setting/provider-sidebar.tsx`
- Modify: `src/components/settings/sections/models-setting/provider-connection-section.tsx`
- Modify: `src/components/settings/sections/models-setting/model-groups-panel.tsx`
- Test: `src/components/settings/sections/models-setting/_provider-surfaces.test.tsx` (new)

**Step 1: Write the failing test**
```tsx
it("matches the liquid-glass surface tokens", () => {
  const utils = render(<ProviderSidebar ... />);
  expect(utils.getByText("Providers")).toHaveClass("new-focus-border");
});
```
**Step 2: Run test to verify it fails**
Run: `pnpm vitest src/components/settings/sections/models-setting/_provider-surfaces.test.tsx -t "matches the liquid-glass surface tokens"`
Expected: FAIL because the component still uses the old class names.
**Step 3: Write minimal implementation**
Update each file to apply the new layering tokens (e.g., gradient/backdrop classes, refined borders, button chips, focus states) while keeping existing behavior intact.
**Step 4: Run test to verify it passes**
Run: `pnpm vitest src/components/settings/sections/models-setting/_provider-surfaces.test.tsx -t "matches the liquid-glass surface tokens"`
Expected: PASS
**Step 5: Commit**
```bash
git add src/components/settings/sections/models-setting/provider-sidebar.tsx \
  src/components/settings/sections/models-setting/provider-connection-section.tsx \
  src/components/settings/sections/models-setting/model-groups-panel.tsx \
  src/components/settings/sections/models-setting/_provider-surfaces.test.tsx
git commit -m "feat: refresh provider surfaces"
```

### Task 2: Selection Card & Collapsible Panel Polishing

**Files:**
- Modify: `src/components/ui/selection-card.tsx`
- Modify: `src/components/ui/collapsible-panel.tsx`
- Test: `src/components/ui/__tests__/selection-card.test.tsx` (expand) and reuse existing collapsible tests for hover/focus checks

**Step 1: Write the failing test**
```tsx
it("applies toast-like focus ring", () => {
  render(<SelectionCard ... />);
  expect(screen.getByRole("button")).toHaveClass("new-focus-ring");
});
```
**Step 2: Run test to verify it fails**
Run: `pnpm vitest src/components/ui/__tests__/selection-card.test.tsx -t "applies toast-like focus ring"`
Expected: FAIL because current classes are still the old chips/borders.
**Step 3: Write minimal implementation**
Update `SelectionCard` and `CollapsiblePanel` to share the new surface tokens (layer, border, chip pill, hover brightness, focus ring). Keep the existing API.
**Step 4: Run test to verify it passes**
Run: `pnpm vitest src/components/ui/__tests__/selection-card.test.tsx -t "applies toast-like focus ring"`
Expected: PASS
**Step 5: Commit**
```bash
git add src/components/ui/selection-card.tsx \
  src/components/ui/collapsible-panel.tsx \
  src/components/ui/__tests__/selection-card.test.tsx
git commit -m "feat: polish settings ui surfaces"
```

---

Plan complete and saved to `docs/plans/2026-03-22-settings-surface-refresh.md`. Two execution options:

1. Subagent-Driven (this session) - I handle each tasks in turn with fresh subagents and checkpoints. **REQUIRED SUB-SKILL:** superpowers:subagent-driven-development.
2. Parallel Session (separate) - Spin up a new session/worktree running superpowers:executing-plans for the full plan.

Which approach would you like to take?
