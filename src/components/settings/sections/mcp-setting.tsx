"use client";

import { useCallback, useEffect, useState } from "react";
import type { McpServer } from "@/domain/mcp/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NavItem } from "@/components/ui/nav-item";
import { SidebarLayout } from "@/components/ui/sidebar-layout";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
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

/**
 * McpSetting 组件 (MCP 服务器设置)
 * @description
 *   管理 Model Context Protocol (MCP) 服务器的配置。
 */

interface McpProviderTab {
  id: string;
  name: string;
  icon: string;
  type: "discover" | "provider";
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

const MCP_STAGES: McpProviderTab[] = [
  { id: "builtin", name: "MCP 服务器", icon: "box", type: "discover" },
  { id: "market", name: "市场", icon: "store", type: "discover" },
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
  const { loadServers: loadServersFromStore, removeServer, saveServer } = useMcpStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeTabId, setActiveTabId] = useState("builtin");
  
  // 当前编辑的服务器状态
  const [editingServer, setEditingServer] = useState<Partial<McpServer>>({});

  const loadServers = useCallback(async () => {
    try {
      setLoading(true);
      // 添加人为延迟以确保动画可见
      const [data] = await Promise.all([
        loadServersFromStore(),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      setServers(data);
    } catch (error) {
      console.error("Failed to load MCP servers:", error);
      toast.error("加载 MCP 服务器失败");
    } finally {
      setLoading(false);
    }
  }, [loadServersFromStore, toast]);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const handleToggleEnable = async (server: McpServer, enabled: boolean) => {
    try {
      const updated = { ...server, is_enabled: enabled };
      await saveServer(updated);
      setServers(prev => prev.map(s => s.id === server.id ? updated : s));
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
        type: editingServer.type ?? "stdio"
      } as McpServer;
      
      await saveServer(serverToSave);
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
      setServers(prev => prev.filter(s => s.id !== id));
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

  // 左侧导航栏内容
  const sidebar = (
    <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scroll">
      <div className="space-y-0.5">
        {MCP_STAGES.map((cat) => (
          <NavItem
            key={cat.id}
            icon={cat.icon === "box" ? McpServerIcon : Store01Icon}
            label={cat.name}
            isActive={activeTabId === cat.id}
            onClick={() => { setActiveTabId(cat.id); setViewMode("list"); }}
            layoutId="mcpNav"
          />
        ))}
      </div>
    </div>
  );

  // 右侧工作区内容
  const content = viewMode === "list" ? (
    activeTabId === "builtin" ? (
      <div className="flex-1 flex flex-col h-full p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                MCP 服务器
              </h2>
              <HugeiconsIcon icon={Search01Icon} size={16} className="cursor-pointer" style={{ color: "var(--text-tertiary)" }} />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="刷新 MCP 服务器"
                className="flex items-center justify-center h-8 w-8 rounded-xl border cursor-pointer hover:bg-glass-hover transition-colors"
                style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                onClick={loadServers}
                title="刷新服务器状态"
              >
                <HugeiconsIcon icon={Refresh01Icon} size={18} className={loading ? "animate-spin" : ""} style={{ color: "var(--text-tertiary)" }} />
              </button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-4 text-xs font-medium border"
                style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                onClick={handleAddNew}
              >
                添加
              </Button>
            </div>
          </div>

          {/* Server Card List */}
          <div className="grid grid-cols-1 gap-4 overflow-y-auto h-full pb-10 custom-scroll">
            {loading ? (
              <div className="text-center py-20 text-sm text-[var(--text-tertiary)]">加载中...</div>
            ) : servers.length === 0 ? (
              <div className="text-center py-20 text-sm text-[var(--text-tertiary)] border border-dashed rounded-2xl">
                暂无配置服务器，点击“添加”开始。
              </div>
            ) : (
              servers.map((server) => (
                <div
                  key={server.id}
                  className="rounded-xl p-5 border group relative"
                  style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-base font-semibold cursor-pointer hover:underline truncate mr-2"
                      style={{ color: "var(--text-primary)" }}
                      onClick={() => handleEdit(server)}
                    >
                      {server.name}
                    </h3>
                    <div className="flex items-center gap-4">
                      {/* 运行状态图标 */}
                      <div 
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors"
                        style={{ 
                          background: server.is_enabled ? "var(--success-lightest)" : "var(--glass-subtle)", 
                          borderColor: server.is_enabled ? "var(--success)" : "var(--glass-border)",
                          opacity: server.is_enabled ? 1 : 0.6
                        }}
                      >
                        <HugeiconsIcon 
                          icon={server.is_enabled ? CheckmarkCircle02Icon : UnavailableIcon} 
                          size={12} 
                          style={{ color: server.is_enabled ? "var(--success)" : "var(--text-quaternary)" }} 
                        />
                        <span className="text-[10px] font-semibold" style={{ color: server.is_enabled ? "var(--success)" : "var(--text-tertiary)" }}>
                          {server.is_enabled ? "已运行" : "未启用"}
                        </span>
                      </div>

                      <Switch 
                        checked={server.is_enabled} 
                        onCheckedChange={(checked) => handleToggleEnable(server, checked)}
                      />
                      <button
                        type="button"
                        aria-label={`删除 MCP 服务器 ${server.name}`}
                        className="transition-colors hover:text-[var(--danger)]"
                        style={{ color: "var(--danger)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(server.id, server.name);
                        }}
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`编辑 MCP 服务器 ${server.name}`}
                        className="hover:text-[var(--brand-primary)]"
                        style={{ color: "var(--text-tertiary)" }}
                        onClick={() => handleEdit(server)}
                      >
                        <HugeiconsIcon icon={Settings01Icon} size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs mt-1 text-[var(--text-tertiary)] truncate">
                    {server.description || "没有描述"}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <div
                      className="text-[10px] flex items-center justify-center px-2 py-[2px] rounded-full font-mono font-medium border"
                      style={{
                        borderColor: "var(--brand-primary)",
                        color: "var(--brand-primary)",
                        background: "var(--brand-primary-lightest)",
                      }}
                    >
                      {server.type.toUpperCase()}
                    </div>
                    <div className="text-[10px] flex items-center text-[var(--text-quaternary)] font-mono truncate max-w-[200px]">
                      {server.command}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    ) : (
      <div className="flex-1 flex flex-col h-full p-6">
        <div className="flex flex-col gap-6 h-full">
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                MCP 市场
              </h2>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                从内置模板快速创建服务器，随后仍可在详情页继续调整命令、参数和环境变量。
              </p>
            </div>
            <div
              className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--glass-border)",
                background: "var(--glass-surface)",
              }}
            >
              内置模板 {MCP_MARKET_TEMPLATES.length}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto h-full pb-10 custom-scroll">
            {MCP_MARKET_TEMPLATES.map((template) => (
              <article
                key={template.id}
                className="group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                  boxShadow: "0 20px 60px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                        style={{
                          background: "var(--brand-primary-lightest)",
                          borderColor: "var(--brand-primary-border)",
                        }}
                      >
                        <HugeiconsIcon icon={McpServerIcon} size={18} style={{ color: "var(--brand-primary)" }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {template.name}
                        </h3>
                        <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--text-quaternary)" }}>
                          {template.type}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                      {template.description}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 rounded-xl px-4 text-xs font-medium"
                    style={{ background: "var(--glass-elevated)", borderColor: "var(--glass-border)" }}
                    aria-label={`使用 ${template.name} 模板`}
                    onClick={() => handleUseTemplate(template)}
                  >
                    使用模板
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        color: "var(--text-secondary)",
                        borderColor: "var(--glass-border)",
                        background: "var(--glass-subtle)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-4 rounded-xl border p-3 space-y-2"
                  style={{
                    background: "var(--glass-subtle)",
                    borderColor: "var(--glass-border)",
                  }}
                >
                  <div className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                    启动命令
                  </div>
                  <div className="text-xs font-mono break-all" style={{ color: "var(--text-primary)" }}>
                    {getTemplateCommandPreview(template)}
                  </div>
                  {template.setupNote ? (
                    <p className="text-[11px] leading-5" style={{ color: "var(--text-tertiary)" }}>
                      {template.setupNote}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    )
  ) : (
    /* 详情表单视图 */
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scroll relative">
      <div
        className="sticky top-0 z-10 border-b p-4 px-6 flex items-center justify-between"
        style={{
          background: "var(--glass-surface)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderColor: "var(--divider)",
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setViewMode("list")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} style={{ color: "var(--text-secondary)" }} />
        </Button>
      </div>

      <div className="p-8 pt-6 max-w-4xl mx-auto w-full space-y-8 pb-20">
        {/* Form Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {editingServer.name || "新建服务器"}
            </h2>
            <button
              type="button"
              aria-label={`删除 MCP 服务器 ${editingServer.name || "当前服务器"}`}
              className="hover:text-[var(--danger)]"
              style={{ color: "var(--danger)" }}
              onClick={() => {
                if (editingServer.id) {
                  void handleDelete(editingServer.id, editingServer.name);
                }
              }}
            >
              <HugeiconsIcon icon={Delete01Icon} size={16} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-tertiary)]">启用</span>
              <Switch 
                checked={editingServer.is_enabled} 
                onCheckedChange={(v) => setEditingServer({...editingServer, is_enabled: v})}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="h-8 px-6 rounded-xl font-medium border-0"
              style={{ background: "var(--brand-primary)", color: "white" }}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b" style={{ borderColor: "var(--divider)" }}>
          <div className="flex items-center gap-6">
            <button
              className="text-[13px] font-medium pb-3 px-1 border-b-2"
              style={{ color: "var(--brand-primary)", borderColor: "var(--brand-primary)" }}
            >
              通用
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--danger)" }} className="mr-1">*</span>名称
            </Label>
            <Input 
              value={editingServer.name || ""} 
              onChange={(e) => setEditingServer({...editingServer, name: e.target.value})}
              placeholder="例如：My Local Tools" 
              className="h-9" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>描述</Label>
            <Input 
              value={editingServer.description || ""} 
              onChange={(e) => setEditingServer({...editingServer, description: e.target.value})}
              placeholder="简单描述一下这个服务器的功能" 
              className="h-9" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              连接方式
            </Label>
            <div
              className="rounded-xl border px-3 py-3"
              style={{
                background: "var(--glass-subtle)",
                borderColor: "var(--glass-border)",
              }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                标准输入 / 输出 (stdio)
              </div>
              <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>
                当前版本仅支持本地 `stdio` 型 MCP 服务，暂不提供 SSE 连接配置。
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              <span style={{ color: "var(--danger)" }} className="mr-1">*</span>命令
            </Label>
            <Input 
              value={editingServer.command || ""} 
              onChange={(e) => setEditingServer({...editingServer, command: e.target.value})}
              placeholder="uvx, npx, node 或 可执行文件路径" 
              className="h-9 font-mono" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              参数 <span style={{ color: "var(--text-tertiary)" }} className="cursor-help opacity-50">ⓘ</span>
            </Label>
            <textarea
              value={editingServer.args || ""}
              onChange={(e) => setEditingServer({...editingServer, args: e.target.value})}
              className="flex min-h-[80px] w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-3 py-2 text-sm custom-scroll font-mono outline-none"
              style={{ background: "var(--glass-subtle)", color: "var(--text-primary)" }}
              placeholder={"arg1\narg2"}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              环境变量 <span style={{ color: "var(--text-tertiary)" }} className="cursor-help opacity-50">ⓘ</span>
            </Label>
            <textarea
              value={editingServer.env_vars || ""}
              onChange={(e) => setEditingServer({...editingServer, env_vars: e.target.value})}
              className="flex min-h-[80px] w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-3 py-2 text-sm custom-scroll font-mono placeholder:text-muted-foreground/40 outline-none"
              style={{ background: "var(--glass-subtle)", color: "var(--text-primary)" }}
              placeholder={"KEY1=value1\nKEY2=value2"}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return <SidebarLayout sidebar={sidebar} content={content} />;
}
