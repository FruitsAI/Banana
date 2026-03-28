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

type RuntimeToolServer = Pick<McpServer, "id" | "is_enabled" | "command" | "args" | "env_vars">;

interface RuntimeToolMapDependencies {
  capabilityMode?: {
    searchEnabled?: boolean;
  };
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

function isSearchTool(candidate: ListedToolCandidate): boolean {
  const haystack = `${candidate.name} ${candidate.description ?? ""}`.toLowerCase();
  return ["search", "web", "browser", "crawl", "extract", "tavily", "brave"].some((token) =>
    haystack.includes(token),
  );
}

const runtimeToolDiscoveryCache = new Map<string, Promise<ListedToolCandidate[]>>();

function getRuntimeToolDiscoveryCacheKey(server: RuntimeToolServer): string {
  return JSON.stringify([
    server.id,
    server.command,
    server.args ?? "",
    server.env_vars ?? "",
  ]);
}

async function discoverServerTools(
  server: RuntimeToolServer,
  listTools: typeof listMcpTools,
): Promise<ListedToolCandidate[]> {
  const cacheKey = getRuntimeToolDiscoveryCacheKey(server);
  const cachedDiscovery = runtimeToolDiscoveryCache.get(cacheKey);
  if (cachedDiscovery) {
    return cachedDiscovery;
  }

  const pendingDiscovery: Promise<ListedToolCandidate[]> = (async () => {
    const result = await listTools(server);
    return result.tools.flatMap((tool) => {
      if (!isListedToolCandidate(tool)) {
        return [];
      }

      return [
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
      ];
    });
  })();

  runtimeToolDiscoveryCache.set(cacheKey, pendingDiscovery);

  try {
    return await pendingDiscovery;
  } catch (error) {
    if (runtimeToolDiscoveryCache.get(cacheKey) === pendingDiscovery) {
      runtimeToolDiscoveryCache.delete(cacheKey);
    }
    throw error;
  }
}

function getEnabledServers(
  servers: RuntimeToolServer[],
): RuntimeToolServer[] {
  return servers.filter((server) => server.is_enabled);
}

export function resetRuntimeToolDiscoveryCache(): void {
  runtimeToolDiscoveryCache.clear();
}

export async function preloadRuntimeToolDiscovery(
  servers: RuntimeToolServer[],
  dependencies: Pick<RuntimeToolMapDependencies, "listTools" | "onDiscoveryError"> = {},
): Promise<void> {
  const listTools = dependencies.listTools ?? listMcpTools;
  const onDiscoveryError = dependencies.onDiscoveryError;

  await Promise.all(
    getEnabledServers(servers).map(async (server) => {
      try {
        await discoverServerTools(server, listTools);
      } catch (error) {
        onDiscoveryError?.({
          serverId: server.id,
          error: toError(error),
        });
      }
    }),
  );
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
  servers: RuntimeToolServer[],
  dependencies: RuntimeToolMapDependencies = {},
): Promise<RuntimeToolMap> {
  const capabilityMode = dependencies.capabilityMode;
  const listTools = dependencies.listTools ?? listMcpTools;
  const callTool = dependencies.callTool ?? callMcpTool;
  const onDiscoveryError = dependencies.onDiscoveryError;
  const runtimeTools: RuntimeToolMap = {};

  const discoveries = await Promise.all(
    getEnabledServers(servers).map(async (server) => {
      try {
        const tools = await discoverServerTools(server, listTools);
        return { server, tools };
      } catch (error) {
        onDiscoveryError?.({
          serverId: server.id,
          error: toError(error),
        });
        return null;
      }
    }),
  );

  for (const discovery of discoveries) {
    if (!discovery) {
      continue;
    }

    const { server, tools } = discovery;

    for (const candidate of tools) {
      if (!isListedToolCandidate(candidate)) {
        continue;
      }

      if (capabilityMode?.searchEnabled === false && isSearchTool(candidate)) {
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
