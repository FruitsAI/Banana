"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getConfig, setConfig } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Add01Icon, Edit03Icon, CheckmarkCircle02Icon, Delete01Icon, Settings01Icon, McpServerIcon, Store01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";

/**
 * McpSetting 组件 (MCP 服务器设置)
 * @description 
 *   管理 Model Context Protocol (MCP) 服务器的配置。
 *   采用类似 macOS 系统的双栏设置界面（左侧提供商列表/分类，右侧具体配置项）。
 *   MCP 允许 AI 模型与本地或远程工具/数据源进行交互，此处配置其连接方式。
 * @example
 * <McpSetting />
 */

interface McpProvider {
  id: string;
  name: string;
  icon: string;
  type: "discover" | "provider";
}

const mockMcpCategories: McpProvider[] = [
  { id: "builtin", name: "MCP 服务器", icon: "box", type: "discover" },
  { id: "market", name: "市场", icon: "store", type: "discover" },
];


/**
 * McpSetting 主组件
 * @description 采用苹果系统偏好设置的风格，统一视觉体验。左侧为导航，右侧为具体的系统级配置表单。
 */
export function McpSetting() {
  const [mcpCommand, setMcpCommand] = useState("npx");
  const [mcpArgs, setMcpArgs] = useState("-y @modelcontextprotocol/server-everything");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeCategoryId, setActiveCategoryId] = useState("builtin");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const dbMcpCmd = await getConfig("mcp_command");
      const dbMcpArgs = await getConfig("mcp_args");
      if (dbMcpCmd) setMcpCommand(dbMcpCmd);
      if (dbMcpArgs) setMcpArgs(dbMcpArgs);
    } catch (error) {
      console.error("Failed to load mcp config:", error);
    }
  };

  // 保存 MCP 启动命令和参数至本地数据库
  // 为什么：MCP 服务器通常需要依靠系统级命令启动（如 npx 或 uvx），需将用户的输入持久化以便主应用随时调用。
  const handleSave = async () => {
    try {
      setSaving(true);
      await setConfig("mcp_command", mcpCommand);
      await setConfig("mcp_args", mcpArgs);
    } catch (error) {
      console.error("Failed to save mcp config:", error);
    } finally {
      setSaving(false);
    }
  };

  const discoverCategories = mockMcpCategories;

  return (
    <div className="flex h-full w-full">
      {/* 侧边分类区 */}
      <div
        className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full border-r"
        style={{
          background: 'var(--bg-sidebar)',
          borderColor: 'var(--divider)',
        }}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scroll">
          {/* MCP 服务器列表 */}
          <div>
            <div className="space-y-0.5">
              {discoverCategories.map((cat) => {
                const isActive = activeCategoryId === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => { setActiveCategoryId(cat.id); setViewMode("list"); }}
                    className="w-full flex items-center p-2.5 rounded-xl text-sm transition-all duration-200 border"
                    style={{
                      background: isActive ? 'var(--brand-primary-lighter)' : 'transparent',
                      borderColor: isActive ? 'var(--brand-primary-border)' : 'transparent',
                      color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    }}
                    whileHover={{
                      background: isActive ? 'var(--brand-primary-light)' : 'var(--glass-subtle)',
                    }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {cat.icon === "box" ? (
                      <HugeiconsIcon icon={McpServerIcon} size={16} className="mr-3" style={{ color: isActive ? 'var(--brand-primary)' : 'var(--text-tertiary)' }} />
                    ) : (
                      <HugeiconsIcon icon={Store01Icon} size={16} className="mr-3" style={{ color: isActive ? 'var(--brand-primary)' : 'var(--text-tertiary)' }} />
                    )}
                    <span className="font-medium">{cat.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>


        </div>
      </div>

      {/* 右侧工作区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {viewMode === "list" ? (
          /* 列表视图 */
          <div className="flex-1 flex flex-col h-full p-6">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    MCP 服务器
                  </h2>
                  <HugeiconsIcon icon={Search01Icon} size={16} className="cursor-pointer" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} style={{ color: 'var(--success)' }} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl px-4 text-xs font-medium border"
                    style={{
                      background: 'var(--glass-surface)',
                      borderColor: 'var(--glass-border)',
                    }}
                  >
                    <HugeiconsIcon icon={Edit03Icon} size={14} className="mr-1.5" /> 编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl px-4 text-xs font-medium border"
                    style={{
                      background: 'var(--glass-surface)',
                      borderColor: 'var(--glass-border)',
                    }}
                    onClick={() => setViewMode("detail")}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1" /> 添加
                  </Button>
                </div>
              </div>

              {/* Server Card List */}
              <div className="space-y-4">
                <div
                  className="rounded-xl p-5 border"
                  style={{
                    background: 'var(--glass-surface)',
                    borderColor: 'var(--glass-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-base font-semibold cursor-pointer hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={() => setViewMode("detail")}
                    >
                      mcp-router
                    </h3>
                    <div className="flex items-center gap-4">
                      <Switch defaultChecked={true} />
                      <HugeiconsIcon icon={Delete01Icon} size={16} className="cursor-pointer" style={{ color: 'var(--danger)' }} />
                      <HugeiconsIcon icon={Settings01Icon} size={16} className="cursor-pointer" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <span
                      className="text-[10px] flex items-center justify-center text-white px-2 py-[2px] rounded-full font-mono font-medium"
                      style={{ background: 'var(--brand-primary)' }}
                    >
                      0.2.0
                    </span>
                    <span
                      className="text-[10px] flex items-center justify-center px-2 py-[2px] rounded-full font-mono font-medium border"
                      style={{
                        borderColor: 'var(--brand-primary)',
                        color: 'var(--brand-primary)',
                        background: 'var(--brand-primary-lightest)',
                      }}
                    >
                      STDIO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 详情表单视图 */
          <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scroll relative">
            <div
              className="sticky top-0 z-10 border-b p-4 px-6 flex items-center justify-between"
              style={{
                background: 'var(--glass-surface)',
                backdropFilter: 'blur(20px) saturate(180%)',
                borderColor: 'var(--divider)',
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setViewMode("list")}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} style={{ color: 'var(--text-secondary)' }} />
              </Button>
            </div>

            <div className="p-8 pt-6 max-w-4xl mx-auto w-full space-y-8">
              {/* Form Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>MCP 服务器</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border px-3 rounded-lg"
                    style={{
                      background: 'var(--glass-surface)',
                      borderColor: 'var(--glass-border)',
                    }}
                  >
                    日志
                  </Button>
                  <HugeiconsIcon icon={Delete01Icon} size={16} className="cursor-pointer" style={{ color: 'var(--danger)' }} />
                </div>
                <div className="flex items-center gap-4">
                  <Switch defaultChecked={true} />
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className="h-8 px-6 rounded-xl font-medium border-0"
                  >
                    {saving ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b" style={{ borderColor: 'var(--divider)' }}>
                <div className="flex items-center gap-6">
                  <button
                    className="text-[13px] font-medium pb-3 px-1 border-b-2"
                    style={{
                      color: 'var(--brand-primary)',
                      borderColor: 'var(--brand-primary)',
                    }}
                  >
                    通用
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--danger)' }} className="mr-1">*</span>名称
                  </Label>
                  <Input defaultValue="MCP 服务器" className="h-9" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>描述</Label>
                  <Input placeholder="描述" className="h-9" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--danger)' }} className="mr-1">*</span>类型
                  </Label>
                  <div className="relative">
                    <select className="w-full h-9 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-3 py-1 text-sm appearance-none">
                      <option>标准输入 / 输出 (stdio)</option>
                      <option>SSE</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--danger)' }} className="mr-1">*</span>命令
                  </Label>
                  <Input value={mcpCommand} onChange={(e) => setMcpCommand(e.target.value)} placeholder="uvx or npx" className="h-9" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    参数 <span style={{ color: 'var(--text-tertiary)' }} className="cursor-help opacity-50">ⓘ</span>
                  </Label>
                  <textarea
                    value={mcpArgs}
                    onChange={(e) => setMcpArgs(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-3 py-2 text-sm custom-scroll font-mono"
                    placeholder="arg1&#10;arg2"
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    环境变量 <span style={{ color: 'var(--text-tertiary)' }} className="cursor-help opacity-50">ⓘ</span>
                  </Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-3 py-2 text-sm custom-scroll font-mono placeholder:text-muted-foreground/40"
                    placeholder="KEY1=value1&#10;KEY2=value2"
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Label className="text-[13px] font-medium flex items-center gap-1.5 cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                    长时间运行模式 <span style={{ color: 'var(--text-tertiary)' }} className="cursor-help opacity-50">ⓘ</span> :
                  </Label>
                  <Switch />
                </div>
              </div>
              <div className="h-8"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
