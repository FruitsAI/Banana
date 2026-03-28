import { describe, expect, it } from "vitest";

describe("release tag tools", () => {
  it("derives the git tag name and annotation from the package version", async () => {
    const { buildReleaseTagPlan } = await import("../../../scripts/release-tools.mjs");

    expect(buildReleaseTagPlan({ version: "0.4.2", existingTags: [] })).toEqual({
      tagName: "v0.4.2",
      tagMessage: "Release v0.4.2",
    });
  });

  it("rejects creating a tag when the version tag already exists", async () => {
    const { buildReleaseTagPlan } = await import("../../../scripts/release-tools.mjs");

    expect(() =>
      buildReleaseTagPlan({
        version: "0.4.2",
        existingTags: ["v0.4.2"],
      }),
    ).toThrow("Git tag already exists: v0.4.2");
  });

  it("accepts a release trigger when the requested release version matches the project version", async () => {
    const { assertReleaseVersionMatchesProjectVersion } = await import(
      "../../../scripts/release-tools.mjs"
    );

    expect(() =>
      assertReleaseVersionMatchesProjectVersion({
        expectedVersion: "0.4.2",
        projectVersion: "0.4.2",
      }),
    ).not.toThrow();
  });

  it("rejects a release trigger when the requested release version drifts from the project version", async () => {
    const { assertReleaseVersionMatchesProjectVersion } = await import(
      "../../../scripts/release-tools.mjs"
    );

    expect(() =>
      assertReleaseVersionMatchesProjectVersion({
        expectedVersion: "0.4.3",
        projectVersion: "0.4.2",
      }),
    ).toThrow("Release version mismatch");
  });
});
