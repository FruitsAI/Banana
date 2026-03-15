"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  getMcpServers, 
  upsertMcpServer, 
  deleteMcpServer, 
  McpServer 
} from "@/lib/db";
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
import { useToast } from "@/hooks/use-toast";

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

const MCP_STAGES: McpProviderTab[] = [
  { id: "builtin", name: "MCP 服务器", icon: "box", type: "discover" },
  { id: "market", name: "市场", icon: "store", type: "discover" },
];

export function McpSetting() {
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
        getMcpServers(),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      setServers(data);
    } catch (error) {
      console.error("Failed to load MCP servers:", error);
      toast.error("加载 MCP 服务器失败");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const handleToggleEnable = async (server: McpServer, enabled: boolean) => {
    try {
      const updated = { ...server, is_enabled: enabled };
      await upsertMcpServer(updated);
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
    setEditingServer({
      id: uuidv4(),
      name: "",
      description: "",
      type: "stdio",
      command: "",
      args: "",
      env_vars: "",
      is_enabled: true
    });
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
      
      await upsertMcpServer(serverToSave);
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

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此 MCP 服务器吗？")) return;
    
    try {
      await deleteMcpServer(id);
      setServers(prev => prev.filter(s => s.id !== id));
      if (editingServer.id === id) setViewMode("list");
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
              <div 
                className="flex items-center justify-center h-8 w-8 rounded-xl border cursor-pointer hover:bg-glass-hover transition-colors"
                style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
                onClick={loadServers}
                title="刷新服务器状态"
              >
                <HugeiconsIcon icon={Refresh01Icon} size={18} className={loading ? "animate-spin" : ""} style={{ color: "var(--text-tertiary)" }} />
              </div>
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
                      <HugeiconsIcon 
                        icon={Delete01Icon} 
                        size={16} 
                        className="cursor-pointer transition-colors hover:text-[var(--danger)]" 
                        style={{ color: "var(--danger)" }} 
                        onClick={(e) => { e.stopPropagation(); handleDelete(server.id); }}
                      />
                      <HugeiconsIcon 
                        icon={Settings01Icon} 
                        size={16} 
                        className="cursor-pointer hover:text-[var(--brand-primary)]" 
                        style={{ color: "var(--text-tertiary)" }} 
                        onClick={() => handleEdit(server)}
                      />
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
      <div className="flex-1 flex items-center justify-center p-6 text-[var(--text-tertiary)]">
        市场功能开发中...
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
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border px-3 rounded-lg"
              style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
            >
              日志
            </Button>
            <HugeiconsIcon 
              icon={Delete01Icon} 
              size={16} 
              className="cursor-pointer hover:text-[var(--danger)]" 
              style={{ color: "var(--danger)" }} 
              onClick={() => editingServer.id && handleDelete(editingServer.id)}
            />
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
              <span style={{ color: "var(--danger)" }} className="mr-1">*</span>类型
            </Label>
            <div className="relative">
              <select 
                value={editingServer.type || "stdio"}
                onChange={(e) => setEditingServer({...editingServer, type: e.target.value})}
                className="w-full h-9 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-3 py-1 text-sm appearance-none outline-none"
                style={{ color: "var(--text-primary)" }}
              >
                <option value="stdio">标准输入 / 输出 (stdio)</option>
                <option value="sse">SSE</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", opacity: 0.5 }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
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

          <div className="flex items-center gap-3 pt-2">
            <Label className="text-[13px] font-medium flex items-center gap-1.5 cursor-pointer" style={{ color: "var(--text-primary)" }}>
              长时间运行模式 <span style={{ color: "var(--text-tertiary)" }} className="cursor-help opacity-50">ⓘ</span> :
            </Label>
            <Switch />
          </div>
        </div>
      </div>
    </div>
  );

  return <SidebarLayout sidebar={sidebar} content={content} />;
}
