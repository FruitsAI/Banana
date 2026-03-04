"use client";

/**
 * 原生/沉浸式应用顶栏 (Titlebar)
 * @description 实现了基于 Tauri 配置的 window-drag (原生拖拽) 属性控制的顶部操作条。在 macOS 下用于避让红绿灯的交通控制区域，同时提供应用品牌或当前的视图状态指示。
 */
export function Titlebar() {
  return (
    <div className="titlebar" data-tauri-drag-region="true">
      {/* Spacer for native macOS Traffic Lights (overlayed by Tauri) */}
      <div className="traffic" style={{ width: '90px', pointerEvents: 'none' }} />
      {/* Drag Region covering the rest of the titlebar */}
      <div 
        data-tauri-drag-region="true" 
        style={{ flex: 1, height: '100%', cursor: 'default' }} 
      />
    </div>
  );
}