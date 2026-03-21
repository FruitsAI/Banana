# Banana Version Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `package.json` the single editable version source and keep Tauri/Rust metadata aligned automatically.

**Architecture:** Add a small Node-based version manager under `scripts/` that reads `package.json`, synchronizes `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock`, and exposes `check`, `sync`, `set`, and `bump` commands through `package.json` scripts. CI will call the version check before the usual lint/build pipeline so drift is caught immediately.

**Tech Stack:** Node.js, pnpm scripts, Vitest, GitHub Actions, Tauri/Rust metadata files

---

### Task 1: Lock the desired behavior with tests

**Files:**
- Create: `src/lib/__tests__/version-tools.test.ts`

**Step 1: Write the failing test**
- Add tests for semver bumping and metadata synchronization.

**Step 2: Run test to verify it fails**
- Run: `pnpm exec vitest run src/lib/__tests__/version-tools.test.ts`
- Expected: FAIL because `scripts/version-tools.mjs` does not exist yet.

### Task 2: Implement reusable version helpers

**Files:**
- Create: `scripts/version-tools.mjs`
- Create: `scripts/version-manager.mjs`

**Step 1: Write minimal implementation**
- Export pure helpers for bumping semver and synchronizing `Cargo.toml` / `Cargo.lock`.
- Add CLI commands: `check`, `sync`, `set`, `bump`.

**Step 2: Run targeted test**
- Run: `pnpm exec vitest run src/lib/__tests__/version-tools.test.ts`
- Expected: PASS.

### Task 3: Wire the scripts into repo workflows

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `RELEASE.md`
- Modify: `CONTRIBUTING.md`

**Step 1: Add package scripts**
- Add `version:check`, `version:sync`, `version:set`, `version:patch`, `version:minor`, `version:major`.
- Make `check:repo` run `version:check` first.

**Step 2: Add CI enforcement**
- Run the version consistency check in CI before the rest of the validation pipeline.

**Step 3: Document the workflow**
- Explain the one-source-of-truth model and the exact release commands in docs.

### Task 4: Verify end-to-end

**Files:**
- Modify if needed: any files above

**Step 1: Run focused verification**
- Run: `pnpm exec vitest run src/lib/__tests__/version-tools.test.ts`
- Run: `pnpm version:check`

**Step 2: Run repo verification**
- Run: `pnpm check:repo`

**Step 3: Report remaining limits**
- Explicitly note that Tauri still reads from `package.json` and that Git tags should match the package version.
