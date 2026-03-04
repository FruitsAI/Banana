import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

/**
 * Tauri 至原生 MCP (Model Context Protocol) 的桥接管道 (TauriMcpTransport)
 * @description 实现了基于 `@modelcontextprotocol/sdk` 的 `Transport` 接口抽象，作为前端 JS 层与底层 Rust 守护进程通讯的连接管。
 * 主要功能是通过 Tauri 的 event listen（监听 mcp-stdout 和 mcp-stderr）和 invoke Command 进行 JSON-RPC 的无缝转发转换。
 */
export class TauriMcpTransport implements Transport {
  private unlistenStdout: UnlistenFn | null = null;
  private unlistenStderr: UnlistenFn | null = null;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: unknown) => void;

  constructor(private command: string, private args: string[]) {}

  async start(): Promise<void> {
    try {
      // Listen to stdout and route to onmessage
      this.unlistenStdout = await listen<string>("mcp-stdout", (event) => {
        if (this.onmessage && event.payload) {
          try {
            const message = JSON.parse(event.payload);
            this.onmessage(message);
          } catch (e) {
            // Might be a non-JSON log line, parse fails
            console.warn("MCP stdout parse error:", e, "Payload:", event.payload);
          }
        }
      });

      // Listen to stderr and route to onerror/console
      this.unlistenStderr = await listen<string>("mcp-stderr", (event) => {
        console.error("MCP stderr:", event.payload);
      });

      // Spawn the process via Rust
      await invoke("start_mcp_server", {
        command: this.command,
        args: this.args,
      });

    } catch (e) {
      if (this.onerror) {
        this.onerror(e instanceof Error ? e : new Error(String(e)));
      }
      throw e;
    }
  }

  async close(): Promise<void> {
    if (this.unlistenStdout) {
      this.unlistenStdout();
      this.unlistenStdout = null;
    }
    if (this.unlistenStderr) {
      this.unlistenStderr();
      this.unlistenStderr = null;
    }
    if (this.onclose) {
      this.onclose();
    }
  }

  async send(message: unknown): Promise<void> {
    try {
      const jsonStr = JSON.stringify(message);
      await invoke("send_mcp_message", { message: jsonStr });
    } catch (e) {
      if (this.onerror) {
        this.onerror(e instanceof Error ? e : new Error(String(e)));
      }
      throw e;
    }
  }
}
