# Liquid Glass App Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Banana's frontend into a cohesive Apple-grade desktop app that genuinely follows the latest liquid-glass design language through material hierarchy, restrained color, physically believable motion, and content-first composition.

**Architecture:** Introduce a shared material and motion system first, then refactor the shell, chat stage, settings flows, and overlay surfaces onto that system. Default surfaces should become context-aware and content-driven, while emphasis states rely on depth, refraction, and motion before color.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion 12, Radix UI, Tauri desktop shell.

---

## North Star

As of **March 21, 2026**, Apple's latest interface direction is still the liquid-glass system introduced at **WWDC 2025**. The important takeaway is not "more blur" or "more gradient"; it is a material system where controls feel optically alive, adapt to content behind them, use color sparingly, and move with convincing continuity.

For Banana, that translates into five design rules:

1. **Material before decoration**
   Surfaces should feel like layered optical material, not frosted rectangles with rainbow borders.
2. **Content stays primary**
   Chrome supports content instead of competing with it. Background atmosphere should never overpower chat content or settings forms.
3. **Color is reserved for meaning**
   Accent color should signal focus, selection, send, status, or model state, not outline every component.
4. **Geometry is concentric**
   Outer shells, inner controls, buttons, chips, and tooltips should share a rational corner system so nested surfaces feel designed as one family.
5. **Motion explains state**
   Hover, focus, expansion, selection, and streaming should all read as material response, not decorative animation.

## Current Gaps In The Existing UI

### 1. The material system is visually loud but structurally flat

- [`src/app/globals.css`](/Users/willxue/will/FruitsAI/Banana/src/app/globals.css#L139) currently defines one dominant glass recipe plus a strong iridescent border treatment.
- [`src/components/ui/button.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/ui/button.tsx#L61) and [`src/components/ui/search-input.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/ui/search-input.tsx#L23) reuse that same recipe across controls that should feel materially different.
- Result: everything looks equally "special", so nothing feels truly premium.

### 2. Navigation chrome and content surfaces sit on nearly the same depth plane

- [`src/components/layout/rail.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/layout/rail.tsx#L104) and [`src/components/layout/threads-sidebar.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/layout/threads-sidebar.tsx#L247) both use strong blur, borders, and shadows with similar visual weight.
- The shell reads as three adjacent translucent panels instead of one coherent window with a hierarchy of chrome, content, and floating controls.

### 3. The home stage is centered and decorative instead of content-led

- [`src/components/layout/stage.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/layout/stage.tsx#L277) centers the empty state and keeps the composer as a large card pinned below it.
- [`src/app/globals.css`](/Users/willxue/will/FruitsAI/Banana/src/app/globals.css#L1727) adds a strong aurora treatment that is attractive but competes with the actual chat experience.
- Result: it feels like a landing page living inside an app shell, not a focused desktop productivity tool.

### 4. Message bubbles feel like generic chat cards, not adaptive surfaces

- [`src/components/layout/stage.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/layout/stage.tsx#L472) uses a similar bubble recipe for assistant content, tool cards, edit state, and hover tools.
- The current interaction model adds controls below bubbles, but the controls do not dock, morph, or inherit from the parent surface.

### 5. Settings falls back to a rigid form layout

- [`src/components/settings/settings-container.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/settings/settings-container.tsx#L21) and [`src/components/settings/settings-sidebar.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/settings/settings-sidebar.tsx#L30) create a functional split view, but the right pane becomes visually plain.
- [`src/components/settings/sections/about-setting.tsx`](/Users/willxue/will/FruitsAI/Banana/src/components/settings/sections/about-setting.tsx#L44) uses glass cards, but they do not feel connected to the rest of the shell.

### 6. Motion exists, but much of it is ornamental instead of material

- [`src/app/globals.css`](/Users/willxue/will/FruitsAI/Banana/src/app/globals.css#L1679) globally transitions many properties, while [`src/app/globals.css`](/Users/willxue/will/FruitsAI/Banana/src/app/globals.css#L1765) adds generalized hover glow behaviors.
- The running app is already warning about animating backgrounds, which is a sign that the motion system needs clearer constraints.

## Refactor Strategy

The redesign should happen in **three layers**:

1. **Foundation layer**
   Tokens, materials, geometry, motion, and reusable primitives.
2. **Shell layer**
   Titlebar, rail, sidebar, stage frame, settings frame, overlay frame.
3. **Experience layer**
   Chat empty state, message stream, composer, model picker, settings sections, dialogs, popovers, context menus.

The work should be done in that order. If we jump straight into page polish before fixing the foundation, the UI will keep drifting and every page will solve liquid glass differently.

## Visual Direction For Banana

### Overall feel

- More **macOS app** than **marketing landing page**
- More **restrained translucency** than **high-saturation glow**
- More **edge-to-edge content** than **boxed panels**
- More **quiet intelligence** than **neon futurism**

### Material stack

Adopt four explicit material levels:

- `chrome/base`
  Window rails, sidebars, title regions. Slightly denser and less glossy.
- `surface/content`
  Message areas, settings groups, tool result containers. Transparent enough to breathe, dense enough to read.
- `surface/floating`
  Composer, popovers, dialogs, context menus, hover action docks. Highest clarity and strongest optical edge.
- `accent/interactive`
  Send affordances, selected items, focused controls, online status, active model badges.

### Color policy

- Keep the default interface largely monochrome and warm-neutral in light mode.
- In dark mode, avoid flat black slabs; use soft charcoal and deep blue-black separation between planes.
- Preserve blue as the system accent, but use it for focus and active states only.
- Remove rainbow borders from default surfaces. Iridescence should become a rare highlight reserved for hero moments or active floating controls.

### Motion policy

- Hover: short lift + subtle highlight travel, no big glow bloom.
- Focus: edge brightening + tiny depth increase.
- Selection: shared-layout movement, not instant recolor.
- Expand/collapse: spring-based height and opacity continuity.
- Streaming: progress shimmer should stay localized and understated.
- Theme switch: material tint migration, not full-page flash.

## Implementation Plan

### Task 1: Build a real material taxonomy

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/glass-card.tsx`
- Modify: `src/components/ui/glass-panel.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/search-input.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/popover.tsx`
- Test: `src/components/ui/__tests__/material-primitives.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- surfaces expose consistent depth roles through props or data attributes
- default controls do not render iridescent edges unless explicitly requested
- reduced-motion mode disables continuous shimmer and border travel

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/ui/__tests__/material-primitives.test.tsx`

Expected: FAIL because the current primitives do not expose role-driven material variants.

**Step 3: Write minimal implementation**

- Replace the current one-size glass token block with role-based tokens:
  - `--material-chrome-*`
  - `--material-content-*`
  - `--material-floating-*`
  - `--material-accent-*`
- Add a concentric radius scale so nested surfaces always step down cleanly.
- Move iridescent treatment behind an explicit opt-in flag for hero and focus moments.
- Make buttons and fields consume semantic surface roles instead of directly mixing `glass-surface`, `glass-hover`, and accent borders inline.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/ui/__tests__/material-primitives.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/globals.css src/components/ui/glass-card.tsx src/components/ui/glass-panel.tsx src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/search-input.tsx src/components/ui/dialog.tsx src/components/ui/popover.tsx src/components/ui/__tests__/material-primitives.test.tsx
git commit -m "feat: establish liquid glass material taxonomy"
```

### Task 2: Refactor the window shell into layered chrome

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/titlebar.tsx`
- Modify: `src/components/layout/rail.tsx`
- Modify: `src/components/layout/threads-sidebar.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/layout/__tests__/threads-sidebar.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- the rail and sidebar expose distinct shell roles
- the active indicator uses shared layout movement rather than only recolor
- sidebar actions remain keyboard reachable after the refactor

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/layout/__tests__/threads-sidebar.test.tsx`

Expected: FAIL because the current shell does not distinguish chrome depth roles or active-shell semantics.

**Step 3: Write minimal implementation**

- Redesign the titlebar into a calmer top optical strip with subtle material separation.
- Turn the rail into a thinner floating control spine with quieter inactive states.
- Convert the thread list from a full panel into a denser browsing surface with grouped content rows, softer separators, and a cleaner selected state.
- Reduce the visual weight of borders and side shadows so the shell reads as one window rather than three slabs.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/layout/__tests__/threads-sidebar.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/layout/titlebar.tsx src/components/layout/rail.tsx src/components/layout/threads-sidebar.tsx src/app/globals.css src/components/layout/__tests__/threads-sidebar.test.tsx
git commit -m "feat: refactor shell chrome for liquid glass hierarchy"
```

### Task 3: Recompose the home stage around content-first chat

**Files:**
- Modify: `src/components/layout/stage.tsx`
- Modify: `src/components/ui/fluid-background.tsx`
- Modify: `src/components/models/model-selector.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/layout/__tests__/stage.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- the empty state and composer remain visible and ordered at common desktop widths
- the quick actions are secondary to the composer
- the composer keeps action controls reachable in reduced-motion mode

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/layout/__tests__/stage.test.tsx`

Expected: FAIL because the current layout is centered around the hero instead of the chat workflow.

**Step 3: Write minimal implementation**

- Reduce the background aurora and shift it toward edge lighting rather than center-stage color clouds.
- Move the empty-state copy and quick actions into a lighter onboarding layer that yields to the composer.
- Redesign the composer as a floating toolwell with a clearer top text region and lower utility row.
- Make the model selector and search/think toggles feel embedded in the composer surface, not placed inside it as separate unrelated controls.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/layout/__tests__/stage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/layout/stage.tsx src/components/ui/fluid-background.tsx src/components/models/model-selector.tsx src/app/globals.css src/components/layout/__tests__/stage.test.tsx
git commit -m "feat: redesign home stage for content-first liquid glass"
```

### Task 4: Redesign messages, thinking blocks, and tool surfaces

**Files:**
- Modify: `src/components/layout/stage.tsx`
- Create: `src/components/chat/message-surface.tsx`
- Create: `src/components/chat/message-toolbar.tsx`
- Create: `src/components/chat/tool-invocation-card.tsx`
- Test: `src/components/chat/__tests__/message-surface.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- assistant, user, reasoning, and tool surfaces each map to distinct variants
- hover toolbars remain anchored to the owning message
- message editing state upgrades the same surface rather than replacing it with a visually unrelated panel

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/chat/__tests__/message-surface.test.tsx`

Expected: FAIL because messages are still rendered inline in one large page component without reusable surface variants.

**Step 3: Write minimal implementation**

- Extract message surface primitives out of `stage.tsx`.
- Make assistant bubbles read as translucent content panes and user bubbles read as denser tinted replies.
- Dock copy/edit/regenerate actions to the message edge as a floating accessory bar that shares motion with the parent bubble.
- Redesign reasoning and tool cards as nested surfaces with lower contrast and tighter typography.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/chat/__tests__/message-surface.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/layout/stage.tsx src/components/chat/message-surface.tsx src/components/chat/message-toolbar.tsx src/components/chat/tool-invocation-card.tsx src/components/chat/__tests__/message-surface.test.tsx
git commit -m "feat: redesign chat surfaces and message accessories"
```

### Task 5: Rebuild settings as a native-feeling preferences experience

**Files:**
- Modify: `src/components/settings/settings-container.tsx`
- Modify: `src/components/settings/settings-sidebar.tsx`
- Modify: `src/components/settings/settings-content.tsx`
- Modify: `src/components/settings/sections/models-setting.tsx`
- Modify: `src/components/settings/sections/mcp-setting.tsx`
- Modify: `src/components/settings/sections/theme-setting.tsx`
- Modify: `src/components/settings/sections/about-setting.tsx`
- Create: `src/components/settings/settings-section-shell.tsx`
- Test: `src/components/settings/sections/about-setting.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- settings sections render inside a shared section shell
- navigation and content panes preserve focus order and scroll boundaries
- settings cards adopt the same surface roles as the main app

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/settings/sections/about-setting.test.tsx`

Expected: FAIL because settings sections currently compose bespoke surface treatments.

**Step 3: Write minimal implementation**

- Make the settings container feel like a native preferences scene rather than a generic split form.
- Give the left navigation a calmer chrome role and the right pane a grouped content role.
- Standardize section headers, inset groups, footnotes, destructive actions, and secondary actions.
- Bring About, Theme, Models, and MCP onto the same material grid and spacing scale.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/settings/sections/about-setting.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/settings/settings-container.tsx src/components/settings/settings-sidebar.tsx src/components/settings/settings-content.tsx src/components/settings/sections/models-setting.tsx src/components/settings/sections/mcp-setting.tsx src/components/settings/sections/theme-setting.tsx src/components/settings/sections/about-setting.tsx src/components/settings/settings-section-shell.tsx src/components/settings/sections/about-setting.test.tsx
git commit -m "feat: rebuild settings scene with unified liquid glass sections"
```

### Task 6: Replace decorative animation with material motion primitives

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/animation-intensity-provider.tsx`
- Modify: `src/lib/animation-intensity.ts`
- Create: `src/lib/motion-presets.ts`
- Test: `src/lib/__tests__/animation-intensity.test.ts`

**Step 1: Write the failing test**

Add tests that assert:

- reduced-motion mode disables continuous decorative loops
- motion presets return stable values for hover, focus, selection, and panel transitions
- high-intensity mode increases distance and duration within bounded ranges

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/animation-intensity.test.ts`

Expected: FAIL because the motion system currently mixes global CSS transitions, inline Framer values, and infinite effects without one shared contract.

**Step 3: Write minimal implementation**

- Replace blanket global transitions with scoped motion primitives.
- Remove or soften always-on shimmer, pulse, and glow loops unless they signal live state.
- Stop animating raw background strings where Framer Motion warns; prefer opacity, transform, filter, and CSS variable interpolation patterns that are cheaper and more predictable.
- Introduce shared spring presets for shell movement, control hover, panel reveal, and accessory docking.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/animation-intensity.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/globals.css src/components/animation-intensity-provider.tsx src/lib/animation-intensity.ts src/lib/motion-presets.ts src/lib/__tests__/animation-intensity.test.ts
git commit -m "feat: unify liquid glass motion primitives"
```

### Task 7: Overlay, popover, and detail polish pass

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/popover.tsx`
- Modify: `src/components/layout/threads-sidebar.tsx`
- Modify: `src/components/models/model-selector.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/models/__tests__/model-selector.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- floating surfaces use the high-clarity material role
- menus and popovers align with trigger geometry
- hover and open states preserve readable contrast in both themes

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/models/__tests__/model-selector.test.tsx`

Expected: FAIL because floating surfaces still inherit inconsistent background and border recipes.

**Step 3: Write minimal implementation**

- Redesign popovers, dialogs, model pickers, and context menus to feel like the same optical material family.
- Add subtle scale-and-focus continuity between trigger and floating panel.
- Improve corner harmony between trigger pills and floating containers.
- Ensure overlay blur and dimming feel like suspended depth, not a web modal.

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/models/__tests__/model-selector.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/popover.tsx src/components/layout/threads-sidebar.tsx src/components/models/model-selector.tsx src/app/globals.css src/components/models/__tests__/model-selector.test.tsx
git commit -m "feat: polish floating liquid glass surfaces"
```

### Task 8: Full verification and visual QA

**Files:**
- Modify: `docs/plans/2026-03-21-liquid-glass-app-refactor.md`

**Step 1: Run lint and tests**

Run: `pnpm lint`

Expected: PASS

Run: `pnpm test`

Expected: PASS

**Step 2: Run app-level verification**

Run:

```bash
pnpm dev
```

Then manually verify:

- home in light mode
- home in dark mode
- settings in light mode
- settings in dark mode
- hover, focus, open, selected, disabled, loading, and reduced-motion states
- narrow desktop width and wide desktop width

**Step 3: Capture before/after visual evidence**

- home empty state
- populated chat thread
- settings overview
- model selector popover
- context menu
- dialog

**Step 4: Update plan notes with any drift**

- record any components that still feel too web-like
- record any surfaces that remain too colorful or too flat
- record any motion that still feels ornamental

**Step 5: Commit**

```bash
git add docs/plans/2026-03-21-liquid-glass-app-refactor.md
git commit -m "docs: finalize liquid glass refactor verification notes"
```

## Acceptance Bar

The redesign is only done when all of the following are true:

- Light mode feels airy and quiet rather than creamy and washed out.
- Dark mode feels luminous and layered rather than flat black.
- The shell has an obvious depth hierarchy between rail, sidebar, main content, and floating controls.
- The composer feels like the primary tool surface of the app.
- Message accessories feel docked and intentional.
- Settings looks like the same product as chat.
- Accent blue appears as a meaningful signal, not a default highlight color.
- Reduced-motion mode still feels premium without losing hierarchy.
- No surface relies on rainbow borders to feel "advanced".
- The product reads as a polished desktop app first, a themed web UI second.

## Notes For Execution

- Favor subtraction over addition. The app needs less decorative chroma and fewer always-on effects.
- Keep the current information architecture unless a shell decision directly improves the native feel.
- When in doubt, make the content clearer and the chrome quieter.
- Preserve accessibility and keyboard behavior through every visual refactor.
