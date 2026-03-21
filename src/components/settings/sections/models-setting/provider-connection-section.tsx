"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveProviderApiSuffix } from "@/config/providers";
import type { Provider } from "@/domain/models/types";

interface ProviderConnectionSectionProps {
  activeProvider: Provider | null;
  apiKey: string;
  baseUrl: string;
  isTesting: boolean;
  saving: boolean;
  showApiKey: boolean;
  onApiKeyChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onTestConnection: () => void;
  onToggleShowApiKey: () => void;
}

export function ProviderConnectionSection({
  activeProvider,
  apiKey,
  baseUrl,
  isTesting,
  saving,
  showApiKey,
  onApiKeyChange,
  onBaseUrlChange,
  onTestConnection,
  onToggleShowApiKey,
}: ProviderConnectionSectionProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>
            API 密钥
          </Label>
          <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
        </div>
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => onApiKeyChange(event.target.value)}
              className="font-mono text-xs pr-10"
              placeholder="请输入 API Key"
            />
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="切换 API Key 显示状态"
              onClick={onToggleShowApiKey}
            >
              <HugeiconsIcon icon={showApiKey ? ViewOffIcon : ViewIcon} size={16} />
            </button>
          </div>
          <Button
            variant="outline"
            className="px-4 shrink-0 h-10 rounded-xl border"
            style={{
              background: "var(--glass-surface)",
              borderColor: "var(--glass-border)",
            }}
            onClick={onTestConnection}
            disabled={isTesting || saving || !activeProvider}
          >
            {isTesting ? "检测中..." : "检测"}
          </Button>
        </div>
        <div className="text-right">
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            多个密钥使用逗号分隔
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label
            className="font-semibold text-[13px] flex items-center gap-1.5"
            style={{ color: "var(--text-primary)" }}
          >
            API 地址
            <span
              className="text-[10px] px-1 py-0.5 rounded border"
              style={{ borderColor: "var(--glass-border)", color: "var(--text-tertiary)" }}
            >
              ↕
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>ⓘ</span>
          </Label>
          <HugeiconsIcon icon={Settings01Icon} size={16} style={{ color: "var(--text-tertiary)" }} />
        </div>
        <Input
          value={baseUrl}
          onChange={(event) => onBaseUrlChange(event.target.value)}
          className="font-mono text-xs"
        />
        <div>
          <span className="text-[11px] flex gap-2" style={{ color: "var(--text-tertiary)" }}>
            <span>预览:</span>
            <span className="truncate opacity-50">
              {baseUrl.trim()
                ? `${baseUrl.trim()}${resolveProviderApiSuffix(activeProvider?.provider_type)}`
                : "请先填写 API 地址"}
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
