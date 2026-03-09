"use client";

import { useEffect } from "react";

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    platform?: string;
  };
}

function detectWindowsPlatform(): boolean {
  const navigatorWithUAData = navigator as NavigatorWithUserAgentData;
  const uaDataPlatform = navigatorWithUAData.userAgentData?.platform ?? "";
  const navigatorPlatform = navigator.platform ?? "";
  const userAgent = navigator.userAgent ?? "";
  const combined = `${uaDataPlatform} ${navigatorPlatform} ${userAgent}`;
  return /win/i.test(combined);
}

/**
 * PlatformMarker 组件
 * @description 在客户端启动时标记平台信息，供全局样式做平台差异化控制。
 */
export function PlatformMarker() {
  useEffect(() => {
    const isWindows = detectWindowsPlatform();
    if (isWindows) {
      document.documentElement.setAttribute("data-platform", "windows");
      return;
    }
    document.documentElement.removeAttribute("data-platform");
  }, []);

  return null;
}
