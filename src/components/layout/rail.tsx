"use client";

import { MessageSquare, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { id: "chats", icon: MessageSquare, label: "会话", path: "/" },
];

/**
 * 全局主导航侧边栏 (Rail)
 * @description 展示应用主要功能模块 (如会话、工具箱等) 的入口，以及包含切换色彩主题 (深色/浅色) 的支持。
 * 采用了 Next.js 的路由与路径分析高亮当前所在模块。
 */
export function Rail() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isSettingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <>
      <aside className="rail" aria-label="主导航">
        <div className="rail-group">
          {navItems.map((item, index) => {
            const isActive = pathname === item.path || (item.path === "/" && pathname === "");
            return (
              <button
                key={item.id}
                className={`rail-btn ${isActive ? "active" : ""}`}
                title={item.label}
                aria-label={item.label}
                style={{ animationDelay: `${index * 40}ms` }}
                onClick={() => router.push(item.path)}
              >
                <item.icon className="icon" strokeWidth={1.75} />
              </button>
            );
          })}
        </div>
        
        <div></div>

        <div className="rail-group">
          <button
            className={`rail-btn ${isSettingsActive ? "active" : ""}`}
            title="设置"
            aria-label="设置"
            onClick={() => router.push("/settings")}
          >
            <Settings className="icon" strokeWidth={1.75} />
          </button>
          
          {mounted ? (
            <button
              className="rail-btn"
              title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
              aria-label="切换主题"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="icon" strokeWidth={1.75} />
              ) : (
                <Moon className="icon" strokeWidth={1.75} />
              )}
            </button>
          ) : (
            <button className="rail-btn" aria-disabled="true">
              <span className="icon" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}