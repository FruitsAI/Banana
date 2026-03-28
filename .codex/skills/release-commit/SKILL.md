---
name: release-commit
description: Use when preparing a release-oriented commit, updating CHANGELOG.md, aligning versions and tags, or checking GitHub-ready release metadata for this Banana repository
---

# Release Commit

Use this skill when Banana needs a disciplined release-facing commit: changelog updated, version metadata aligned, validation run, and release or tag steps prepared without guesswork.

For Banana, this skill assumes:
- `CHANGELOG.md` follows Keep a Changelog structure
- each changelog bullet is bilingual (`EN + 中文`)
- `package.json` is the single editable version source
- GitHub releases are unsigned draft releases

Load [references/banana-release-checklist.md](references/banana-release-checklist.md) when you need the Banana-specific checklist, release cautions, or example changelog patterns.

## Workflow

### 1. Gather the release state

Inspect:
- `CHANGELOG.md`
- `package.json`
- `README.md`
- `CONTRIBUTING.md`
- `RELEASE.md`
- release/version scripts such as `scripts/version-manager.mjs` and `scripts/release-tag.mjs`

Confirm whether the user is asking for:
- a normal commit with changelog maintenance
- a version bump
- a release tag
- a full GitHub release preparation pass

If the request is release-facing and the user does not specify the bump level, default to a `patch` bump via `pnpm release:prepare`.

### 2. Update the changelog first

Keep `CHANGELOG.md` compatible with Keep a Changelog:
- preserve `## [Unreleased]`
- use standard section names: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
- write concise bilingual bullets on one line
- record user-facing impact or engineering impact, not raw commit logs

If cutting a release:
- move ready items from `Unreleased` into `## [x.y.z] - YYYY-MM-DD`
- refresh the compare links at the bottom
- make sure the version in the changelog matches the intended release version exactly

### 3. Align version metadata

For Banana:
- edit version via `package.json` only
- prefer `pnpm release:prepare` for the default release path; it runs changelog validation, bumps `patch` by default, checks version metadata, and prints the next tag
- use `pnpm release:prepare minor`, `pnpm release:prepare major`, or `pnpm release:prepare 0.2.0` when the release needs a non-patch target
- use `pnpm version:patch`, `pnpm version:minor`, `pnpm version:major`, or `pnpm version:set -- <x.y.z>`
- run `pnpm version:check`
- confirm `pnpm release:tag:print` matches the changelog version

Do not create or push a tag until changelog text and version metadata agree.

### 4. Verify before claiming completion

Run the smallest truthful set of checks needed, usually:

```bash
pnpm changelog:check
pnpm version:check
pnpm check:repo
```

If packaging or release metadata changed, also consider:

```bash
pnpm desktop:build:debug
pnpm release:tag:print
```

### 5. Prepare the final commit or release handoff

In the final response or commit summary:
- state the changelog/version/tag status plainly
- call out any unsigned-distribution caveats
- mention anything intentionally not done, such as signing, notarization, or tag push

## Common Mistakes

- Forgetting to update `CHANGELOG.md` for docs, config, CI, or tooling commits
- Dumping commit messages into the changelog instead of curating the change summary
- Letting `CHANGELOG.md`, `package.json.version`, and Git tag drift apart
- Running a release-facing commit flow without a version bump when a new release version is expected
- Hiding breaking changes inside vague `Changed` bullets
- Pushing a release tag before verifying the GitHub draft release inputs
