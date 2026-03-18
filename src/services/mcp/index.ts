import {
  deleteMcpServer as dbDeleteMcpServer,
  getMcpServers as dbGetMcpServers,
  upsertMcpServer as dbUpsertMcpServer,
} from "@/lib/db";
import { mcpCallTool as runtimeCallTool, mcpListTools as runtimeListTools } from "@/lib/mcp";
import type {
  McpListToolsResult,
  McpServer,
  McpToolArguments,
  McpToolCallResult,
} from "@/domain/mcp/types";
import { AppError, normalizeError } from "@/shared/errors";

function wrapError(operation: string, error: unknown): AppError {
  return normalizeError(error, {
    domain: "mcp",
    operation,
    code: "SERVICE_ERROR",
  });
}

export async function getMcpServers(): Promise<McpServer[]> {
  try {
    return await dbGetMcpServers();
  } catch (error) {
    throw wrapError("getMcpServers", error);
  }
}

export async function upsertMcpServer(server: McpServer): Promise<void> {
  try {
    await dbUpsertMcpServer(server);
  } catch (error) {
    throw wrapError("upsertMcpServer", error);
  }
}

export async function deleteMcpServer(serverId: string): Promise<void> {
  try {
    await dbDeleteMcpServer(serverId);
  } catch (error) {
    throw wrapError("deleteMcpServer", error);
  }
}

export async function listMcpTools(
  server: Pick<McpServer, "id" | "command" | "args" | "env_vars">,
): Promise<McpListToolsResult> {
  try {
    return await runtimeListTools(server);
  } catch (error) {
    throw wrapError("listMcpTools", error);
  }
}

export async function callMcpTool(
  serverId: string,
  toolName: string,
  args: McpToolArguments,
): Promise<McpToolCallResult> {
  try {
    return await runtimeCallTool(serverId, toolName, args);
  } catch (error) {
    throw wrapError("callMcpTool", error);
  }
}
