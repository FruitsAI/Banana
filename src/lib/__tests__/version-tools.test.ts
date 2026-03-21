import { describe, expect, it } from "vitest";

describe("version tools", () => {
  it("bumps semantic versions by release type", async () => {
    const { bumpSemver } = await import("../../../scripts/version-tools.mjs");

    expect(bumpSemver("1.2.3", "patch")).toBe("1.2.4");
    expect(bumpSemver("1.2.3", "minor")).toBe("1.3.0");
    expect(bumpSemver("1.2.3", "major")).toBe("2.0.0");
  });

  it("syncs Cargo metadata to the package.json version", async () => {
    const { syncProjectVersions } = await import("../../../scripts/version-tools.mjs");

    const result = syncProjectVersions({
      packageJsonText: JSON.stringify({ name: "banana", version: "0.4.2" }, null, 2),
      cargoTomlText: `[package]
name = "Banana"
version = "0.1.0"
authors = ["FruitsAI"]
`,
      cargoLockText: `[[package]]
name = "Banana"
version = "0.1.0"
dependencies = []
`,
      cargoPackageName: "Banana",
    });

    expect(result.packageVersion).toBe("0.4.2");
    expect(result.isInSync).toBe(false);
    expect(result.nextCargoTomlText).toContain('version = "0.4.2"');
    expect(result.nextCargoLockText).toContain('name = "Banana"\nversion = "0.4.2"');
  });
});
