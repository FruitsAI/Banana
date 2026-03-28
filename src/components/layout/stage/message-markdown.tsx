/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  startTransition,
  useEffect,
  useId,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import mermaid from "mermaid";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { codeToHtml } from "shiki";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MARKDOWN_BASE_URL = "https://banana.local/";
const CODE_COLLAPSE_LINE_THRESHOLD = 10;
const IMAGE_PREVIEW_MIN_SCALE = 1;
const IMAGE_PREVIEW_MAX_SCALE = 4;
const IMAGE_PREVIEW_SCALE_STEP = 0.4;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function extractTextContent(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(extractTextContent).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(value)) {
    return extractTextContent(value.props.children);
  }

  return "";
}

function isAllowedUrl(
  value: string | undefined,
  protocols: Set<string>,
  { allowDataImage = false }: { allowDataImage?: boolean } = {},
): boolean {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("#")
  ) {
    return true;
  }

  if (allowDataImage && /^data:image\//i.test(trimmed)) {
    return true;
  }

  try {
    const parsed = new URL(trimmed, MARKDOWN_BASE_URL);
    return protocols.has(parsed.protocol);
  } catch {
    return false;
  }
}

function normalizeCodeLanguage(className?: string): string {
  const match = /language-([\w-]+)/.exec(className ?? "");
  return match?.[1]?.toLowerCase() ?? "text";
}

function useDocumentThemeMode(): "light" | "dark" {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncThemeMode = () => {
      setThemeMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };

    syncThemeMode();

    const observer = new MutationObserver(() => {
      syncThemeMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return themeMode;
}

function getLanguageBadge(language: string): { iconLabel: string; badgeText: string } {
  const normalized = language.trim().toLowerCase();

  switch (normalized) {
    case "ts":
    case "tsx":
    case "typescript":
      return { iconLabel: "TS language icon", badgeText: "TS" };
    case "js":
    case "jsx":
    case "javascript":
      return { iconLabel: "JS language icon", badgeText: "JS" };
    case "py":
    case "python":
      return { iconLabel: "PY language icon", badgeText: "PY" };
    case "json":
      return { iconLabel: "JSON language icon", badgeText: "{}" };
    case "bash":
    case "shell":
    case "sh":
      return { iconLabel: "SH language icon", badgeText: "$" };
    default: {
      const badgeText = normalized.slice(0, 2).toUpperCase() || "</";
      return { iconLabel: `${badgeText} language icon`, badgeText };
    }
  }
}

function formatLinkMetadata(href: string): { host: string; path: string } {
  try {
    const parsed = new URL(href, MARKDOWN_BASE_URL);
    const path = parsed.pathname || "/";

    return {
      host: parsed.host,
      path: path === "" ? "/" : path,
    };
  } catch {
    return {
      host: href,
      path: "/",
    };
  }
}

function getLinkProtocol(href: string): string {
  try {
    const parsed = new URL(href, MARKDOWN_BASE_URL);
    return parsed.protocol.replace(":", "").toUpperCase();
  } catch {
    return "LINK";
  }
}

function getFaviconUrl(href: string): string | null {
  try {
    const parsed = new URL(href, MARKDOWN_BASE_URL);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return null;
  }
}

function getImageSourceLabel(src: string): string {
  if (/^data:image\//i.test(src)) {
    return "内嵌图像";
  }

  try {
    const parsed = new URL(src, MARKDOWN_BASE_URL);

    if (parsed.protocol === "file:" || parsed.protocol === "blob:" || parsed.host === "banana.local") {
      return "本地资源";
    }

    return parsed.host || "图像预览";
  } catch {
    return "图像预览";
  }
}

function getStandaloneLinkCard(children: ReactNode): { href: string; label: string } | null {
  const items = Children.toArray(children).filter((child) => {
    if (typeof child === "string") {
      return child.trim().length > 0;
    }

    return true;
  });

  if (items.length !== 1) {
    return null;
  }

  const candidate = items[0];
  if (!isValidElement<Record<string, unknown>>(candidate)) {
    return null;
  }

  if (candidate.props["data-markdown-image-link"] === true) {
    return null;
  }

  const href = typeof candidate.props.href === "string" ? candidate.props.href : undefined;
  if (!isAllowedUrl(href, new Set(["http:", "https:"]))) {
    return null;
  }

  if (!href) {
    return null;
  }

  const label = extractTextContent(candidate.props.children as ReactNode).trim();
  if (!label) {
    return null;
  }

  return { href, label };
}

function MarkdownDivider() {
  return (
    <hr
      className="glass-markdown-divider my-6 h-px border-0 rounded-full"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, var(--glass-border) 18%, var(--brand-primary-light) 50%, var(--glass-border) 82%, transparent 100%)",
        boxShadow: "0 0 12px var(--brand-primary-light)",
        opacity: 0.72,
      }}
    />
  );
}

function MarkdownLink({
  href,
  children,
  className,
  node: _node,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) {
  void _node;

  if (!isAllowedUrl(href, new Set(["http:", "https:", "mailto:"]))) {
    return <span className="markdown-link markdown-link-unsafe">{children}</span>;
  }

  return (
    <a
      {...props}
      className={cn("markdown-link", className)}
      href={href}
      rel="noopener noreferrer nofollow"
      target="_blank"
    >
      {children}
    </a>
  );
}

function MarkdownImage({
  src,
  alt,
  className,
  node: _node,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) {
  void _node;
  const [isOpen, setIsOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<Array<{ alt: string; src: string }>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartPoint, setTouchStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [previewScale, setPreviewScale] = useState(IMAGE_PREVIEW_MIN_SCALE);
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    originX: number;
    originY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const imageSrc = typeof src === "string" ? src : null;
  const isSafeImageSource =
    imageSrc !== null &&
    isAllowedUrl(imageSrc, new Set(["http:", "https:", "file:", "blob:"]), {
      allowDataImage: true,
    });

  const accessibleAlt = alt?.trim() || "Markdown image";
  const sourceLabel = imageSrc ? getImageSourceLabel(imageSrc) : "图像预览";
  const activeItem = galleryItems[activeIndex] ?? { alt: accessibleAlt, src: imageSrc ?? "" };
  const hasGallery = galleryItems.length > 1;
  const canPanPreview = previewScale > IMAGE_PREVIEW_MIN_SCALE + 0.01;

  const clampPreviewOffset = (offset: { x: number; y: number }, scale: number) => {
    if (scale <= IMAGE_PREVIEW_MIN_SCALE) {
      return { x: 0, y: 0 };
    }

    const frame = previewFrameRef.current;
    const preview = previewImageRef.current;

    if (
      !frame ||
      !preview ||
      frame.clientWidth === 0 ||
      frame.clientHeight === 0 ||
      preview.clientWidth === 0 ||
      preview.clientHeight === 0
    ) {
      return offset;
    }

    const maxX = Math.max(0, ((preview.clientWidth * scale) - frame.clientWidth) / 2);
    const maxY = Math.max(0, ((preview.clientHeight * scale) - frame.clientHeight) / 2);

    return {
      x: clampNumber(offset.x, -maxX, maxX),
      y: clampNumber(offset.y, -maxY, maxY),
    };
  };

  const resetPreviewState = () => {
    setPreviewScale(IMAGE_PREVIEW_MIN_SCALE);
    setPreviewOffset({ x: 0, y: 0 });
    setDragState(null);
    setTouchStartPoint(null);
  };

  const openPreview = () => {
    const currentButton = triggerRef.current;
    const markdownRoot = currentButton?.closest("[data-markdown-content='true']");
    const buttons = markdownRoot
      ? Array.from(markdownRoot.querySelectorAll<HTMLButtonElement>("[data-markdown-image-card='true']"))
      : [];

    const items = buttons
      .map((button) => {
        const previewImage = button.querySelector<HTMLImageElement>("img.markdown-image");

        if (!previewImage?.src) {
          return null;
        }

        return {
          alt: previewImage.alt?.trim() || "Markdown image",
          src: previewImage.src,
        };
      })
      .filter((item): item is { alt: string; src: string } => Boolean(item));

    const nextGallery = items.length > 0 ? items : [{ alt: accessibleAlt, src: imageSrc ?? "" }];
    const nextIndex = buttons.length > 0 && currentButton ? Math.max(buttons.indexOf(currentButton), 0) : 0;

    setGalleryItems(nextGallery);
    setActiveIndex(nextIndex);
    resetPreviewState();
    setIsOpen(true);
  };

  const moveGallery = (direction: "next" | "prev") => {
    if (galleryItems.length <= 1) {
      return;
    }

    resetPreviewState();
    setActiveIndex((current) => {
      if (direction === "next") {
        return (current + 1) % galleryItems.length;
      }

      return (current - 1 + galleryItems.length) % galleryItems.length;
    });
  };

  const updatePreviewScale = (updater: (current: number) => number) => {
    const nextScale = clampNumber(
      Number(updater(previewScale).toFixed(2)),
      IMAGE_PREVIEW_MIN_SCALE,
      IMAGE_PREVIEW_MAX_SCALE,
    );

    setPreviewScale(nextScale);
    setPreviewOffset((currentOffset) => clampPreviewOffset(currentOffset, nextScale));

    if (nextScale <= IMAGE_PREVIEW_MIN_SCALE) {
      setDragState(null);
    }
  };

  useEffect(() => {
    if (!isOpen || galleryItems.length <= 1) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        resetPreviewState();
        setActiveIndex((current) => (current - 1 + galleryItems.length) % galleryItems.length);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        resetPreviewState();
        setActiveIndex((current) => (current + 1) % galleryItems.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [galleryItems.length, isOpen]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setPreviewOffset(
        clampPreviewOffset(
          {
            x: dragState.originX + event.clientX - dragState.startX,
            y: dragState.originY + event.clientY - dragState.startY,
          },
          previewScale,
        ),
      );
    };

    const stopDragging = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [dragState, previewScale]);

  const handleTouchEnd = (clientX: number) => {
    if (canPanPreview) {
      setTouchStartPoint(null);
      return;
    }

    if (touchStartPoint === null || galleryItems.length <= 1) {
      setTouchStartPoint(null);
      return;
    }

    const deltaX = clientX - touchStartPoint.x;
    setTouchStartPoint(null);

    if (Math.abs(deltaX) < 48) {
      return;
    }

    moveGallery(deltaX < 0 ? "next" : "prev");
  };

  const handlePreviewMouseDown = (event: ReactMouseEvent<HTMLImageElement>) => {
    if (!canPanPreview) {
      return;
    }

    event.preventDefault();
    setDragState({
      originX: previewOffset.x,
      originY: previewOffset.y,
      startX: event.clientX,
      startY: event.clientY,
    });
  };

  if (!isSafeImageSource || !imageSrc) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="markdown-image-link"
        data-markdown-image-card="true"
        data-markdown-image-link="true"
        onClick={openPreview}
      >
        <span className="markdown-image-shell">
          <span className="markdown-image-frame">
            <img
              {...props}
              alt={accessibleAlt}
              className={cn("markdown-image", className)}
              loading="lazy"
              src={src}
            />
            <span className="markdown-image-zoom-badge" aria-hidden="true">
              点击放大
            </span>
          </span>
          <span className="markdown-image-meta">
            <span className="markdown-image-caption">{accessibleAlt}</span>
            <span className="markdown-image-hint">{sourceLabel}</span>
          </span>
        </span>
      </button>

      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setIsOpen(nextOpen);

          if (!nextOpen) {
            resetPreviewState();
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="markdown-image-dialog max-w-[min(96vw,64rem)] p-4 sm:p-5"
        >
          <DialogHeader className="space-y-1">
            <div className="markdown-image-dialog-heading">
              <div className="markdown-image-dialog-copy">
                <DialogTitle>{activeItem.alt}</DialogTitle>
              </div>
              {hasGallery && (
                <div className="markdown-image-dialog-nav" data-markdown-image-nav="true">
                  <button
                    type="button"
                    className="markdown-image-dialog-arrow"
                    aria-label="上一张"
                    onClick={() => moveGallery("prev")}
                  >
                    上一张
                  </button>
                  <span className="markdown-image-dialog-counter" aria-live="polite">
                    {activeIndex + 1} / {galleryItems.length}
                  </span>
                  <button
                    type="button"
                    className="markdown-image-dialog-arrow"
                    aria-label="下一张"
                    onClick={() => moveGallery("next")}
                  >
                    下一张
                  </button>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="markdown-image-dialog-toolbar" data-markdown-image-zoom-controls="true">
            <button
              type="button"
              className="markdown-image-dialog-arrow"
              aria-label="缩小图片"
              disabled={previewScale <= IMAGE_PREVIEW_MIN_SCALE}
              onClick={() => {
                updatePreviewScale((current) => current - IMAGE_PREVIEW_SCALE_STEP);
              }}
            >
              缩小
            </button>
            <span className="markdown-image-dialog-zoom" aria-live="polite">
              {Math.round(previewScale * 100)}%
            </span>
            <button
              type="button"
              className="markdown-image-dialog-arrow"
              aria-label="放大图片"
              disabled={previewScale >= IMAGE_PREVIEW_MAX_SCALE}
              onClick={() => {
                updatePreviewScale((current) => current + IMAGE_PREVIEW_SCALE_STEP);
              }}
            >
              放大
            </button>
            <button
              type="button"
              className="markdown-image-dialog-arrow"
              aria-label="重置预览"
              disabled={
                previewScale <= IMAGE_PREVIEW_MIN_SCALE &&
                previewOffset.x === 0 &&
                previewOffset.y === 0
              }
              onClick={resetPreviewState}
            >
              重置
            </button>
          </div>
          <div
            ref={previewFrameRef}
            className="markdown-image-dialog-body"
            data-preview-dragging={dragState ? "true" : "false"}
            data-preview-zoomed={canPanPreview ? "true" : "false"}
            onTouchEnd={(event) => {
              const touch = event.changedTouches[0];
              if (touch) {
                handleTouchEnd(touch.clientX);
              }
            }}
            onTouchMove={(event) => {
              if (!canPanPreview) {
                return;
              }

              const touch = event.touches[0];

              if (!touch) {
                return;
              }

              event.preventDefault();
              setPreviewOffset((currentOffset) =>
                clampPreviewOffset(
                  {
                    x: currentOffset.x + touch.clientX - (touchStartPoint?.x ?? touch.clientX),
                    y: currentOffset.y + touch.clientY - (touchStartPoint?.y ?? touch.clientY),
                  },
                  previewScale,
                ),
              );
              setTouchStartPoint({ x: touch.clientX, y: touch.clientY });
            }}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              if (touch) {
                setTouchStartPoint({ x: touch.clientX, y: touch.clientY });
              }
            }}
            onWheel={(event) => {
              event.preventDefault();
              updatePreviewScale((current) =>
                current + (event.deltaY < 0 ? IMAGE_PREVIEW_SCALE_STEP / 2 : -IMAGE_PREVIEW_SCALE_STEP / 2),
              );
            }}
          >
            <img
              alt={`${activeItem.alt} 预览`}
              className="markdown-image-dialog-preview"
              data-preview-dragging={dragState ? "true" : "false"}
              draggable={false}
              onDragStart={(event) => {
                event.preventDefault();
              }}
              onMouseDown={handlePreviewMouseDown}
              ref={previewImageRef}
              src={activeItem.src}
              style={{
                transform: `translate3d(${previewOffset.x}px, ${previewOffset.y}px, 0) scale(${previewScale})`,
              }}
            />
          </div>
          <a
            className="markdown-image-dialog-open"
            href={activeItem.src}
            rel="noopener noreferrer nofollow"
            target="_blank"
          >
            在新窗口打开
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MarkdownListItem({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  const items = Children.toArray(children);
  const checkboxElement = items.find(
    (child): child is ReactElement<Record<string, unknown>> =>
      isValidElement(child) && child.type === "input",
  );

  if (checkboxElement) {
    const label = items
      .filter((child) => child !== checkboxElement)
      .map(extractTextContent)
      .join("")
      .replace(/\s+/g, " ")
      .trim();

    return (
      <li {...props} className={cn("markdown-task-item", className)}>
        <label className="markdown-task-label">
          {cloneElement(checkboxElement, {
            "aria-label": label || "任务项",
            className: cn(
              "markdown-task-checkbox",
              typeof checkboxElement.props.className === "string"
                ? checkboxElement.props.className
                : undefined,
            ),
          })}
          <span>{items.filter((child) => child !== checkboxElement)}</span>
        </label>
      </li>
    );
  }

  return (
    <li {...props} className={cn("markdown-list-item", className)}>
      {children}
    </li>
  );
}

function MarkdownTable({
  children,
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="markdown-table-wrap">
      <table {...props} className={cn("markdown-table", className)}>
        {children}
      </table>
    </div>
  );
}

function MarkdownBlockquote({
  children,
  className,
  ...props
}: React.BlockquoteHTMLAttributes<HTMLElement>) {
  return (
    <blockquote {...props} className={cn("markdown-blockquote", className)}>
      {children}
    </blockquote>
  );
}

function MarkdownLinkCard({ href, label }: { href: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const metadata = formatLinkMetadata(href);
  const protocol = getLinkProtocol(href);
  const faviconUrl = getFaviconUrl(href);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copied]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="markdown-link-card-wrap">
      <div className="markdown-link-card-shell" data-markdown-link-card="true">
        <a
          aria-label={label}
          className="markdown-link-card"
          href={href}
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          <div className="markdown-link-card-header">
            {faviconUrl ? (
              <img
                alt={`${metadata.host} favicon`}
                className="markdown-link-card-favicon"
                loading="lazy"
                src={faviconUrl}
              />
            ) : (
              <span className="markdown-link-card-favicon-fallback" aria-hidden="true">
                {metadata.host.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="markdown-link-card-protocol">{protocol}</span>
          </div>
          <span className="markdown-link-card-label">{label}</span>
          <span className="markdown-link-card-meta">{metadata.host}</span>
          <span className="markdown-link-card-path">{metadata.path}</span>
        </a>
        <button
          type="button"
          className="markdown-link-card-copy"
          onClick={() => {
            void handleCopyLink();
          }}
          aria-label="复制链接"
        >
          {copied ? "已复制" : "复制链接"}
        </button>
      </div>
    </div>
  );
}

function MarkdownParagraph({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const standaloneLink = getStandaloneLinkCard(children);

  if (standaloneLink) {
    return <MarkdownLinkCard href={standaloneLink.href} label={standaloneLink.label} />;
  }

  return (
    <p {...props} className={cn("markdown-paragraph", className)}>
      {children}
    </p>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const themeMode = useDocumentThemeMode();
  const lineCount = code.split(/\r?\n/).length;
  const isCollapsible = lineCount > CODE_COLLAPSE_LINE_THRESHOLD;
  const [userExpanded, setUserExpanded] = useState(false);
  const isExpanded = !isCollapsible || userExpanded;
  const badge = getLanguageBadge(language);
  const lineCountLabel = `${lineCount} 行`;
  const shikiTheme = themeMode === "dark" ? "github-dark" : "github-light";

  useEffect(() => {
    let cancelled = false;

    void codeToHtml(code, {
      lang: language || "text",
      theme: shikiTheme,
    })
      .then((html: string) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setHighlighted(html);
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setHighlighted(null);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [code, language, shikiTheme]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="markdown-code-block"
      data-markdown-code-block="true"
      data-code-collapsed={isCollapsible && !isExpanded ? "true" : "false"}
      data-code-lines={lineCount}
      data-code-theme={themeMode}
    >
      <div className="markdown-code-toolbar">
        <div className="markdown-code-meta">
          <span aria-label={badge.iconLabel} className="markdown-code-icon">
            {badge.badgeText}
          </span>
          <div className="markdown-code-labels">
            <span className="markdown-code-language">{language}</span>
            <span className="markdown-code-line-count">{lineCountLabel}</span>
          </div>
        </div>
        <div className="markdown-code-actions">
          {isCollapsible && (
            <button
              type="button"
              className="markdown-code-toggle"
              onClick={() => setUserExpanded((value) => !value)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "收起代码" : "展开代码"}
            >
              {isExpanded ? "收起代码" : "展开代码"}
            </button>
          )}
          <button
            type="button"
            className="markdown-code-copy"
            onClick={() => {
              void handleCopy();
            }}
            aria-label="复制代码"
          >
            {copied ? "已复制" : "复制代码"}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "markdown-code-renderer-shell",
          isCollapsible && !isExpanded && "markdown-code-renderer-collapsed",
        )}
      >
        {highlighted ? (
          <div
            className="markdown-code-renderer"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          <pre className="markdown-pre-fallback">
            <code>{code}</code>
          </pre>
        )}
        {isCollapsible && !isExpanded && (
          <div className="markdown-code-collapse-hint" data-code-collapse-hint="true">
            <span className="markdown-code-collapse-label">已折叠 {lineCount} 行代码</span>
            <span className="markdown-code-collapse-help">展开查看更多</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const renderId = useId().replace(/:/g, "-");

  useEffect(() => {
    let cancelled = false;

    mermaid.initialize({
      securityLevel: "strict",
      startOnLoad: false,
      suppressErrorRendering: true,
    });

    void mermaid
      .render(`banana-mermaid-${renderId}`, code)
      .then((result: { svg: string }) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setHasError(false);
          setSvg(result.svg);
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setHasError(true);
          setSvg(null);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [code, renderId]);

  if (hasError) {
    return (
      <div className="markdown-mermaid-error" data-markdown-mermaid="true">
        <div className="markdown-mermaid-status">Mermaid 渲染失败，已回退为代码视图。</div>
        <pre className="markdown-pre-fallback">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="markdown-mermaid" data-markdown-mermaid="true">
      {svg ? (
        <div
          className="markdown-mermaid-canvas"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="markdown-mermaid-status">正在渲染 Mermaid 图表...</div>
      )}
    </div>
  );
}

const markdownComponents: Components = {
  a: ({ children, ...props }) => <MarkdownLink {...props}>{children}</MarkdownLink>,
  blockquote: ({ children, ...props }) => <MarkdownBlockquote {...props}>{children}</MarkdownBlockquote>,
  code: ({ children, className, node, ...props }) => {
    const inline =
      node?.type === "element" &&
      "tagName" in node &&
      typeof node.tagName === "string" &&
      node.tagName !== "code";
    const code = String(children).replace(/\n$/, "");
    const language = normalizeCodeLanguage(className);

    if ((props as { inline?: boolean }).inline) {
      return (
        <code {...props} className={cn("markdown-inline-code", className)}>
          {children}
        </code>
      );
    }

    if (inline) {
      return (
        <code {...props} className={cn("markdown-inline-code", className)}>
          {children}
        </code>
      );
    }

    if (language === "mermaid") {
      return <MermaidBlock code={code} />;
    }

    return <CodeBlock key={`${language}-${code}`} code={code} language={language} />;
  },
  hr: () => <MarkdownDivider />,
  img: ({ alt, ...props }) => <MarkdownImage {...props} alt={alt} />,
  li: ({ children, ...props }) => <MarkdownListItem {...props}>{children}</MarkdownListItem>,
  p: ({ children, ...props }) => <MarkdownParagraph {...props}>{children}</MarkdownParagraph>,
  pre: ({ children }) => <>{children}</>,
  table: ({ children, ...props }) => <MarkdownTable {...props}>{children}</MarkdownTable>,
};

export function MessageMarkdown({
  className,
  content,
}: {
  className?: string;
  content: string;
}) {
  return (
    <div className={cn("markdown-content", className)} data-markdown-content="true">
      <ReactMarkdown
        components={markdownComponents}
        rehypePlugins={[rehypeKatex]}
        remarkPlugins={[remarkGfm, remarkMath]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
