# Liquid Glass Runtime Phase 4 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the missing runtime behavior layer so Banana's liquid-glass UI reacts to pointer, scroll, and focus with adaptive clarity, optical highlights, and press feedback instead of staying as static frosted cards.

**Architecture:** Treat runtime liquid-glass as a shared system layered under the existing material tokens. First add a pure runtime model that turns viewport, pointer, and clarity intent into per-surface optical values. Then mount one global provider in the app shell to project those values into CSS variables for every tracked material surface. Finally, opt the shared primitives and key overlays into the runtime so dialogs, popovers, fields, buttons, and selects all inherit the same behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind utilities, Framer Motion, Vitest, Testing Library

---

## Execution Board

- `Todo`: Task 1 runtime optics model and provider
- `Todo`: Task 2 shared primitives and overlay integration
- `Todo`: Task 3 verification and QA sweep

---

### Task 1: Add the Runtime Optics Model and Global Provider

**Files:**
- Create: `src/lib/liquid-glass-runtime.ts`
- Create: `src/lib/__tests__/liquid-glass-runtime.test.ts`
- Create: `src/components/liquid-glass-runtime-provider.tsx`
- Create: `src/components/liquid-glass-runtime-provider.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/ui/material-surface.ts`

**Step 1: Write the failing tests**

Add focused tests that verify:
- a high-clarity surface resolves stronger blur, brightness, and contrast support than a standard surface
- pointer movement changes surface highlight coordinates and ambient energy
- the global runtime provider projects computed CSS variables onto tracked material surfaces

**Step 2: Run the focused tests to verify they fail**

Run:
- `pnpm test src/lib/__tests__/liquid-glass-runtime.test.ts`
- `pnpm test src/components/liquid-glass-runtime-provider.test.tsx`

Expected: FAIL because the runtime model and provider do not exist yet.

**Step 3: Write the minimal runtime implementation**

Implement:
- `src/lib/liquid-glass-runtime.ts`
  - pure helpers that convert viewport geometry, pointer state, scroll activity, and clarity intent into CSS-ready optical values
- `src/components/liquid-glass-runtime-provider.tsx`
  - one shared client runtime that listens to pointer, scroll, resize, and reduced-motion context
  - updates root ambient variables and per-surface CSS variables without changing component APIs
- `src/components/ui/material-surface.ts`
  - make material surfaces consume CSS variable fallbacks for background, border, shadow, and backdrop filter so runtime overrides can land centrally
- `src/app/layout.tsx`
  - mount the runtime provider inside the existing animation/theme shell

**Step 4: Verify the focused tests**

Run:
- `pnpm test src/lib/__tests__/liquid-glass-runtime.test.ts`
- `pnpm test src/components/liquid-glass-runtime-provider.test.tsx`

Expected: PASS

---

### Task 2: Opt Shared Primitives and Overlays Into the Runtime Material System

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/popover.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/feedback/toast-layer.tsx`
- Modify: `src/components/ui/__tests__/material-primitives.test.tsx`
- Modify: `src/components/ui/__tests__/overlay-primitives.test.tsx`

**Step 1: Write the failing tests**

Extend the primitive and overlay tests so they verify:
- shared glass controls expose explicit runtime hooks for liquid interaction where needed
- overlays stay in the high-clarity family and expose the same runtime surface semantics
- the shared material primitives still preserve their existing semantic hooks after the runtime integration

**Step 2: Run the focused tests to verify they fail**

Run:
- `pnpm test src/components/ui/__tests__/material-primitives.test.tsx`
- `pnpm test src/components/ui/__tests__/overlay-primitives.test.tsx`

Expected: FAIL on the new runtime-hook assertions.

**Step 3: Implement the minimal primitive integration**

Update the shared layer:
- `src/app/globals.css`
  - add the CSS-variable-driven liquid highlight, ambient sheen, press ripple, and clarity transitions
  - keep reduced-motion behavior restrained and compositor-friendly
- `src/components/ui/button.tsx`
  - opt glass buttons into liquid press feedback
- `src/components/ui/input.tsx`
  - let the field shell participate in runtime highlight and clarity tuning
- `src/components/ui/select.tsx`
  - give the trigger and options the same interactive liquid feedback
- `src/components/ui/popover.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/feedback/toast-layer.tsx`
  - replace hardcoded surface backgrounds with runtime-aware layered fills while keeping their visual identity

**Step 4: Verify the focused tests**

Run:
- `pnpm test src/components/ui/__tests__/material-primitives.test.tsx`
- `pnpm test src/components/ui/__tests__/overlay-primitives.test.tsx`

Expected: PASS

**Step 5: Verify adjacent behavior**

Run:
- `pnpm test src/components/ui`
- `pnpm test src/components/feedback/toast-layer.test.tsx`
- `pnpm test src/components/providers/__tests__/add-provider-dialog.test.tsx`

Expected: PASS

---

### Task 3: Final Verification and QA-Oriented Tuning

**Files:**
- Modify: `CHANGELOG.md`
- Modify only if verification finds a real regression: shared runtime, primitive, or overlay files touched above

**Step 1: Run the repo checks most likely to catch regressions**

Run:
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Expected: PASS

**Step 2: Apply only minimal fixes from QA findings**

Check:
- main workspace shell
- `/settings`
- dialogs, popovers, top toasts, and custom select
- reduced motion behavior

Touch only the files required by actual findings.

**Step 3: Update the changelog**

Add a short entry summarizing the runtime liquid-glass upgrade.

**Step 4: Re-run the final gate**

Run:
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Expected: PASS
