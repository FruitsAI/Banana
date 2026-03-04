"use client";

import { useEffect, useState } from "react";
import { getConfig, setConfig } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, EyeOff, Settings2, Settings, ChevronDown } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  isInitial?: boolean; // mark if it's the one we track persistently matching the old layout 
}

const mockProviders: Provider[] = [
  { id: "openai", name: "OpenAI", icon: "O", enabled: true, isInitial: true },
  { id: "nvidia", name: "NVIDIA", icon: "N", enabled: true },
  { id: "octopus", name: "octopus", icon: "o", enabled: true },
  { id: "antiapi", name: "AntiAPI", icon: "A", enabled: true },
  { id: "cherryin", name: "CherryIN", icon: "IN", enabled: true },
  { id: "openrouter", name: "OpenRouter", icon: "O", enabled: true },
  { id: "b4u", name: "b4u", icon: "b", enabled: true },
  { id: "silliconflow", name: "硅基流动", icon: "SF", enabled: true },
];

/**
 * 模型服务配置页 (ModelsSetting)
 * @description 管理全局可用 AI 提供商（如 OpenAI, 阿里云等）的密钥、Base URL 及可用大模型列表映射的配置面板。采用左栏多供给商导航，右栏参数填报的双列布局风格。
 */
export function ModelsSetting() {
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProviderId, setActiveProviderId] = useState("nvidia");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const dbBaseUrl = await getConfig("openai_base_url");
      const dbApiKey = await getConfig("openai_api_key");
      if (dbBaseUrl) setBaseUrl(dbBaseUrl);
      if (dbApiKey) setApiKey(dbApiKey);
    } catch (error) {
      console.error("Failed to load models config:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await setConfig("openai_base_url", baseUrl);
      await setConfig("openai_api_key", apiKey);
    } catch (error) {
      console.error("Failed to save models config:", error);
    } finally {
      setSaving(false);
    }
  };

  const activeProvider = mockProviders.find((p) => p.id === activeProviderId) || mockProviders[0];
  const filteredProviders = mockProviders.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full">
      {/* 侧边模型厂商列表区 */}
      <div className="w-64 border-r flex flex-col h-full bg-background/50">
        {/* 搜索框 */}
        <div className="p-3 border-b">
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模型平台..."
              className="pl-3 pr-8 py-1.5 h-8 bg-background border-muted-foreground/20 rounded-full text-xs shadow-none"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        
        {/* 厂商列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scroll">
          {filteredProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setActiveProviderId(provider.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all duration-300 ${
                activeProviderId === provider.id
                  ? "bg-pink-500/15 text-pink-700 dark:bg-pink-500/25 dark:text-pink-300 font-semibold shadow-sm border border-pink-500/20"
                  : "hover:bg-muted/50 font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                    provider.id === 'nvidia' ? 'bg-[#76B900]' :
                    provider.id === 'octopus' ? 'bg-[#3E5CDB]' :
                    provider.id === 'antiapi' ? 'bg-[#4B3B6F]' :
                    provider.id === 'cherryin' ? 'bg-[#FF4F64]' :
                    provider.id === 'openai' ? 'bg-[#10A37F]' : 'bg-primary'
                  }`}
                >
                  {provider.icon}
                </div>
                <span className="font-medium truncate max-w-[100px] text-left">{provider.name}</span>
              </div>
              
              <div className="flex items-center">
                {provider.enabled && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#4ADE80] text-[#4ADE80] shrink-0">
                    ON
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        
        {/* 底部添加按钮 */}
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full justify-center h-8 rounded-full border-muted-foreground/20 text-xs shadow-none bg-background">
            <Plus className="w-3.5 h-3.5 mr-1" />
            添加
          </Button>
        </div>
      </div>

      {/* 右侧详情配置区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* 头部标题与开关 */}
        <div className="flex items-center justify-between px-8 py-6 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{activeProvider.name}</h2>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
          <Switch checked={activeProvider.enabled} />
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-8 custom-scroll">
          
          {/* API 密钥 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-[13px] flex items-center gap-1.5">
                API 密钥
              </Label>
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <Input
                  type="password"
                  value={activeProvider.isInitial ? apiKey : "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
                  onChange={(e) => { if (activeProvider.isInitial) setApiKey(e.target.value) }}
                  className="font-mono text-xs pr-10 focus-visible:ring-1"
                />
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
              <Button variant="outline" className="px-4 shrink-0 shadow-none">检测</Button>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground">多个密钥使用逗号分隔</span>
            </div>
          </div>

          {/* API 地址 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-[13px] flex items-center gap-1.5">
                API 地址 <span className="text-[10px] text-muted-foreground border rounded-sm px-1 leading-none inline-block pb-px">↕</span> <span className="text-muted-foreground cursor-help">ⓘ</span>
              </Label>
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input
              value={activeProvider.isInitial ? baseUrl : "https://integrate.api.nvidia.com/v1"}
              onChange={(e) => { if (activeProvider.isInitial) setBaseUrl(e.target.value) }}
              className="font-mono text-xs focus-visible:ring-1"
            />
            <div>
              <span className="text-[11px] text-muted-foreground flex gap-2">
                <span>预览:</span>
                <span className="truncate opacity-50">
                  {activeProvider.isInitial ? baseUrl : "https://integrate.api.nvidia.com/v1"}/chat/completions
                </span>
              </span>
            </div>
            
            {activeProvider.isInitial && (
              <div className="pt-2">
                 <Button onClick={handleSave} disabled={saving} size="sm" className="h-8">
                  {saving ? "保存中..." : "保存专属配置"}
                </Button>
              </div>
            )}
          </div>

          {/* 模型列表折叠 */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="font-semibold text-[13px]">模型</Label>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">4</span>
                <Search className="w-3.5 h-3.5 text-muted-foreground ml-1" />
              </div>
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="rounded-lg border bg-muted/20 overflow-hidden divide-y">
              {/* Accordion Group 1 */}
              <div className="bg-pink-500/5 dark:bg-pink-500/10 border-b border-border/50">
                <button className="w-full flex items-center gap-2 p-3 hover:bg-pink-500/10 dark:hover:bg-pink-500/20 text-sm font-medium transition-colors">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  minimaxai
                </button>
                <div className="flex items-center justify-between p-3 pl-8 bg-background">
                   <div className="flex items-center gap-3">
                     <div className="w-6 h-6 rounded-full bg-[#FF4F64] flex items-center justify-center shrink-0">
                       <span className="text-[10px] font-bold text-white">|||</span>
                     </div>
                     <span className="text-sm">minimaxai/minimax-m2.1</span>
                     <div className="flex gap-1 ml-2">
                       <span className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-100/50 text-blue-500">☼</span>
                       <span className="w-5 h-5 flex items-center justify-center rounded-sm bg-orange-100/50 text-orange-500">🔧</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 text-muted-foreground">
                      <Settings className="w-4 h-4 cursor-pointer hover:text-foreground" />
                      <span>–</span>
                   </div>
                </div>
              </div>

               {/* Accordion Group 2 */}
              <div className="bg-pink-500/5 dark:bg-pink-500/10 border-b border-border/50">
                <button className="w-full flex items-center gap-2 p-3 hover:bg-pink-500/10 dark:hover:bg-pink-500/20 text-sm font-medium transition-colors">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  moonshotai
                </button>
                <div className="flex items-center justify-between p-3 pl-8 bg-background">
                   <div className="flex items-center gap-3">
                     <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center shrink-0">
                       <span className="text-xs font-bold text-white">K</span>
                     </div>
                     <span className="text-sm">moonshotai/kimi-k2.5</span>
                     <div className="flex gap-1 ml-2">
                       <span className="w-5 h-5 flex items-center justify-center rounded-sm bg-green-100/50 text-green-500">👁</span>
                       <span className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-100/50 text-blue-500">☼</span>
                       <span className="w-5 h-5 flex items-center justify-center rounded-sm bg-orange-100/50 text-orange-500">🔧</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 text-muted-foreground">
                      <Settings className="w-4 h-4 cursor-pointer hover:text-foreground" />
                      <span>–</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-4">
              <Button size="sm" className="bg-[#DE7E5D] hover:bg-[#D07050] text-white rounded-md h-8 text-xs font-medium px-4">
                <span className="mr-1.5 leading-none mt-px">☰</span> 管理
              </Button>
              <Button variant="outline" size="sm" className="h-8 rounded-md text-xs bg-background shadow-none px-4">
                <Plus className="w-3 h-3 mr-1" /> 添加
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
