const DEFAULT_THREAD_TITLE = "新会话";
const MAX_THREAD_TITLE_LENGTH = 33;

export function deriveThreadTitle(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return DEFAULT_THREAD_TITLE;
  }

  if (normalized.length <= MAX_THREAD_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_THREAD_TITLE_LENGTH - 3).trimEnd()}...`;
}
