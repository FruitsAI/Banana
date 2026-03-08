"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getConfig, setConfig } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Add01Icon, ViewIcon, ViewOffIcon, Settings01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";

/**
 * ModelsSetting 组件 (大模型配置)
 * @description 
 *   AI 模型提供商的设置页面，集成了所有支持的大语言模型 (LLM) 平台。
 *   允许用户分别管理不同厂商的 API 密钥 (API Key) 和 自定义接口地址 (Base URL)。
 * @example
 * <ModelsSetting />
 */

interface Provider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  isInitial?: boolean;
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
 * ModelsSetting 主组件
 * @description 采用类似系统偏好设置的界面风格，方便用户在多个 AI 平台之间进行凭证切换、输入与动态过滤。
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

  // 保存大模型的配置（API Key 和 Base URL）
  // 为什么：这涉及用户个人的算力或服务凭证，必须能够持久化保存以便用于接下来的聊天交互。
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
      <div
        className="w-60 sm:w-64 lg:w-72 flex-shrink-0 flex flex-col h-full border-r"
        style={{
          background: 'var(--bg-sidebar)',
          borderColor: 'var(--divider)',
        }}
      >
        {/* 搜索框 */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--divider)' }}>
          <div className="relative">
            <div
              className="search flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{
                background: 'var(--glass-surface)',
                borderColor: 'var(--glass-border)',
              }}
            >
              <HugeiconsIcon icon={Search01Icon} size={16} className="flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模型平台..."
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: 'var(--text-primary)' }}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
              />
            </div>
          </div>
        </div>

        {/* 厂商列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scroll">
          {filteredProviders.map((provider) => {
            const isActive = activeProviderId === provider.id;
            return (
              <motion.button
                key={provider.id}
                onClick={() => setActiveProviderId(provider.id)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-all duration-200 border"
                style={{
                  background: isActive ? 'var(--brand-primary-lighter)' : 'transparent',
                  borderColor: isActive ? 'var(--brand-primary-border)' : 'transparent',
                }}
                whileHover={{
                  background: isActive ? 'var(--brand-primary-light)' : 'var(--glass-subtle)',
                }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      background: provider.id === 'nvidia' ? '#76B900' :
                        provider.id === 'octopus' ? '#3E5CDB' :
                        provider.id === 'antiapi' ? '#4B3B6F' :
                        provider.id === 'cherryin' ? '#FF4F64' :
                        provider.id === 'openai' ? '#10A37F' : 'var(--brand-primary)',
                    }}
                  >
                    {provider.icon}
                  </div>
                  <span
                    className="font-medium truncate max-w-[100px] text-left"
                    style={{ color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)' }}
                  >
                    {provider.name}
                  </span>
                </div>

                {provider.enabled && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0"
                    style={{
                      borderColor: 'var(--success)',
                      color: 'var(--success)',
                    }}
                  >
                    ON
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 底部添加按钮 */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--divider)' }}>
          <Button
            variant="outline"
            className="w-full justify-center h-9 rounded-xl text-xs border"
            style={{
              background: 'var(--glass-surface)',
              borderColor: 'var(--glass-border)',
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={16} className="mr-1.5" />
            添加
          </Button>
        </div>
      </div>

      {/* 右侧详情配置区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {/* 头部标题与开关 */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--divider)' }}>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {activeProvider.name}
            </h2>
            <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <Switch checked={activeProvider.enabled} />
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scroll">

          {/* API 密钥 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>
                API 密钥
              </Label>
              <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <Input
                  type="password"
                  value={activeProvider.isInitial ? apiKey : "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
                  onChange={(e) => { if (activeProvider.isInitial) setApiKey(e.target.value) }}
                  className="font-mono text-xs pr-10"
                />
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
                  <HugeiconsIcon icon={ViewIcon} size={16} />
                </button>
              </div>
              <Button
                variant="outline"
                className="px-4 shrink-0 h-10 rounded-xl border"
                style={{
                  background: 'var(--glass-surface)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                检测
              </Button>
            </div>
            <div className="text-right">
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                多个密钥使用逗号分隔
              </span>
            </div>
          </div>

          {/* API 地址 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-[13px] flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                API 地址
                <span className="text-[10px] px-1 py-0.5 rounded border" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-tertiary)' }}>↕</span>
                <span style={{ color: 'var(--text-tertiary)' }}>ⓘ</span>
              </Label>
              <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <Input
              value={activeProvider.isInitial ? baseUrl : "https://integrate.api.nvidia.com/v1"}
              onChange={(e) => { if (activeProvider.isInitial) setBaseUrl(e.target.value) }}
              className="font-mono text-xs"
            />
            <div>
              <span className="text-[11px] flex gap-2" style={{ color: 'var(--text-tertiary)' }}>
                <span>预览:</span>
                <span className="truncate opacity-50">
                  {activeProvider.isInitial ? baseUrl : "https://integrate.api.nvidia.com/v1"}/chat/completions
                </span>
              </span>
            </div>

            {activeProvider.isInitial && (
              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="h-9 rounded-xl px-4"
                >
                  {saving ? "保存中..." : "保存专属配置"}
                </Button>
              </div>
            )}
          </div>

          {/* 模型列表折叠 */}
          <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>模型</Label>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--glass-subtle)', color: 'var(--text-tertiary)' }}
                >
                  4
                </span>
                <HugeiconsIcon icon={Search01Icon} size={14} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: 'var(--text-tertiary)' }} />
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'var(--glass-surface)',
                border: '1px solid var(--glass-border)',
              }}
            >
              {/* Accordion Group 1 */}
              <div style={{ borderBottom: '1px solid var(--divider)' }}>
                <button
                  className="w-full flex items-center gap-2 p-3 text-sm font-medium transition-colors"
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    color: 'var(--brand-primary)',
                  }}
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} style={{ color: 'var(--brand-primary)' }} />
                  minimaxai
                </button>
                <div
                  className="flex items-center justify-between p-3 pl-8"
                  style={{ background: 'var(--bg-primary)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FF4F64' }}>
                      <span className="text-[10px] font-bold text-white">|||</span>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>minimaxai/minimax-m2.1</span>
                    <div className="flex gap-1">
                      <span className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)' }}>☼</span>
                      <span className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>🔧</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>
                    <HugeiconsIcon icon={Settings01Icon} size={16} className="cursor-pointer hover:text-foreground" />
                    <span>–</span>
                  </div>
                </div>
              </div>

              {/* Accordion Group 2 */}
              <div>
                <button
                  className="w-full flex items-center gap-2 p-3 text-sm font-medium transition-colors"
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    color: 'var(--brand-primary)',
                  }}
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} style={{ color: 'var(--brand-primary)' }} />
                  moonshotai
                </button>
                <div
                  className="flex items-center justify-between p-3 pl-8"
                  style={{ background: 'var(--bg-primary)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#000' }}>
                      <span className="text-xs font-bold text-white">K</span>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>moonshotai/kimi-k2.5</span>
                    <div className="flex gap-1">
                      <span className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ background: 'rgba(52, 199, 89, 0.1)', color: 'var(--success)' }}>👁</span>
                      <span className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)' }}>☼</span>
                      <span className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>🔧</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>
                    <HugeiconsIcon icon={Settings01Icon} size={16} className="cursor-pointer hover:text-foreground" />
                    <span>–</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                size="sm"
                className="h-9 rounded-xl text-xs font-medium px-4 border-0"
                style={{
                  background: 'var(--brand-primary)',
                  color: '#fff',
                }}
              >
                <span className="mr-1.5">☰</span> 管理
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs px-4 border"
                style={{
                  background: 'var(--glass-surface)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" /> 添加
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
