import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  PencilEdit01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { getMaterialSurfaceStyle } from "@/components/ui/material-surface";

interface MessageToolbarProps {
  ownerId: string;
  canEdit?: boolean;
  align?: "left" | "right";
  onRegenerate: () => void;
  onEdit?: () => void;
  onCopy: () => void;
}

export function MessageToolbar({
  ownerId,
  canEdit = false,
  align = "left",
  onRegenerate,
  onEdit,
  onCopy,
}: MessageToolbarProps) {
  return (
    <div
      className={cn(
        "message-toolbar mt-3 flex w-fit max-w-full items-center gap-1.5 rounded-full border px-1.5 py-1.5 transition-all duration-300",
        align === "right" ? "ml-auto" : "mr-auto",
      )}
      aria-label="消息操作"
      data-material-role="floating"
      data-testid="message-toolbar"
      data-toolbar-owner={ownerId}
      data-toolbar-visibility="persistent"
      role="toolbar"
      style={{ ...getMaterialSurfaceStyle("floating", "sm") }}
    >
      <button
        aria-label="重新生成"
        onClick={onRegenerate}
        className="material-interactive flex h-7 w-7 items-center justify-center rounded-full transition-colors"
        data-hover-surface="content"
        title="重新生成"
        type="button"
      >
        <HugeiconsIcon icon={Refresh01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
      </button>
      {canEdit ? (
        <button
          aria-label="编辑"
          onClick={onEdit}
          className="material-interactive flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          data-hover-surface="content"
          title="编辑"
          type="button"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
        </button>
      ) : null}
      <button
        aria-label="复制"
        onClick={onCopy}
        className="material-interactive flex h-7 w-7 items-center justify-center rounded-full transition-colors"
        data-hover-surface="content"
        title="复制"
        type="button"
      >
        <HugeiconsIcon icon={Copy01Icon} size={14} style={{ color: "var(--text-tertiary)" }} />
      </button>
    </div>
  );
}
