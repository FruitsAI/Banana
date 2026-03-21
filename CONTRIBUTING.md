# Contributing to Banana

## Environment
- Node.js `22.12.0`
- pnpm `10.30.3`
- Rust `1.93.1`
- Tauri 2 system dependencies for your platform

## First-time setup
```bash
corepack enable
pnpm install --frozen-lockfile
```

## Daily commands
```bash
pnpm dev
pnpm tauri dev
pnpm changelog:check
pnpm version:check
pnpm lint
pnpm test
pnpm build
pnpm check:rust
```

## Changelog policy
- Update [`CHANGELOG.md`](CHANGELOG.md) in every commit that changes repository contents beyond the changelog itself.
- Keep the overall structure compatible with Keep a Changelog, including `Unreleased` and the standard section names (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`).
- Write each changelog bullet bilingually in one line: concise English first, then concise Chinese.
- Do not paste raw git logs, vague notes like `misc fixes`, or hide breaking changes inside generic bullets.
- When preparing a release, move ready items from `Unreleased` into `## [x.y.z] - YYYY-MM-DD` and refresh the compare links at the bottom of the file.

## Version workflow
- `package.json` is the single editable version source.
- Use `pnpm version:patch`, `pnpm version:minor`, or `pnpm version:major` for normal bumps.
- Use `pnpm version:set -- <x.y.z>` when you need an exact version.
- Run `pnpm changelog:check` before opening a PR or tagging a release.
- Run `pnpm version:check` before opening a PR if you touched release metadata.
- Use `pnpm release:tag` to create the local annotated tag for the current version.
- Use `pnpm release:tag:push` only when you are ready to trigger the GitHub release workflow.

## Pull request expectations
- Keep unrelated local changes out of the PR.
- Run `pnpm changelog:check`, `pnpm version:check`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm check:rust` before opening or updating a PR.
- If you touch packaging or Tauri metadata, verify at least one local desktop build with `pnpm desktop:build:debug`.

## Release expectations
- Releases are built in GitHub Actions as unsigned artifacts.
- Do not add signing, notarization, or updater configuration unless the release strategy changes.
- Keep release notes aligned across `CHANGELOG.md`, `package.json.version`, and the Git tag.
- See [`RELEASE.md`](RELEASE.md) for the exact GitHub flow.
