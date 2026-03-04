"use client";

/**
 * 关于我们及版本页 (AboutSetting)
 * @description 展示应用如版本号，系统环境与生态更新信息。
 */
export function AboutSetting() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">关于我们</h3>
        <p className="text-sm text-muted-foreground mt-1">了解更多关于 Banana 的信息以及产品版本。</p>
      </div>
      <div className="space-y-4 bg-muted/30 p-6 rounded-lg border border-border/50 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">🍌 Banana</h1>
        <p className="text-muted-foreground">Next Generation AI Assistant</p>
        <div className="mt-8 text-sm text-muted-foreground">
          <p>Version v0.1.0-alpha</p>
          <p className="mt-2">基于 Tauri 2 + Next.js + Vercel AI SDK 构建</p>
        </div>
      </div>
    </div>
  );
}
