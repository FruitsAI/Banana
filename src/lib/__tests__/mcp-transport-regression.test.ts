import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("deprecated MCP transport cleanup", () => {
  it("does not keep deprecated MCP transport commands wired into the frontend or Tauri registry", async () => {
    const frontendMcpSource = await readFile(
      path.resolve(process.cwd(), "src/lib/mcp.ts"),
      "utf8",
    );
    const tauriRegistrySource = await readFile(
      path.resolve(process.cwd(), "src-tauri/src/lib.rs"),
      "utf8",
    );

    expect(frontendMcpSource).not.toContain("start_mcp_server");
    expect(frontendMcpSource).not.toContain("send_mcp_message");
    expect(frontendMcpSource).not.toContain("TauriMcpTransport");
    expect(tauriRegistrySource).not.toContain("mcp::start_mcp_server");
    expect(tauriRegistrySource).not.toContain("mcp::send_mcp_message");
  });
});
