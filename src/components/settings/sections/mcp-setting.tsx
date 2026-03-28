"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { McpServer } from "@/domain/mcp/types";
import { Button } from "@/components/ui/button";
import { getAccentOutlineButtonStyle } from "@/components/ui/accent-outline-button-style";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavItem } from "@/components/ui/nav-item";
import { Switch } from "@/components/ui/switch";
import { TextareaField } from "@/components/ui/textarea-field";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import { useAnimationIntensity } from "@/components/animation-intensity-provider";
import { SettingsPageFrame } from "@/components/settings/settings-page-frame";
import {
  SettingsSectionGroup,
  SettingsSectionShell,
  SettingsSectionTitleRow,
} from "@/components/settings/settings-section-shell";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Refresh01Icon,
  Delete01Icon,
  Settings01Icon,
  McpServerIcon,
  Store01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { v4 as uuidv4 } from "uuid";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import { useMcpStore } from "@/stores/mcp/useMcpStore";
import { createMotionPresets } from "@/lib/motion-presets";
import { getErrorMessage } from "@/shared/errors";

interface McpProviderTab {
  id: "builtin" | "market";
  name: string;
  icon: typeof McpServerIcon | typeof Store01Icon;
}

interface McpMarketTemplate {
  id: string;
  name: string;
  description: string;
  type: "stdio" | "sse";
  command: string;
  args: string;
  env_vars?: string;
  tags: string[];
  setupNote?: string;
}

interface McpToolSummary {
  description?: string;
  name: string;
}

interface McpToolDiscoveryState {
  error?: string;
  status: "idle" | "loading" | "ready" | "error";
  tools: McpToolSummary[];
}

const MCP_STAGES: McpProviderTab[] = [
  {
    id: "builtin",
    name: "MCP 服务器",
    icon: McpServerIcon,
  },
  {
    id: "market",
    name: "市场",
    icon: Store01Icon,
  },
];

const MCP_MARKET_TEMPLATES: McpMarketTemplate[] = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "为本地目录提供读写能力，适合代码库、文档和素材文件管理。",
    type: "stdio",
    command: "npx",
    args: "-y\n@modelcontextprotocol/server-filesystem\n/Users/your-name/workspace",
    env_vars: "",
    tags: ["本地文件", "官方模板", "stdio"],
    setupNote: "保存前请把最后一行替换成你允许访问的本地目录。",
  },
  {
    id: "github",
    name: "GitHub",
    description: "读取仓库、Issue、PR 与提交信息，适合研发协作与代码托管场景。",
    type: "stdio",
    command: "npx",
    args: "-y\n@modelcontextprotocol/server-github",
    env_vars: "GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx",
    tags: ["代码托管", "协作", "stdio"],
    setupNote: "需要配置 GitHub Personal Access Token。",
  },
  {
    id: "brave-search",
    name: "Brave Search",
    description: "提供联网搜索能力，适合为模型补充公开网页与资讯检索。",
    type: "stdio",
    command: "npx",
    args: "-y\n@modelcontextprotocol/server-brave-search",
    env_vars: "BRAVE_API_KEY=your_api_key",
    tags: ["联网搜索", "检索", "stdio"],
    setupNote: "需要在环境变量中填入 Brave Search API Key。",
  },
  {
    id: "fetch",
    name: "Fetch",
    description: "抓取远程网页与接口响应，适合网页摘要、内容清洗和轻量爬取。",
    type: "stdio",
    command: "uvx",
    args: "mcp-server-fetch",
    env_vars: "",
    tags: ["HTTP", "抓取", "stdio"],
    setupNote: "如果本机未安装 uvx，可以改成你实际可用的 Python/Node 启动方式。",
  },
];

function createEmptyServer(): Partial<McpServer> {
  return {
    id: uuidv4(),
    name: "",
    description: "",
    type: "stdio",
    command: "",
    args: "",
    env_vars: "",
    is_enabled: true,
  };
}

function createServerFromTemplate(template: McpMarketTemplate): Partial<McpServer> {
  return {
    id: uuidv4(),
    name: template.name,
    description: template.description,
    type: template.type,
    command: template.command,
    args: template.args,
    env_vars: template.env_vars ?? "",
    is_enabled: true,
  };
}

function isMcpToolSummary(candidate: unknown): candidate is McpToolSummary {
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof (candidate as { name?: unknown }).name === "string"
  );
}

function getTemplateCommandPreview(template: McpMarketTemplate): string {
  const argsPreview = template.args
    .split("\n")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  return [template.command, argsPreview].filter(Boolean).join(" ");
}

export function McpSetting() {
  const {
    loadServers: loadServersFromStore,
    loadServerTools,
    removeServer,
    saveServer,
  } = useMcpStore();
  const confirm = useConfirm();
  const toast = useToast();
  const shouldReduceMotion = useReducedMotion();
  const { factors, intensity } = useAnimationIntensity();

  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeTabId, setActiveTabId] = useState<"builtin" | "market">("builtin");
  const [editingServer, setEditingServer] = useState<Partial<McpServer>>({});
  const [serverTools, setServerTools] = useState<Record<string, McpToolDiscoveryState>>({});
  const [toolsDialogServerId, setToolsDialogServerId] = useState<string | null>(null);

  const motionReduced = shouldReduceMotion || intensity === "low";
  const motionDuration = (value: number) => Number((value * factors.duration).toFixed(3));
  const motionDistance = (value: number) => Number((value * factors.distance).toFixed(3));
  const motionScale = (value: number) =>
    Number((1 - (1 - value) * factors.scale).toFixed(3));
  const motionPresets = createMotionPresets({
    reduced: motionReduced,
    duration: motionDuration,
    distance: motionDistance,
    scale: motionScale,
    scaleFactor: factors.scale,
  });

  const loadServers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadServersFromStore();
      setServers(data);
      setServerTools((prev) => {
        const next: Record<string, McpToolDiscoveryState> = {};
        for (const server of data) {
          if (prev[server.id]) {
            next[server.id] = prev[server.id];
          }
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to load MCP servers:", error);
      toast.error("加载 MCP 服务器失败");
    } finally {
      setLoading(false);
    }
  }, [loadServersFromStore, toast]);

  useEffect(() => {
    void loadServers();
  }, [loadServers]);

  const discoverServerTools = useCallback(
    async (
      server: Pick<McpServer, "id" | "command" | "args" | "env_vars">,
      options?: { force?: boolean },
    ) => {
      const force = options?.force ?? false;
      const current = serverTools[server.id];

      if (!force && current && current.status !== "idle" && current.status !== "error") {
        return;
      }

      setServerTools((prev) => {
        const existing = prev[server.id];
        if (!force && current && current.status !== "idle" && current.status !== "error") {
          return prev;
        }

        return {
          ...prev,
          [server.id]: {
            error: undefined,
            status: "loading",
            tools: existing?.tools ?? [],
          },
        };
      });

      try {
        const result = await loadServerTools(server);
        const tools: McpToolSummary[] = result.tools.flatMap((tool) => {
          if (!isMcpToolSummary(tool)) {
            return [];
          }

          return [
            {
              name: tool.name,
              description: tool.description,
            },
          ];
        });

        setServerTools((prev) => ({
          ...prev,
          [server.id]: {
            status: "ready",
            tools,
          },
        }));
      } catch (error) {
        setServerTools((prev) => ({
          ...prev,
          [server.id]: {
            error: getErrorMessage(error),
            status: "error",
            tools: prev[server.id]?.tools ?? [],
          },
        }));
      }
    },
    [loadServerTools, serverTools],
  );

  useEffect(() => {
    if (viewMode !== "list" || activeTabId !== "builtin" || servers.length === 0) {
      return;
    }

    for (const server of servers) {
      const state = serverTools[server.id];
      if (state) {
        continue;
      }

      void discoverServerTools(server);
    }
  }, [activeTabId, discoverServerTools, serverTools, servers, viewMode]);

  const handleToggleEnable = async (server: McpServer, enabled: boolean) => {
    try {
      const updated = { ...server, is_enabled: enabled };
      await saveServer(updated);
      setServers((prev) => prev.map((item) => (item.id === server.id ? updated : item)));
    } catch (error) {
      console.error("Failed to toggle MCP server:", error);
      toast.error("更新服务器状态失败");
    }
  };

  const handleEdit = (server: McpServer) => {
    setEditingServer(server);
    setViewMode("detail");
  };

  const handleAddNew = () => {
    setEditingServer(createEmptyServer());
    setViewMode("detail");
  };

  const handleUseTemplate = (template: McpMarketTemplate) => {
    setEditingServer(createServerFromTemplate(template));
    setViewMode("detail");
  };

  const handleViewServerTools = (server: McpServer) => {
    setToolsDialogServerId(server.id);
    const state = serverTools[server.id];

    if (!state || state.status === "idle" || state.status === "error") {
      void discoverServerTools(server, { force: state?.status === "error" });
    }
  };

  const handleSave = async () => {
    if (!editingServer.name || !editingServer.command) {
      toast.error("请填入名称和命令");
      return;
    }

    try {
      setSaving(true);
      const serverToSave = {
        ...editingServer,
        is_enabled: editingServer.is_enabled ?? true,
        type: editingServer.type ?? "stdio",
      } as McpServer;

      await saveServer(serverToSave);
      setServerTools((prev) => {
        const next = { ...prev };
        delete next[serverToSave.id];
        return next;
      });
      await loadServers();
      setViewMode("list");
      toast.success("保存成功");
    } catch (error) {
      console.error("Failed to save MCP server:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    const accepted = await confirm({
      title: "删除 MCP 服务器",
      description: name
        ? `删除后将移除「${name}」的配置。此操作不可撤销。`
        : "删除后将移除当前 MCP 服务器配置，此操作不可撤销。",
      confirmText: "删除",
      cancelText: "取消",
      variant: "destructive",
    });

    if (!accepted) return;

    try {
      await removeServer(id);
      setServers((prev) => prev.filter((item) => item.id !== id));
      setServerTools((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (toolsDialogServerId === id) {
        setToolsDialogServerId(null);
      }
      if (editingServer.id === id) {
        setEditingServer({});
        setViewMode("list");
      }
      toast.success("删除成功");
    } catch (error) {
      console.error("Failed to delete MCP server:", error);
      toast.error("删除失败");
    }
  };

  const isDetailView = viewMode === "detail";
  const isMarketView = activeTabId === "market";
  const shellTitle = isDetailView
    ? editingServer.name || "新建 MCP 服务器"
    : isMarketView
      ? "MCP 模板与市场"
      : "MCP 服务器";
  const headerAccessory = isDetailView ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 rounded-xl px-3 text-xs"
      surface="floating"
      onClick={() => setViewMode("list")}
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="mr-1.5" />
      返回列表
    </Button>
  ) : (
    <div
      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
      style={{
        ...getMaterialSurfaceStyle("content", "sm"),
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%), var(--material-content-background)",
        color: "var(--text-secondary)",
      }}
    >
      {isMarketView ? `内置模板 ${MCP_MARKET_TEMPLATES.length}` : `已配置 ${servers.length}`}
    </div>
  );

  const activeToolsServer = toolsDialogServerId
    ? servers.find((server) => server.id === toolsDialogServerId) ?? null
    : null;
  const activeToolsState = activeToolsServer
    ? serverTools[activeToolsServer.id] ?? { status: "idle", tools: [] }
    : null;

  const detailStage = (
    <>
      <SettingsSectionGroup>
        <div className="mb-5">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            基础信息
          </h3>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-2">
            <Label
              className="text-[13px] font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              <span className="mr-1" style={{ color: "var(--danger)" }}>
                *
              </span>
              名称
            </Label>
            <Input
              value={editingServer.name || ""}
              onChange={(event) =>
                setEditingServer({ ...editingServer, name: event.target.value })
              }
              placeholder="例如：My Local Tools"
              className="h-9"
              surface="floating"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              描述
            </Label>
            <Input
              value={editingServer.description || ""}
              onChange={(event) =>
                setEditingServer({ ...editingServer, description: event.target.value })
              }
              placeholder="简单描述一下这个服务器的功能"
              className="h-9"
              surface="floating"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Label className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
            连接方式
          </Label>
          <div
            className="rounded-2xl border px-4 py-4"
            style={{
              ...getMaterialSurfaceStyle("content", "sm"),
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
            }}
            data-surface-tone="liquid-mcp-transport-card"
          >
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              标准输入 / 输出 (stdio)
            </div>
          </div>
        </div>
      </SettingsSectionGroup>

      <SettingsSectionGroup>
        <div className="mb-5">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            启动命令
          </h3>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              <span className="mr-1" style={{ color: "var(--danger)" }}>
                *
              </span>
              命令
            </Label>
            <Input
              value={editingServer.command || ""}
              onChange={(event) =>
                setEditingServer({ ...editingServer, command: event.target.value })
              }
              placeholder="uvx, npx, node 或 可执行文件路径"
              className="h-9 font-mono"
              surface="floating"
            />
          </div>

          <div className="space-y-2">
            <Label
              className="text-[13px] font-medium flex items-center gap-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              参数
              <span className="cursor-help opacity-50" style={{ color: "var(--text-tertiary)" }}>
                ⓘ
              </span>
            </Label>
            <TextareaField
              value={editingServer.args || ""}
              onChange={(event) =>
                setEditingServer({ ...editingServer, args: event.target.value })
              }
              className="min-h-[112px] font-mono"
              containerClassName="w-full"
              placeholder={"arg1\narg2"}
              surface="content"
            />
          </div>

          <div className="space-y-2">
            <Label
              className="text-[13px] font-medium flex items-center gap-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              环境变量
              <span className="cursor-help opacity-50" style={{ color: "var(--text-tertiary)" }}>
                ⓘ
              </span>
            </Label>
            <TextareaField
              value={editingServer.env_vars || ""}
              onChange={(event) =>
                setEditingServer({ ...editingServer, env_vars: event.target.value })
              }
              className="min-h-[112px] font-mono"
              containerClassName="w-full"
              placeholder={"KEY1=value1\nKEY2=value2"}
              surface="content"
            />
          </div>
        </div>
      </SettingsSectionGroup>

      <SettingsSectionGroup interactive={false}>
        <div
          className="flex justify-end"
          data-testid="mcp-detail-actions"
        >
          <Button
            type="button"
            size="sm"
            className="h-9 w-full rounded-xl px-6 sm:w-auto sm:min-w-[112px]"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
          >
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </SettingsSectionGroup>
    </>
  );

  const marketStage = (
    <>
      <SettingsSectionGroup>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              模板概览
            </h3>
          </div>

          <div
            className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
            style={{
              ...getMaterialSurfaceStyle("floating", "sm"),
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
              color: "var(--text-tertiary)",
            }}
          >
            stdio only
          </div>
        </div>
      </SettingsSectionGroup>

      <SettingsSectionGroup className="p-3 sm:p-4">
        <div className="space-y-3">
          {MCP_MARKET_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="rounded-[24px] border px-5 py-5 sm:px-6"
              style={{
                ...getMaterialSurfaceStyle("content", "sm"),
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
              }}
              data-surface-tone="liquid-mcp-template-card"
            >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                    style={{
                      background: "var(--selection-active-soft-fill)",
                      borderColor: "var(--selection-active-border)",
                    }}
                  >
                    <HugeiconsIcon
                      icon={McpServerIcon}
                      size={18}
                      style={{ color: "var(--selection-active-indicator)" }}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3
                      className="truncate text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {template.name}
                    </h3>
                    <p
                      className="text-[11px] uppercase tracking-[0.12em]"
                      style={{ color: "var(--text-quaternary)" }}
                    >
                      {template.type}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        ...getMaterialSurfaceStyle("floating", "sm"),
                        color: "var(--text-secondary)",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-4 rounded-2xl border px-4 py-3"
                  style={{
                    ...getMaterialSurfaceStyle("floating", "sm"),
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
                  }}
                >
                  <div className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                    启动命令
                  </div>
                  <div className="mt-1 break-all text-xs font-mono" style={{ color: "var(--text-primary)" }}>
                    {getTemplateCommandPreview(template)}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 shrink-0 rounded-xl px-4 text-xs font-medium"
                surface="floating"
                aria-label={`使用 ${template.name} 模板`}
                onClick={() => handleUseTemplate(template)}
              >
                使用模板
              </Button>
            </div>
            </div>
          ))}
        </div>
      </SettingsSectionGroup>
    </>
  );

  const listStage = (
    <>
      <SettingsSectionGroup>
        <SettingsSectionTitleRow
          testId="mcp-connected-header-row"
          title="已连接服务器"
          accessory={
            <button
              type="button"
              aria-label="刷新 MCP 服务器"
              className="material-interactive flex h-8 w-8 items-center justify-center rounded-xl border transition-[transform,box-shadow]"
              style={{
                ...getMaterialSurfaceStyle("floating", "sm"),
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
              }}
              onClick={() => {
                void loadServers();
              }}
              title="刷新服务器状态"
            >
              <HugeiconsIcon
                icon={Refresh01Icon}
                size={18}
                className={loading ? "animate-spin" : ""}
                style={{ color: "var(--text-tertiary)" }}
              />
            </button>
          }
        />
      </SettingsSectionGroup>

      <SettingsSectionGroup className="overflow-hidden p-0 [&>div]:flex [&>div]:min-h-[360px] [&>div]:flex-col">
        <div data-mcp-server-list-layout="stacked">
          {loading ? (
            <div
              className="flex flex-1 items-center justify-center px-5 py-14 text-center text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              加载中...
            </div>
          ) : servers.length === 0 ? (
            <div className="flex flex-1 items-center px-5 py-12 sm:px-6 sm:py-14">
              <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-[22px] border"
                  style={{
                    ...getMaterialSurfaceStyle("accent", "sm"),
                    background: "var(--selection-active-fill)",
                    borderColor: "var(--selection-active-border)",
                  }}
                >
                  <HugeiconsIcon
                    icon={McpServerIcon}
                    size={24}
                    style={{ color: "var(--selection-active-foreground)" }}
                  />
                </div>
                <h4
                  className="mt-5 text-base font-semibold tracking-[-0.01em]"
                  style={{ color: "var(--text-primary)" }}
                >
                  还没有 MCP 服务器
                </h4>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 rounded-xl px-4 text-sm"
                    aria-label="添加空白配置"
                    onClick={handleAddNew}
                  >
                    添加空白配置
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl px-4 text-sm"
                    surface="floating"
                    aria-label="浏览模板"
                    style={getAccentOutlineButtonStyle("sm")}
                    onClick={() => setActiveTabId("market")}
                  >
                    浏览模板
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                className="custom-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-4"
                data-mcp-server-list-scroll="true"
              >
                <div className="space-y-3">
                  {servers.map((server) => (
                    <div
                      key={server.id}
                      className="rounded-[24px] border px-5 py-4 sm:px-6"
                      style={{
                        ...getMaterialSurfaceStyle("content", "sm"),
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
                      }}
                      data-surface-tone="liquid-mcp-server-card"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            className="min-w-0 text-left"
                            onClick={() => handleEdit(server)}
                          >
                            <div
                              className="truncate text-sm font-semibold transition-colors"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {server.name}
                            </div>
                          </button>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                color: "var(--selection-active-foreground)",
                                background: "var(--selection-active-soft-fill)",
                                borderColor: "var(--selection-active-border)",
                              }}
                            >
                              {server.type.toUpperCase()}
                            </span>
                            <span
                              className="truncate text-[11px] font-mono"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {server.command}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              surface="floating"
                              className="rounded-full px-3"
                              aria-label={`查看 ${server.name} 的全部工具`}
                              onClick={() => handleViewServerTools(server)}
                            >
                              {serverTools[server.id]?.status === "ready"
                                ? `工具 ${serverTools[server.id]?.tools.length ?? 0}`
                                : serverTools[server.id]?.status === "loading"
                                  ? "工具 ..."
                                  : "工具"}
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                          <div
                            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                            style={{
                              ...getMaterialSurfaceStyle(server.is_enabled ? "accent" : "floating", "sm"),
                              background: server.is_enabled
                                ? "linear-gradient(180deg, rgba(34,197,94,0.16) 0%, rgba(255,255,255,0.06) 100%), color-mix(in srgb, var(--success) 12%, var(--material-content-background))"
                                : "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 100%), var(--material-floating-background)",
                              borderColor: server.is_enabled
                                ? "color-mix(in srgb, var(--success) 40%, var(--material-accent-border))"
                                : "var(--material-floating-border)",
                              color: server.is_enabled ? "var(--success)" : "var(--text-tertiary)",
                            }}
                          >
                            <HugeiconsIcon
                              icon={server.is_enabled ? CheckmarkCircle02Icon : UnavailableIcon}
                              size={12}
                            />
                            <span>{server.is_enabled ? "已运行" : "未启用"}</span>
                          </div>

                          <Switch
                            checked={server.is_enabled}
                            onCheckedChange={(checked) => {
                              void handleToggleEnable(server, checked);
                            }}
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            surface="floating"
                            aria-label={`编辑 MCP 服务器 ${server.name}`}
                            className="rounded-xl hover:text-[var(--selection-active-indicator)]"
                            style={{ color: "var(--text-tertiary)" }}
                            onClick={() => handleEdit(server)}
                          >
                            <HugeiconsIcon icon={Settings01Icon} size={16} />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            surface="floating"
                            aria-label={`删除 MCP 服务器 ${server.name}`}
                            className="rounded-xl"
                            style={{ color: "var(--danger)" }}
                            onClick={() => {
                              void handleDelete(server.id, server.name);
                            }}
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t px-4 py-4 sm:px-5" style={{ borderColor: "var(--divider)" }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-full justify-center rounded-[18px] px-4 text-sm font-medium"
                  surface="floating"
                  aria-label="添加 MCP 服务器"
                  style={getAccentOutlineButtonStyle("sm")}
                  onClick={handleAddNew}
                >
                  添加 MCP 服务器
                </Button>
              </div>
            </>
          )}
        </div>
      </SettingsSectionGroup>
    </>
  );

  const activeStageContent = isDetailView
    ? detailStage
    : isMarketView
      ? marketStage
      : listStage;

  return (
    <SettingsPageFrame>
      <SettingsSectionShell
          sectionId="mcp"
          eyebrow="MCP"
          title={shellTitle}
          headerAccessory={headerAccessory}
        >
          <div
            className="grid min-h-0 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-6 2xl:grid-cols-[300px_minmax(0,1fr)]"
            data-mcp-layout="matched"
          >
            <SettingsSectionGroup className="flex self-start flex-col overflow-hidden p-0 sm:p-0">
              <div
                className="flex-none px-5 pb-5 pt-5 sm:px-6 sm:pb-5 sm:pt-6"
                data-testid="mcp-browser-header"
              >
                <SettingsSectionTitleRow
                  testId="mcp-browser-header-row"
                  title="浏览"
                />
              </div>

              <div
                className="flex min-h-0 flex-1 flex-col border-t p-3"
                data-testid="mcp-browser-body"
                style={{ borderColor: "var(--divider)" }}
              >
                <div className="space-y-2" role="tablist" aria-label="MCP 分组">
                  {MCP_STAGES.map((stage) => {
                    const isActive = activeTabId === stage.id;

                    return (
                      <NavItem
                        key={stage.id}
                        icon={stage.icon}
                        label={stage.name}
                        isActive={isActive}
                        layoutId="mcpStageNav"
                        onClick={() => {
                          setActiveTabId(stage.id as "builtin" | "market");
                          setViewMode("list");
                        }}
                        semanticProps={{
                          "aria-selected": isActive,
                          role: "tab",
                          type: "button",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </SettingsSectionGroup>

            <div
              className="min-w-0"
              data-testid="mcp-content-stage"
              data-mcp-stage={activeTabId}
              data-mcp-view-mode={viewMode}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={`${activeTabId}-${viewMode}`}
                  className="space-y-5"
                  data-motion-preset="panel"
                  initial={motionPresets.panel.initial}
                  animate={motionPresets.panel.animate}
                  exit={
                    motionReduced
                      ? { opacity: 0.999, y: 0, scale: 1 }
                      : { opacity: 0, y: motionDistance(-8), scale: motionScale(0.992) }
                  }
                  transition={motionPresets.panel.transition}
                >
                  {activeStageContent}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
      </SettingsSectionShell>

      <Dialog
        open={Boolean(activeToolsServer)}
        onOpenChange={(open) => {
          if (!open) {
            setToolsDialogServerId(null);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-w-2xl overflow-hidden border-0 bg-transparent p-0 shadow-none"
        >
          <motion.div
            initial={motionReduced ? false : { opacity: 0, scale: 0.985, y: 14 }}
            animate={motionReduced ? {} : { opacity: 1, scale: 1, y: 0 }}
            transition={
              motionReduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 24, mass: 0.8 }
            }
            className="relative flex max-h-[72vh] flex-col rounded-2xl border"
            style={{
              background:
                "linear-gradient(145deg, color-mix(in srgb, var(--material-floating-background) 96%, transparent) 0%, color-mix(in srgb, var(--material-content-background) 94%, transparent) 100%)",
              borderColor: "var(--material-content-border)",
              boxShadow: "0 22px 54px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.42)",
              backdropFilter: "blur(24px) saturate(190%)",
              WebkitBackdropFilter: "blur(24px) saturate(190%)",
            }}
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full"
              style={{
                background: "radial-gradient(circle, var(--brand-primary-glow) 0%, transparent 74%)",
                filter: "blur(8px)",
              }}
              animate={
                motionReduced
                  ? undefined
                  : { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
              }
              transition={
                motionReduced
                  ? undefined
                  : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
              }
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px opacity-85"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--material-highlight) 68%, transparent) 22%, color-mix(in srgb, var(--brand-primary-light) 32%, transparent) 78%, transparent 100%)",
              }}
            />

            <DialogHeader className="relative z-10 space-y-2 px-6 pb-5 pt-6 text-left sm:px-7">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle>{activeToolsServer?.name ?? "MCP 工具"}</DialogTitle>
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    background: "var(--material-floating-background)",
                    borderColor: "var(--material-content-border)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  Tools
                </span>
              </div>
            </DialogHeader>

            <div className="relative z-10 max-h-[65vh] overflow-y-auto px-6 pb-8 pt-4 sm:px-7 sm:pb-10">
              {activeToolsState?.status === "loading" || activeToolsState?.status === "idle" ? (
                <div
                  className="flex min-h-40 items-center justify-center text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  正在加载工具列表...
                </div>
              ) : activeToolsState?.status === "error" ? (
                <div
                  className="rounded-[24px] border px-5 py-5"
                  style={{
                    ...getMaterialSurfaceStyle("content", "sm"),
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    暂时无法读取工具
                  </div>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    {activeToolsState.error}
                  </p>
                </div>
              ) : activeToolsState && activeToolsState.tools.length > 0 ? (
                <div
                  className="space-y-3 pb-8 sm:pb-10"
                  data-testid="mcp-tools-list"
                >
                  {activeToolsState.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="rounded-[24px] border px-5 py-4"
                      style={{
                        ...getMaterialSurfaceStyle("content", "sm"),
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%), var(--material-content-background)",
                      }}
                    >
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {tool.name}
                      </div>
                      {tool.description ? (
                        <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                          {tool.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-tertiary)" }}>
                          这个工具暂时没有描述信息。
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex min-h-40 items-center justify-center text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  当前服务器还没有暴露可用工具。
                </div>
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </SettingsPageFrame>
  );
}
