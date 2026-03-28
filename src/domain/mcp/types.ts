export interface McpServer {
  id: string;
  name: string;
  description?: string;
  type: string;
  command: string;
  args?: string;
  env_vars?: string;
  is_enabled: boolean;
}

export interface McpTool {
  name?: string;
  description?: string;
  inputSchema?: unknown;
  [key: string]: unknown;
}

export interface McpListToolsResult {
  tools: McpTool[];
}

export type McpToolArguments = Record<string, unknown>;
export type McpToolCallResult = Record<string, unknown>;
