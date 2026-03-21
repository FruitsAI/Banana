import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import packageJson from "../../package.json";

describe("desktop dev config", () => {
  it("disables image optimization when using static export", () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.images?.unoptimized).toBe(true);
  });

  it("pins the dev server to port 3000 for tauri dev", () => {
    expect(packageJson.scripts.dev).toBe("next dev -p 3000");
  });
});
