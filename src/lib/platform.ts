export type DesktopPlatform = "windows" | "macos" | "linux" | "unknown";
export type RuntimeEnvironment = "tauri" | "browser";

interface NavigatorPlatformLike {
  platform?: string;
  userAgent?: string;
  userAgentData?: {
    platform?: string;
  };
}

interface WindowRuntimeLike {
  __TAURI_INTERNALS__?: unknown;
}

type WindowWithRuntimeBridge = Window & WindowRuntimeLike;

export function detectDesktopPlatform(navigatorLike: NavigatorPlatformLike): DesktopPlatform {
  const uaDataPlatform = navigatorLike.userAgentData?.platform ?? "";
  const navigatorPlatform = navigatorLike.platform ?? "";
  const userAgent = navigatorLike.userAgent ?? "";
  const combined = `${uaDataPlatform} ${navigatorPlatform} ${userAgent}`.toLowerCase();

  if (combined.includes("win")) return "windows";
  if (combined.includes("mac") || combined.includes("darwin")) return "macos";
  if (combined.includes("linux") || combined.includes("x11")) return "linux";
  return "unknown";
}

export function detectRuntimeEnvironment(windowLike: WindowRuntimeLike | undefined): RuntimeEnvironment {
  return windowLike?.__TAURI_INTERNALS__ ? "tauri" : "browser";
}

export function applyPlatformAttributes(
  root: HTMLElement,
  {
    platform,
    runtime,
  }: {
    platform: DesktopPlatform;
    runtime: RuntimeEnvironment;
  },
) {
  if (platform === "unknown") {
    root.removeAttribute("data-platform");
  } else {
    root.setAttribute("data-platform", platform);
  }

  root.setAttribute("data-runtime", runtime);
}

export function getClientPlatformState() {
  return {
    platform: detectDesktopPlatform(navigator),
    runtime: detectRuntimeEnvironment(window as WindowWithRuntimeBridge),
  };
}

export function buildPlatformMarkerScript(): string {
  return [
    "(() => {",
    "  const root = document.documentElement;",
    "  const uaDataPlatform = navigator.userAgentData?.platform ?? '';",
    "  const navigatorPlatform = navigator.platform ?? '';",
    "  const userAgent = navigator.userAgent ?? '';",
    "  const combined = `${uaDataPlatform} ${navigatorPlatform} ${userAgent}`.toLowerCase();",
    "  const platform = combined.includes('win')",
    "    ? 'windows'",
    "    : combined.includes('mac') || combined.includes('darwin')",
    "      ? 'macos'",
    "      : combined.includes('linux') || combined.includes('x11')",
    "        ? 'linux'",
    "        : 'unknown';",
    "  const runtime = window.__TAURI_INTERNALS__ ? 'tauri' : 'browser';",
    "  if (platform === 'unknown') {",
    "    root.removeAttribute('data-platform');",
    "  } else {",
    "    root.setAttribute('data-platform', platform);",
    "  }",
    "  root.setAttribute('data-runtime', runtime);",
    "})();",
  ].join("\n");
}
