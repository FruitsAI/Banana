import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

/**
 * Tauri 到原生 MCP 协议的通信桥梁 (TauriMcpTransport)
 * @description 
 *   实现了基于 `@modelcontextprotocol/sdk` 中的标准 `Transport` (传输层) 接口抽象。
 *   作为前端 JS 环境与底层 Rust 后端守护进程交互的核心数据管线。
 *   核心逻辑是利用 Tauri 事件引擎（监听 `mcp-stdout` / `mcp-stderr`）与 `invoke` 指令
 *   将标准输入 / 输出流无缝转化为前端可读的 JSON-RPC 格式。
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

/**
 * 获取指定 MCP 服务器的所有可用工具
 */
export async function mcpListTools(server: {
  id: string;
  command: string;
  args?: string;
  env_vars?: string;
}): Promise<{ tools: Record<string, unknown>[] }> {
  // MCP 参数约定：一行一个参数。这样可以完美支持带有空格的文件路径或特殊参数。
  const argsArray = server.args 
    ? server.args.split('\n').map(a => a.trim()).filter(a => a !== "") 
    : [];
    
  return await invoke<{ tools: Record<string, unknown>[] }>("mcp_list_tools", {
    serverId: server.id,
    command: server.command,
    args: argsArray,
    envVars: server.env_vars
  });
}

/**
 * 执行指定的 MCP 工具
 */
export async function mcpCallTool(
  serverId: string,
  toolName: string,
  arguments_obj: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return await invoke<Record<string, unknown>>("mcp_call_tool", {
    serverId,
    toolName,
    arguments: arguments_obj
  });
}
