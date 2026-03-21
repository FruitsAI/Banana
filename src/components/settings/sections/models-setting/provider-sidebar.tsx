"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { ModelIcon } from "@/components/models/model-selector";
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
    <>
      <div className="p-3 border-b" style={{ borderColor: "var(--divider)" }}>
        <SearchInput
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="搜索模型平台..."
          className="text-xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scroll">
        {filteredProviders.map((provider) => {
          const isActive = activeProviderId === provider.id;
          return (
            <motion.button
              key={provider.id}
              onClick={() => onSelectProvider(provider.id)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-all duration-200 border"
              style={{
                background: isActive ? "var(--brand-primary-lighter)" : "transparent",
                borderColor: isActive ? "var(--brand-primary-border)" : "transparent",
              }}
              whileHover={{
                background: isActive ? "var(--brand-primary-light)" : "var(--glass-subtle)",
              }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-2.5">
                <ModelIcon modelName={provider.name} size={14} />
                <span
                  className="font-medium truncate max-w-[100px] text-left"
                  style={{ color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}
                >
                  {provider.name}
                </span>
              </div>
              {provider.is_enabled && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0"
                  style={{ borderColor: "var(--success)", color: "var(--success)" }}
                >
                  ON
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="p-3 border-t" style={{ borderColor: "var(--divider)" }}>
        <Button
          variant="outline"
          className="w-full justify-center h-9 rounded-xl text-xs border"
          style={{ background: "var(--glass-surface)", borderColor: "var(--glass-border)" }}
          onClick={onOpenAddProvider}
        >
          <HugeiconsIcon icon={Add01Icon} size={16} className="mr-1.5" />
          添加
        </Button>
      </div>
    </>
  );
}
