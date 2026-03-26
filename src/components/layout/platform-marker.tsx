"use client";

import { useEffect } from "react";
import { applyPlatformAttributes, getClientPlatformState } from "@/lib/platform";

/**
 * PlatformMarker 组件
 * @description 在客户端启动时标记平台信息，供全局样式做平台差异化控制。
 */
export function PlatformMarker() {
  useEffect(() => {
    applyPlatformAttributes(document.documentElement, getClientPlatformState());
  }, []);

  return null;
}
