import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DOMAIN_FILES = [
  "src-tauri/src/domain/chat.rs",
  "src-tauri/src/domain/models.rs",
  "src-tauri/src/domain/mcp.rs",
] as const;

describe("rust domain migration", () => {
  it("does not leave placeholder-only Rust domain modules behind", async () => {
    const contents = await Promise.all(
      DOMAIN_FILES.map((relativePath) =>
        readFile(path.resolve(process.cwd(), relativePath), "utf8"),
      ),
    );

    contents.forEach((content) => {
      expect(content.toLowerCase()).not.toContain("placeholder");
    });
  });
});
