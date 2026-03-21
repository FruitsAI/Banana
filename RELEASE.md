# Banana Release Guide

## Scope
This repository currently supports GitHub-hosted, unsigned desktop releases only.

- macOS artifacts are not notarized.
- Windows artifacts are not code signed.
- No Tauri updater pipeline is configured.

## Release triggers
You have two supported release paths:

1. Run `pnpm release:tag:push`
2. Manually run the `Release` workflow from GitHub Actions

Both paths create or update a GitHub Release draft named `Banana v<version>`.

## Before cutting a release
Run locally:

```bash
pnpm changelog:check
pnpm version:check
pnpm lint
pnpm test
pnpm build
pnpm check:rust
pnpm desktop:build:debug
```

## Version source of truth
- Edit version through `package.json` only.
- Preferred commands:
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
- Keep wording specific enough that someone scanning the GitHub Release draft can understand impact quickly.
- Leave the GitHub Release as a draft until artifact names, changelog text, and version numbers are all reviewed together.

## Expected workflow outputs
The GitHub `Release` workflow builds unsigned Tauri bundles for:
- macOS Apple Silicon
- macOS Intel
- Windows
- Linux

Artifacts are attached to the GitHub Release draft for manual review and download.

## Non-goals
The following are intentionally out of scope for the current setup:
- Apple signing and notarization
- Windows Authenticode signing
- auto-update manifests and signing keys
- App Store / Microsoft Store / Linux store publishing
