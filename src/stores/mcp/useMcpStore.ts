import { useCallback } from "react";
import type {
  McpListToolsResult,
  McpServer,
  McpToolArguments,
  McpToolCallResult,
} from "@/domain/mcp/types";
import {
  callMcpTool,
  deleteMcpServer,
  getMcpServers,
  listMcpTools,
  upsertMcpServer,
} from "@/services/mcp";

export function useMcpStore() {
  const loadServers = useCallback(async (): Promise<McpServer[]> => {
    return await getMcpServers();
  }, []);

  const saveServer = useCallback(async (server: McpServer): Promise<void> => {
    await upsertMcpServer(server);
  }, []);

  const removeServer = useCallback(async (serverId: string): Promise<void> => {
    await deleteMcpServer(serverId);
  }, []);

  const loadServerTools = useCallback(
    async (server: Pick<McpServer, "id" | "command" | "args" | "env_vars">): Promise<McpListToolsResult> => {
      return await listMcpTools(server);
    },
    [],
  );

  const runServerTool = useCallback(
    async (serverId: string, toolName: string, args: McpToolArguments): Promise<McpToolCallResult> => {
      return await callMcpTool(serverId, toolName, args);
    },
    [],
  );

  return {
    loadServers,
    saveServer,
    removeServer,
    loadServerTools,
    runServerTool,
  };
}
