# Banana Release Guide

## Scope
This repository ships GitHub-hosted desktop releases, with macOS stable releases wired into the Tauri updater flow.

- macOS stable releases generate updater metadata and signatures for in-app update checks.
- macOS artifacts are still not notarized.
- Windows artifacts are still not code signed.
- Windows / Linux do not use in-app installation in this phase.

## Release triggers
You have two supported release paths:

1. Run `pnpm release:tag:push`
2. Manually run the `Release` workflow from GitHub Actions

Both paths publish a stable GitHub Release named `Banana v<version>`.

## Before cutting a release
Run locally:

```bash
pnpm release:prepare
pnpm lint
pnpm test
pnpm build
pnpm check:rust
pnpm desktop:build:debug
```

GitHub Actions release secrets required for macOS updater builds:

```text
BANANA_UPDATER_PUBLIC_KEY
TAURI_SIGNING_PRIVATE_KEY
TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

Without those values, local development builds still run, but in-app update checks should clearly report that the updater channel is not configured.

## Version source of truth
- Edit version through `package.json` only.
- Preferred release preparation commands:
  - `pnpm release:prepare` (defaults to a patch bump)
  - `pnpm release:prepare minor`
  - `pnpm release:prepare major`
  - `pnpm release:prepare 0.2.0`
- Lower-level version commands:
  - `pnpm version:patch`
  - `pnpm version:minor`
  - `pnpm version:major`
  - `pnpm version:set -- 0.2.0`
- Tag commands:
  - `pnpm release:tag:print`
  - `pnpm release:tag`
  - `pnpm release:tag:push`
- `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock` are synchronized automatically by the version manager.
- Keep the release tag aligned with `package.json.version`, for example `v0.2.0`.

## Changelog expectations
- Keep [`CHANGELOG.md`](CHANGELOG.md) in Keep a Changelog format, with standard English section names and bilingual bullet entries.
- Maintain `## [Unreleased]` during normal development.
- Before creating a release tag, move release-ready items from `Unreleased` into `## [x.y.z] - YYYY-MM-DD`.
- Keep the changelog version, `package.json.version`, and Git tag identical.
- Refresh the compare links at the bottom of `CHANGELOG.md` when a new version section is added.

## Release note quality bar
- Summarize user-visible and engineering-relevant changes, not a raw commit dump.
- Call out breaking changes, packaging caveats, and migration notes explicitly.
- Keep wording specific enough that someone scanning the GitHub Release page can understand impact quickly.
- Confirm the published stable release has the expected updater assets before announcing it as the latest downloadable version.

## Expected workflow outputs
The GitHub `Release` workflow builds Tauri bundles for:
- macOS Apple Silicon
- macOS Intel
- Windows
- Linux

Additionally, the macOS release assets include updater metadata/signatures so the app can read:

```text
https://github.com/FruitsAI/Banana/releases/latest/download/latest.json
```

The in-app updater only discovers published stable releases through that endpoint.

## Non-goals
The following are intentionally out of scope for the current setup:
- Apple signing and notarization
- Windows Authenticode signing
- App Store / Microsoft Store / Linux store publishing
