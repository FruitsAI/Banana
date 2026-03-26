import { afterEach, describe, expect, it } from "vitest";
import {
  buildPlatformMarkerScript,
  detectDesktopPlatform,
  detectRuntimeEnvironment,
} from "./platform";

const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "platform");
const originalUserAgentDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "userAgent");
const originalTauriInternalsDescriptor = Object.getOwnPropertyDescriptor(window, "__TAURI_INTERNALS__");

afterEach(() => {
  document.documentElement.removeAttribute("data-platform");
  document.documentElement.removeAttribute("data-runtime");

  if (originalPlatformDescriptor) {
    Object.defineProperty(window.navigator, "platform", originalPlatformDescriptor);
  }

  if (originalUserAgentDescriptor) {
    Object.defineProperty(window.navigator, "userAgent", originalUserAgentDescriptor);
  }

  if (originalTauriInternalsDescriptor) {
    Object.defineProperty(window, "__TAURI_INTERNALS__", originalTauriInternalsDescriptor);
    return;
  }

  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
});

describe("detectDesktopPlatform", () => {
  it("recognizes Windows and macOS desktop user agents", () => {
    expect(
      detectDesktopPlatform({
        platform: "Win32",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      }),
    ).toBe("windows");

    expect(
      detectDesktopPlatform({
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)",
      }),
    ).toBe("macos");
  });

  it("does not misclassify Darwin user agents as Windows", () => {
    expect(
      detectDesktopPlatform({
        platform: "MacIntel",
        userAgent: "Mozilla/5.0 (Darwin; arm64) AppleWebKit/605.1.15",
      }),
    ).toBe("macos");
  });
});

describe("detectRuntimeEnvironment", () => {
  it("distinguishes browser previews from tauri windows", () => {
    expect(detectRuntimeEnvironment({})).toBe("browser");
    expect(detectRuntimeEnvironment({ __TAURI_INTERNALS__: {} })).toBe("tauri");
  });
});

describe("buildPlatformMarkerScript", () => {
  it("applies platform and runtime attributes before hydration", () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
      writable: true,
    });
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "Win32",
    });
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });

    document.documentElement.removeAttribute("data-platform");
    document.documentElement.removeAttribute("data-runtime");

    new Function(buildPlatformMarkerScript())();

    expect(document.documentElement).toHaveAttribute("data-platform", "windows");
    expect(document.documentElement).toHaveAttribute("data-runtime", "tauri");
  });

  it("marks Darwin browsers as macOS before hydration", () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
      writable: true,
    });
    Object.defineProperty(window.navigator, "platform", {
      configurable: true,
      value: "MacIntel",
    });
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Darwin; arm64) AppleWebKit/605.1.15",
    });

    document.documentElement.removeAttribute("data-platform");
    document.documentElement.removeAttribute("data-runtime");

    new Function(buildPlatformMarkerScript())();

    expect(document.documentElement).toHaveAttribute("data-platform", "macos");
    expect(document.documentElement).toHaveAttribute("data-runtime", "tauri");
  });
});
