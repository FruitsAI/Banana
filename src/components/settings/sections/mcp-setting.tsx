"use client";

import { useEffect, useState } from "react";
import { getConfig, setConfig } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Edit2, CheckCircle2, Trash2, Settings2, Box, Store, ArrowLeft } from "lucide-react";

interface McpProvider {
  id: string;
  name: string;
  icon: string;
  type: "discover" | "provider";
}

const mockMcpCategories: McpProvider[] = [
  { id: "builtin", name: "内置服务器", icon: "box", type: "discover" },
  { id: "market", name: "市场", icon: "store", type: "discover" },
];

const mockMcpProviders: McpProvider[] = [
  { id: "aliyun", name: "阿里云百炼", icon: "ali", type: "provider" },
  { id: "modelscope", name: "ModelScope", icon: "ms", type: "provider" },
  { id: "tokenflux", name: "TokenFlux", icon: "tf", type: "provider" },
  { id: "lankj", name: "蓝耘科技", icon: "lk", type: "provider" },
  { id: "302ai", name: "302.AI", icon: "3a", type: "provider" },
  { id: "mcprouter", name: "MCP Router", icon: "mr", type: "provider" },
];

/**
 * MCP 服务器控制台 (McpSetting)
 * @description 管理 Model Context Protocol (MCP) 服务器命令或指令的添加和配置体系。
 * 在内部实现了发现/服务商导航菜单，并包含了由 `list` 和 `detail` 组成的双态 UI 切换模式（大纲展示 / 具体表单变更）。
 */
export function McpSetting() {
  const [mcpCommand, setMcpCommand] = useState("npx");
  const [mcpArgs, setMcpArgs] = useState("-y @modelcontextprotocol/server-everything");
  const [saving, setSaving] = useState(false);

  // New states for UI views
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
  const providerCategories = mockMcpProviders;

  return (
    <div className="flex h-full w-full">
      {/* 侧边分类区 */}
      <div className="w-64 border-r flex flex-col h-full bg-background/50">
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
          
          {/* 发现 */}
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-3 px-2 flex items-center">
               <span>发现</span>
               <div className="h-px bg-border flex-1 ml-3"></div>
            </div>
            <div className="space-y-0.5">
              {discoverCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategoryId(cat.id); setViewMode("list"); }}
                  className={`w-full flex items-center p-2.5 rounded-lg text-sm transition-colors ${
                    activeCategoryId === cat.id ? "bg-[#DFD9CE] text-foreground dark:bg-primary/20" : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {cat.icon === "box" ? <Box className="w-4 h-4 mr-3" /> : <Store className="w-4 h-4 mr-3" />}
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 提供商 */}
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-3 px-2 flex items-center">
               <span>提供商</span>
               <div className="h-px bg-border flex-1 ml-3"></div>
            </div>
            <div className="space-y-0.5">
              {providerCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategoryId(cat.id); setViewMode("list"); }}
                  className={`w-full flex items-center p-2.5 rounded-lg text-sm transition-colors ${
                    activeCategoryId === cat.id ? "bg-[#DFD9CE] text-foreground dark:bg-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 text-[10px] text-white font-bold bg-primary`}>
                    {cat.icon.toUpperCase()}
                  </div>
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 右侧工作区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        
        {viewMode === "list" ? (
          /* 列表视图 */
          <div className="flex-1 flex flex-col h-full p-8 pt-6">
            <div className="flex flex-col gap-6">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    MCP 服务器
                    <Search className="w-4 h-4 text-muted-foreground cursor-pointer" />
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <Button variant="outline" size="sm" className="h-8 rounded-full border-muted-foreground/30 px-4 text-xs font-medium bg-background shadow-none">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> 编辑
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-full border-muted-foreground/30 px-4 text-xs font-medium bg-background shadow-none" onClick={() => setViewMode("detail")}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> 添加
                  </Button>
                </div>
              </div>

              {/* Server Card List */}
              <div className="space-y-4">
                <div className="border bg-card rounded-xl p-5 shadow-sm">
                   <div className="flex items-center justify-between">
                     <h3 className="text-base font-semibold cursor-pointer hover:underline" onClick={() => setViewMode("detail")}>
                       mcp-router
                     </h3>
                     <div className="flex items-center gap-4">
                        <Switch defaultChecked={true} />
                        <Trash2 className="w-4 h-4 text-red-500/70 hover:text-red-500 cursor-pointer" />
                        <Settings2 className="w-4 h-4 text-muted-foreground cursor-pointer" />
                     </div>
                   </div>
                   <div className="flex gap-2 mt-6">
                     <span className="text-[10px] flex items-center justify-center bg-[#2094F3] text-white px-2 py-[2px] rounded-full font-mono font-medium">0.2.0</span>
                     <span className="text-[10px] flex items-center justify-center border border-[#2094F3]/30 text-[#2094F3] px-2 py-[2px] rounded-full font-mono font-medium bg-[#2094F3]/5">STDIO</span>
                   </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* 详情表单视图 */
          <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scroll relative">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b p-4 px-6 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setViewMode("list")}>
                   <ArrowLeft className="w-4 h-4" />
                 </Button>
               </div>
            </div>

            <div className="p-8 pt-6 max-w-4xl mx-auto w-full space-y-8">
              {/* Form Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold">MCP 服务器</h2>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-muted-foreground/30 shadow-none px-3 bg-background">日志</Button>
                  <Trash2 className="w-4 h-4 text-red-500 cursor-pointer" />
                </div>
                <div className="flex items-center gap-4">
                  <Switch defaultChecked={true} />
                  <Button onClick={handleSave} disabled={saving} variant="secondary" size="sm" className="h-8 px-6 rounded-md shadow-none font-medium">
                    <span className="mr-1.5 opacity-50">💾</span> {saving ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>

              {/* Navigation Tabs (simulation) */}
              <div className="border-b">
                <div className="flex items-center gap-6">
                  <button className="text-[13px] font-medium text-[#DE7E5D] border-b-2 border-[#DE7E5D] pb-3 px-1">
                    通用
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-muted-foreground"><span className="text-red-500 mr-1">*</span>名称</Label>
                  <Input defaultValue="MCP 服务器" className="h-9 shadow-none bg-background focus-visible:ring-1" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-foreground">描述</Label>
                  <Input placeholder="描述" className="h-9 shadow-none bg-background focus-visible:ring-1" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-foreground"><span className="text-red-500 mr-1">*</span>类型</Label>
                  <div className="relative">
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                      <option>标准输入 / 输出 (stdio)</option>
                      <option>SSE</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-50"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-foreground"><span className="text-red-500 mr-1">*</span>命令</Label>
                  <Input value={mcpCommand} onChange={(e) => setMcpCommand(e.target.value)} placeholder="uvx or npx" className="h-9 shadow-none bg-background focus-visible:ring-1" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                    参数 <span className="text-muted-foreground cursor-help opacity-50">ⓘ</span>
                  </Label>
                  <textarea 
                    value={mcpArgs} 
                    onChange={(e) => setMcpArgs(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring custom-scroll font-mono"
                    placeholder="arg1&#10;arg2"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                    环境变量 <span className="text-muted-foreground cursor-help opacity-50">ⓘ</span>
                  </Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring custom-scroll font-mono placeholder:text-muted-foreground/40"
                    placeholder="KEY1=value1&#10;KEY2=value2"
                  />
                </div>

                 <div className="flex items-center gap-3 pt-2">
                  <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                    长时间运行模式 <span className="text-muted-foreground cursor-help opacity-50">ⓘ</span> :
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
