import { describe, expect, it } from "vitest";

describe("changelog tools", () => {
  it("fails when non-changelog files change without a changelog update", async () => {
    const { evaluateChangelogRequirement } = await import(
      "../../../scripts/changelog-tools.mjs"
    );

    expect(
      evaluateChangelogRequirement([
        "README.md",
        "src/app/page.tsx",
      ]),
    ).toMatchObject({
      ok: false,
      hasChangelogUpdate: false,
      requiresChangelogUpdate: true,
    });
  });

  it("passes when CHANGELOG.md is updated alongside other files", async () => {
    const { evaluateChangelogRequirement } = await import(
      "../../../scripts/changelog-tools.mjs"
    );

    expect(
      evaluateChangelogRequirement([
        "CHANGELOG.md",
        "scripts/version-manager.mjs",
      ]),
    ).toMatchObject({
      ok: true,
      hasChangelogUpdate: true,
      requiresChangelogUpdate: true,
    });
  });

  it("parses git porcelain output including renames and untracked files", async () => {
    const { parseGitStatusPaths } = await import(
      "../../../scripts/changelog-tools.mjs"
    );

    expect(
      parseGitStatusPaths(` M README.md
R  docs/old.md -> docs/new.md
?? CHANGELOG.md
`),
    ).toEqual(["README.md", "docs/new.md", "CHANGELOG.md"]);
  });
});
