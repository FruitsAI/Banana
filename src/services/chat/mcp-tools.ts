import type { McpServer, McpToolArguments, McpToolCallResult } from "@/domain/mcp/types";
import { callMcpTool, listMcpTools } from "@/services/mcp";
import { getErrorMessage } from "@/shared/errors";

export interface RuntimeToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface RuntimeToolSuccess {
  ok: true;
  data: McpToolCallResult;
}

export interface RuntimeToolFailure {
  ok: false;
  error: {
    category: "tool-error";
    message: string;
  };
}

export type RuntimeToolResult = RuntimeToolSuccess | RuntimeToolFailure;

export interface RuntimeChatTool extends RuntimeToolDescriptor {
  execute(args: McpToolArguments): Promise<RuntimeToolResult>;
}

export type RuntimeToolMap = Record<string, RuntimeChatTool>;

interface ListedToolCandidate extends RuntimeToolDescriptor {
  name: string;
}

interface RuntimeToolMapDependencies {
  callTool?: typeof callMcpTool;
  listTools?: typeof listMcpTools;
  onDiscoveryError?: (event: {
    serverId: string;
    error: Error;
  }) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isListedToolCandidate(value: unknown): value is ListedToolCandidate {
  return isObject(value) && typeof value.name === "string";
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(getErrorMessage(error));
}

export function normalizeToolSuccess(data: McpToolCallResult): RuntimeToolSuccess {
  return {
    ok: true,
    data,
  };
}

export function normalizeToolFailure(error: unknown): RuntimeToolFailure {
  return {
    ok: false,
    error: {
      category: "tool-error",
      message: getErrorMessage(error),
    },
  };
}

export async function createRuntimeToolMap(
  servers: Array<Pick<McpServer, "id" | "is_enabled" | "command" | "args" | "env_vars">>,
  dependencies: RuntimeToolMapDependencies = {},
): Promise<RuntimeToolMap> {
  const listTools = dependencies.listTools ?? listMcpTools;
  const callTool = dependencies.callTool ?? callMcpTool;
  const onDiscoveryError = dependencies.onDiscoveryError;
  const runtimeTools: RuntimeToolMap = {};

  for (const server of servers) {
    if (!server.is_enabled) {
      continue;
    }

    let result;
    try {
      result = await listTools(server);
    } catch (error) {
      onDiscoveryError?.({
        serverId: server.id,
        error: toError(error),
      });
      continue;
    }

    for (const candidate of result.tools) {
      if (!isListedToolCandidate(candidate)) {
        continue;
      }

      runtimeTools[candidate.name] = {
        name: candidate.name,
        description: candidate.description,
        inputSchema: candidate.inputSchema,
        async execute(args: McpToolArguments): Promise<RuntimeToolResult> {
          try {
            const data = await callTool(server.id, candidate.name, args);
            return normalizeToolSuccess(data);
          } catch (error) {
            return normalizeToolFailure(error);
          }
        },
      };
    }
  }

  return runtimeTools;
}
