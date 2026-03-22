"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { ModelIcon } from "@/components/models/model-selector";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";
import type { Provider } from "@/domain/models/types";

interface ProviderSidebarProps {
  activeProviderId: string;
  filteredProviders: Provider[];
  onOpenAddProvider: () => void;
  onSearchQueryChange: (value: string) => void;
  onSelectProvider: (providerId: string) => void;
  searchQuery: string;
}

export function ProviderSidebar({
  activeProviderId,
  filteredProviders,
  onOpenAddProvider,
  onSearchQueryChange,
  onSelectProvider,
  searchQuery,
}: ProviderSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4" style={{ borderColor: "var(--divider)" }}>
        <div
          className="rounded-[20px] border px-3 py-2"
          style={{
            ...getMaterialSurfaceStyle("content", "sm"),
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%), rgba(255,255,255,0.04)",
          }}
        >
          <SearchInput
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="搜索模型平台..."
            className="border-0 bg-transparent px-0 text-xs shadow-none"
          />
        </div>
      </div>

      <div
        className="flex-1 space-y-1 overflow-y-auto px-3 py-3 custom-scroll"
        aria-label="模型平台"
        role="listbox"
      >
        {filteredProviders.map((provider) => {
          const isActive = activeProviderId === provider.id;
          return (
            <motion.button
              aria-label={provider.name}
              aria-selected={isActive}
              key={provider.id}
              onClick={() => onSelectProvider(provider.id)}
              className="material-interactive flex w-full items-center justify-between rounded-[20px] border px-3 py-3 text-sm transition-all duration-200"
              data-hover-surface={isActive ? "accent" : "content"}
              data-provider-state={isActive ? "selected" : "idle"}
              role="option"
              style={{
                ...(isActive
                  ? getMaterialSurfaceStyle("accent", "sm")
                  : getMaterialSurfaceStyle("content", "sm")),
                background: isActive
                  ? "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%), var(--material-accent-background)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%), transparent",
                borderColor: isActive ? "var(--brand-primary-border)" : "transparent",
              }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border"
                  style={{ color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}
                >
                  <ModelIcon modelName={provider.name} size={14} />
                </div>
                <div className="min-w-0 text-left">
                  <div
                    className="truncate font-medium"
                    style={{ color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}
                  >
                    {provider.name}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {provider.provider_type ?? "custom"}
                  </div>
                </div>
              </div>

              {provider.is_enabled ? (
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    borderColor: "rgba(34,197,94,0.18)",
                    color: "var(--success)",
                  }}
                >
                  已启用
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <div className="border-t px-4 py-3" style={{ borderColor: "var(--divider)" }}>
        <Button
          aria-label="添加"
          variant="outline"
          className="h-9 rounded-full border px-3 text-xs"
          style={{
            ...getMaterialSurfaceStyle("content", "sm"),
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%), rgba(255,255,255,0.04)",
          }}
          onClick={onOpenAddProvider}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" />
          添加
        </Button>
      </div>
    </div>
  );
}
