import { invoke } from "@tauri-apps/api/core";
import type {
  McpListToolsResult,
  McpServer,
  McpToolArguments,
  McpToolCallResult,
} from "@/domain/mcp/types";

/**
 * 获取指定 MCP 服务器的所有可用工具
 */
function parseMcpArgs(rawArgs?: string): string[] {
  if (!rawArgs) {
    return [];
  }

  // MCP 参数约定：一行一个参数。这样可以完美支持带有空格的文件路径或特殊参数。
  return rawArgs.split("\n").map((arg) => arg.trim()).filter((arg) => arg !== "");
}

export async function mcpListTools(
  server: Pick<McpServer, "id" | "command" | "args" | "env_vars">,
): Promise<McpListToolsResult> {
  // MCP 参数约定：一行一个参数。这样可以完美支持带有空格的文件路径或特殊参数。
  const argsArray = parseMcpArgs(server.args);
    
  return await invoke<McpListToolsResult>("mcp_list_tools", {
    serverId: server.id,
    command: server.command,
    args: argsArray,
    envVars: server.env_vars,
  });
}

/**
 * 执行指定的 MCP 工具
 */
export async function mcpCallTool(
  serverId: string,
  toolName: string,
  arguments_obj: McpToolArguments,
): Promise<McpToolCallResult> {
  return await invoke<McpToolCallResult>("mcp_call_tool", {
    serverId,
    toolName,
    arguments: arguments_obj,
  });
}
