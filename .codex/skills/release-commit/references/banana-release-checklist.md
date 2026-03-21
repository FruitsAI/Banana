# Banana Release Checklist

## External references

- Keep a Changelog official guide: <https://keepachangelog.com/en/1.0.0/>
- `release-it` Keep a Changelog plugin: <https://github.com/release-it/keep-a-changelog>
- GitHub Docs, managing repository releases: <https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository>

## Banana repository rules

- Every repository commit should update `CHANGELOG.md` unless the changelog itself is the only changed file.
- Keep changelog section headings in English for compatibility.
- Write each bullet as concise English plus concise Chinese.
- Keep `package.json` as the single editable version source.
- Keep `CHANGELOG.md`, `package.json.version`, and Git tag names aligned.
- GitHub releases stay unsigned and should remain drafts until reviewed.

## Commit-time checklist

1. Update `CHANGELOG.md`.
2. Keep entries under the right section in `Unreleased`.
3. Avoid raw commit-log dumps, `misc fixes`, or hidden breaking changes.
4. Run `pnpm changelog:check`.
5. Run `pnpm version:check` if release metadata or version data changed.
6. Run `pnpm check:repo` before claiming the release-facing commit is ready.

## Release-time checklist

1. Move release-ready notes from `Unreleased` to `## [x.y.z] - YYYY-MM-DD`.
2. Refresh compare links at the bottom of `CHANGELOG.md`.
3. Bump version with `pnpm version:patch|minor|major` or `pnpm version:set -- <x.y.z>`.
4. Run `pnpm version:check`.
5. Run `pnpm release:tag:print` and confirm the tag equals `v<x.y.z>`.
6. Run `pnpm check:repo`.
7. Create the local tag with `pnpm release:tag`.
8. Push the tag with `pnpm release:tag:push` only when the GitHub draft release is meant to be triggered.

## Bilingual changelog pattern

```md
## [Unreleased]

### Added
- Add unified release validation for changelog and version metadata. 新增针对 changelog 与版本元数据的统一发版校验。

### Changed
- Clarify GitHub-only unsigned release flow in repository docs. 在仓库文档中明确仅面向 GitHub 的 unsigned 发版流程。
```

## What to watch for

- If a change affects packaging, naming, update channels, or distribution constraints, mention that explicitly in the changelog.
- If a change is mostly internal, still record the engineering impact in one concise line.
- If a release includes a breaking change, call it out directly instead of hiding it inside a generic section.
- Draft GitHub releases before review are safer than publishing immediately.
