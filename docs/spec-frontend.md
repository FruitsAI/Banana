# Banana AI 前端设计规范

> 版本: v1.0  
> 更新日期: 2026-03-07  
> 适用范围: Banana AI Assistant 全平台前端开发

---

## 1. 设计哲学

### 1.1 核心原则

- **Apple Liquid Glass**: 采用苹果液态玻璃设计语言，追求通透、轻盈、有层次的视觉体验
- **Warm Minimalism**: 温暖的极简主义，使用暖色调而非纯黑白
- **Contextual Depth**: 通过阴影、模糊、层次创造深度感
- **Responsive Fluidity**: 流畅的响应式交互，所有动画使用 spring 物理曲线

### 1.2 设计关键词

`通透` `温暖` `精致` `流畅` `层次` `质感`

---

## 2. 颜色系统

### 2.1 品牌色

```css
/* 主品牌色 - 温暖蓝 */
--brand-primary: #3B82F6;
--brand-primary-hover: #2563EB;
--brand-primary-light: rgba(59, 130, 246, 0.1);
--brand-primary-glow: rgba(59, 130, 246, 0.25);
```

### 2.2 浅色模式 (Light Mode)

```css
/* 文字颜色 - 暖灰色系 */
--text-primary: #1C1C1E;      /* 主要文字 */
--text-secondary: #636366;    /* 次要文字 */
--text-tertiary: #8E8E93;     /* 辅助文字 */
--text-quaternary: #C7C7CC;   /* 占位文字 */
--text-placeholder: #A1A1AA;  /* 输入占位 */

/* 背景颜色 - 温暖奶油色 */
--bg-primary: #FAFAF8;        /* 主背景 */
--bg-secondary: #FFFFFF;      /* 次级背景 */
--bg-tertiary: #F5F5F3;       /* 第三层背景 */
--bg-elevated: #FFFFFF;       /* 浮层背景 */
--bg-sidebar: #F9F9F7;        /* 侧边栏背景 */

/* 玻璃态表面 */
--glass-surface: rgba(255, 255, 255, 0.85);
--glass-elevated: rgba(255, 255, 255, 0.95);
--glass-overlay: rgba(255, 255, 255, 0.98);
--glass-subtle: rgba(249, 249, 247, 0.6);
--glass-hover: rgba(255, 255, 255, 0.92);

/* 玻璃态边框 */
--glass-border: rgba(60, 60, 67, 0.08);
--glass-border-strong: rgba(60, 60, 67, 0.15);
--glass-highlight: rgba(255, 255, 255, 0.95);
--glass-glow: rgba(255, 255, 255, 0.7);

/* 语义颜色 */
--success: #34C759;
--success-light: rgba(52, 199, 89, 0.12);
--success-glow: rgba(52, 199, 89, 0.3);

--warning: #FF9500;
--warning-light: rgba(255, 149, 0, 0.12);
--warning-glow: rgba(255, 149, 0, 0.3);

--danger: #FF3B30;
--danger-light: rgba(255, 59, 48, 0.12);
--danger-glow: rgba(255, 59, 48, 0.3);

--info: #007AFF;
--info-light: rgba(0, 122, 255, 0.12);
--info-glow: rgba(0, 122, 255, 0.3);

/* 分隔线 */
--divider: rgba(60, 60, 67, 0.06);
--divider-strong: rgba(60, 60, 67, 0.12);

/* 焦点环 */
--focus-ring: rgba(0, 122, 255, 0.4);
```

### 2.3 深色模式 (Dark Mode)

```css
.dark {
  /* 文字颜色 */
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-tertiary: #8E8E93;
  --text-quaternary: #636366;
  --text-placeholder: #48484A;

  /* 背景颜色 */
  --bg-primary: #0A0A0A;
  --bg-secondary: #1C1C1E;
  --bg-tertiary: #2C2C2E;
  --bg-elevated: #1C1C1E;
  --bg-sidebar: #0F0F0F;

  /* 玻璃态表面 */
  --glass-surface: rgba(28, 28, 30, 0.85);
  --glass-elevated: rgba(44, 44, 46, 0.95);
  --glass-overlay: rgba(0, 0, 0, 0.98);
  --glass-subtle: rgba(28, 28, 30, 0.6);
  --glass-hover: rgba(44, 44, 46, 0.92);

  /* 玻璃态边框 */
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-strong: rgba(255, 255, 255, 0.15);
  --glass-highlight: rgba(255, 255, 255, 0.1);
  --glass-glow: rgba(255, 255, 255, 0.1);

  /* 语义颜色 */
  --success: #30D158;
  --warning: #FF9F0A;
  --danger: #FF453A;
  --info: #0A84FF;

  /* 分隔线 */
  --divider: rgba(255, 255, 255, 0.08);
  --focus-ring: rgba(10, 132, 255, 0.5);
}
```

### 2.4 使用规范

- **所有颜色必须通过 CSS 变量引用**，禁止硬编码颜色值
- 文字颜色使用 `text-primary` 到 `text-quaternary` 的层级
- 背景颜色根据层级选择 `bg-primary` 到 `bg-elevated`
- 玻璃态效果必须使用 `backdrop-filter: blur(20px) saturate(180%)`

---

## 3. 字体系统

### 3.1 字体栈

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
--font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
--font-mono: "SF Mono", SFMono-Regular, "Menlo", "Monaco", Consolas, monospace;
```

### 3.2 字号规范

| 层级 | 字号 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| H1 | 34px | 700 | 1.2 | 页面大标题 |
| H2 | 28px | 600 | 1.2 | 区块标题 |
| H3 | 20px | 600 | 1.3 | 卡片标题 |
| H4 | 18px | 600 | 1.3 | 小标题 |
| Body | 14px | 400 | 1.5 | 正文 |
| Small | 13px | 400 | 1.5 | 辅助文字 |
| Caption | 12px | 500 | 1.4 | 标签、说明 |
| Tiny | 11px | 500 | 1.4 | 时间戳、徽章 |

### 3.3 字体使用原则

- 正文使用 14px，确保可读性
- 标题使用 Display 字体，正文使用 Text 字体
- 代码、API 地址使用等宽字体
- 字重最小 400，不使用超细字体

---

## 4. 间距系统

### 4.1 基础间距

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### 4.2 组件间距

- **按钮内边距**: `px-4 py-2` (默认), `px-3 py-1.5` (small)
- **卡片内边距**: `p-4` 或 `p-5`
- **列表项间距**: `gap-2` 或 `gap-3`
- **表单元素间距**: `space-y-4`
- **页面边距**: `p-6` 或 `p-8`

---

## 5. 圆角系统

### 5.1 圆角变量

```css
--radius: 12px;
--r-xs: 6px;      /* 小标签、徽章 */
--r-sm: 8px;      /* 小按钮、输入框 */
--r-md: 12px;     /* 按钮、卡片 */
--r-lg: 16px;     /* 大卡片、弹窗 */
--r-xl: 20px;     /* 特殊容器 */
--r-2xl: 28px;    /* 大容器 */
--r-full: 9999px; /* 圆形 */
```

### 5.2 使用规范

- 按钮统一使用 `rounded-xl` (12px)
- 卡片使用 `rounded-xl` 或 `rounded-2xl`
- 输入框使用 `rounded-xl`
- 图标按钮使用 `rounded-lg` 或 `rounded-full`
- 标签、徽章使用 `rounded-full`

---

## 6. 阴影系统

### 6.1 阴影变量

```css
/* 浅色模式 */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);

/* 深色模式 */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);
```

### 6.2 使用场景

- `shadow-sm`: 小按钮、标签
- `shadow-md`: 卡片、输入框
- `shadow-lg`: 浮层、下拉菜单
- `shadow-xl`: 弹窗、模态框

---

## 7. 动画系统

### 7.1 缓动函数

```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* 弹性 */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);       /* 平滑 */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);         /* 减速 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);       /* 对称 */
```

### 7.2 动画时长

```css
--dur-instant: 100ms;  /* 微交互 */
--dur-fast: 150ms;     /* 按钮、图标 */
--dur-normal: 250ms;   /* 标准过渡 */
--dur-slow: 400ms;     /* 页面切换 */
--dur-slower: 600ms;   /* 复杂动画 */
```

### 7.3 动画规范

- **按钮悬浮**: 200ms ease-out, 轻微上浮 + 阴影增强
- **页面切换**: 400ms spring, 淡入 + 位移
- **列表项**: 200ms ease-out, 背景色变化
- **模态框**: 300ms spring, 缩放 + 淡入
- **Toast**: 400ms ease-out, 滑入 + 淡入

### 7.4 Framer Motion 推荐

```tsx
// 按钮悬浮
whileHover={{ y: -2, scale: 1.02 }}
whileTap={{ scale: 0.98 }}
transition={{ type: "spring", stiffness: 400, damping: 17 }}

// 页面进入
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}

// 列表项
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.2 }}
```

---

## 8. 按钮规范

### 8.1 按钮类型

| 类型 | 用途 | 样式 |
|------|------|------|
| default | 主要操作 | 蓝色背景，白色文字 |
| secondary | 次要操作 | 玻璃态背景，深色文字 |
| outline | 辅助操作 | 透明背景，边框 |
| ghost | 最小化操作 | 透明，悬浮显示背景 |
| glass | 玻璃态强调 | 毛玻璃效果 |
| destructive | 危险操作 | 红色背景 |

### 8.2 按钮尺寸

| 尺寸 | 高度 | 内边距 | 用途 |
|------|------|--------|------|
| xs | 24px | px-2 | 小标签、紧凑空间 |
| sm | 32px | px-3 | 工具栏、内联 |
| default | 40px | px-4 | 标准按钮 |
| lg | 44px | px-6 | 强调按钮 |

### 8.3 液态玻璃特效

所有按钮必须包含以下悬浮特效：

```tsx
// 玻璃态按钮
<span className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
  style={{ background: 'linear-gradient(90deg, transparent, var(--glass-highlight), transparent)' }} />

<span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
  style={{ background: 'radial-gradient(ellipse at center top, var(--glass-glow) 0%, transparent 70%)' }} />

// 主要按钮
<span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
  style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)' }} />
```

---

## 9. 输入框规范

### 9.1 设计原则

- **无内边框**: 输入框本身无边框，依赖外层容器
- **外边框高亮**: 聚焦时外层容器显示蓝色边框
- **玻璃态背景**: 使用 `var(--glass-surface)`

### 9.2 结构

```tsx
<div className="rounded-xl border transition-all duration-200"
  style={{
    background: 'var(--glass-surface)',
    borderColor: isFocused ? 'var(--brand-primary)' : 'var(--glass-border)',
  }}>
  <input className="w-full bg-transparent border-0 outline-none" />
</div>
```

### 9.3 状态样式

| 状态 | 边框 | 阴影 |
|------|------|------|
| 默认 | `var(--glass-border)` | 无 |
| 聚焦 | `var(--brand-primary)` | `0 0 0 3px var(--brand-primary-light)` |
| 错误 | `var(--danger)` | `0 0 0 3px var(--danger-light)` |
| 禁用 | `var(--glass-border)` | 无，opacity: 0.5 |

---

## 10. 卡片规范

### 10.1 基础卡片

```tsx
<div className="rounded-xl p-4 border"
  style={{
    background: 'var(--glass-surface)',
    borderColor: 'var(--glass-border)',
    backdropFilter: 'blur(20px) saturate(180%)',
  }}>
  {/* 内容 */}
</div>
```

### 10.2 悬浮卡片

```tsx
<motion.div
  className="rounded-xl p-4 border cursor-pointer"
  style={{
    background: 'var(--glass-surface)',
    borderColor: 'var(--glass-border)',
  }}
  whileHover={{
    background: 'var(--glass-hover)',
    borderColor: 'var(--glass-border-strong)',
    y: -2,
  }}
  transition={{ duration: 0.2 }}>
  {/* 内容 */}
</motion.div>
```

---

## 11. 布局规范

### 11.1 页面结构

```
┌─────────────────────────────────────┐
│           Titlebar (44px)           │
├──────────┬──────────────┬───────────┤
│          │              │           │
│   Rail   │   Sidebar    │   Main    │
│  (56px)  │   (240px)    │  (flex)   │
│          │              │           │
└──────────┴──────────────┴───────────┘
```

### 11.2 响应式断点

| 断点 | 宽度 | 布局调整 |
|------|------|----------|
| sm | 640px | 隐藏 Rail，Sidebar 可折叠 |
| md | 768px | 显示 Rail |
| lg | 1024px | 完整三栏布局 |
| xl | 1280px | 最大内容宽度 |

### 11.3 侧边栏宽度

```css
/* 首页会话流 */
.threads-sidebar: w-60 sm:w-64 lg:w-72

/* 设置页 */
.settings-sidebar: w-60 sm:w-64 lg:w-72
```

---

## 12. 组件开发规范

### 12.1 文件结构

```
components/
├── ui/                    # 基础 UI 组件
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── layout/                # 布局组件
│   ├── titlebar.tsx
│   ├── rail.tsx
│   ├── threads-sidebar.tsx
│   └── stage.tsx
├── settings/              # 设置模块
│   ├── settings-sidebar.tsx
│   ├── settings-content.tsx
│   └── sections/
│       ├── models-setting.tsx
│       ├── mcp-setting.tsx
│       └── theme-setting.tsx
└── providers/             # Context Provider
    └── theme-provider.tsx
```

### 12.2 组件模板

```tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Component Name
 * @description 组件描述
 */
export function Component({ className, children }: ComponentProps) {
  return (
    <motion.div
      className={cn("base-classes", className)}
      style={{
        background: 'var(--glass-surface)',
        borderColor: 'var(--glass-border)',
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}
```

### 12.3 命名规范

- **组件名**: PascalCase (如 `ThemeSetting`)
- **文件名**: kebab-case (如 `theme-setting.tsx`)
- **CSS 类**: 使用 Tailwind 工具类
- **CSS 变量**: kebab-case (如 `--glass-surface`)

---

## 13. 主题切换

### 13.1 主题模式

- **light**: 强制浅色模式
- **dark**: 强制深色模式
- **system**: 跟随系统设置

### 13.2 实现方式

使用 `next-themes` 库：

```tsx
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "浅色" : "深色"}
    </button>
  );
}
```

### 13.3 主题过渡

添加主题过渡动画：

```css
.theme-transition,
.theme-transition *,
.theme-transition *::before,
.theme-transition *::after {
  transition: 
    background-color 350ms var(--ease-out),
    border-color 350ms var(--ease-out),
    color 350ms var(--ease-out) !important;
}
```

---

## 14. 最佳实践

### 14.1 DO

- ✅ 使用 CSS 变量引用颜色
- ✅ 使用 Framer Motion 实现动画
- ✅ 使用 glass-surface 作为卡片背景
- ✅ 使用 rounded-xl 作为默认圆角
- ✅ 使用 backdrop-filter 实现毛玻璃
- ✅ 使用 spring 动画曲线
- ✅ 使用 Lucide 图标库

### 14.2 DON'T

- ❌ 硬编码颜色值
- ❌ 使用纯黑/纯白
- ❌ 使用直角边框
- ❌ 使用线性过渡动画
- ❌ 忽略深色模式适配
- ❌ 使用超过 3 层阴影

---

## 15. 参考资源

- [Apple Design Resources](https://developer.apple.com/design/resources/)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

## 16. 代码规范

### 16.1 文件命名规范

| 类型 | 命名方式 | 示例 |
|------|----------|------|
| 组件文件 | PascalCase → kebab-case | `ThemeSetting.tsx` → `theme-setting.tsx` |
| 工具函数 | camelCase | `formatDate.ts`, `useTheme.ts` |
| 常量文件 | UPPER_SNAKE_CASE | `CONSTANTS.ts` |
| 类型定义 | PascalCase | `types.ts`, `interfaces.ts` |
| 样式文件 | 同名组件 + `.module.css` | `button.module.css` |
| 测试文件 | 同名 + `.test.ts` | `button.test.ts` |

**目录结构规范**:
```
components/
├── ui/                    # 基础 UI 组件
│   ├── button.tsx
│   ├── input.tsx
│   └── card.tsx
├── layout/                # 布局组件
│   ├── titlebar.tsx
│   ├── sidebar.tsx
│   └── stage.tsx
├── settings/              # 功能模块
│   ├── settings-sidebar.tsx
│   └── sections/
│       ├── models-setting.tsx
│       └── theme-setting.tsx
hooks/                     # 自定义 Hooks
├── use-theme.ts
├── use-local-storage.ts
lib/                       # 工具函数
├── utils.ts
├── db.ts
├── config.ts
types/                     # 类型定义
├── index.ts
└── settings.ts
```

### 16.2 变量命名规范

**React 组件**:
```tsx
// ✅ 正确
function ThemeSetting() { }
function UserProfileCard() { }

// ❌ 错误
function themeSetting() { }      // 组件名必须 PascalCase
function user_profile_card() { } // 禁止使用 snake_case
```

**变量**:
```tsx
// ✅ 正确
const userName = "John";
const isLoading = true;
const themeList = [];
const handleClick = () => {};

// ❌ 错误
const user_name = "John";   // 禁止使用 snake_case
const UserName = "John";    // 普通变量不要 PascalCase
const x = 10;               // 禁止单字母（循环除外）
```

**常量**:
```tsx
// ✅ 正确
const MAX_RETRY_COUNT = 3;
const DEFAULT_THEME = "light";
const API_BASE_URL = "https://api.example.com";

// ❌ 错误
const maxRetry = 3;         // 常量必须 UPPER_SNAKE_CASE
const defaultTheme = "light";
```

**布尔值**:
```tsx
// ✅ 正确
const isActive = true;
const hasError = false;
const canSubmit = true;
const shouldRefresh = false;

// ❌ 错误
const active = true;        // 布尔值使用 is/has/can/should 前缀
const error = false;
```

**事件处理函数**:
```tsx
// ✅ 正确
const handleClick = () => {};
const handleSubmit = () => {};
const onThemeChange = () => {};
const onUserSelect = () => {};

// ❌ 错误
const click = () => {};     // 使用 handle/on 前缀
const submitHandler = () => {}; // 使用 handle + 动词
```

### 16.3 代码注释规范

**文件头注释**:
```tsx
/**
 * ComponentName
 * @description 组件功能描述
 * @example
 * <ComponentName prop={value} />
 */
```

**函数注释**:
```tsx
/**
 * 格式化日期
 * @param date - 原始日期
 * @param format - 格式模板，默认为 "YYYY-MM-DD"
 * @returns 格式化后的日期字符串
 * @example
 * formatDate(new Date(), "YYYY-MM-DD") // "2026-03-07"
 */
function formatDate(date: Date, format = "YYYY-MM-DD"): string {
  // ...
}
```

**接口/类型注释**:
```tsx
/**
 * 用户配置接口
 */
interface UserConfig {
  /** 用户 ID */
  id: string;
  /** 显示名称 */
  displayName: string;
  /** 主题偏好 */
  theme: "light" | "dark" | "system";
}
```

**行内注释**:
```tsx
// ✅ 正确 - 解释"为什么"
// 使用 requestAnimationFrame 确保在下一帧执行，避免阻塞渲染
requestAnimationFrame(() => {
  setHeight(newHeight);
});

// ❌ 错误 - 不要解释"是什么"
// 设置高度
setHeight(newHeight);
```

**TODO 注释**:
```tsx
// TODO: 后续需要添加错误重试机制
// FIXME: 这里有一个边界情况需要处理
// HACK: 临时解决方案，后续优化
```

### 16.4 TypeScript 规范

**类型定义**:
```tsx
// ✅ 正确
interface ButtonProps {
  variant?: "default" | "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// ❌ 错误
interface Props {           // 使用具体名称
  variant: string;          // 使用联合类型而非 string
  size: any;               // 禁止使用 any
}
```

**枚举使用**:
```tsx
// ✅ 正确 - 使用 const 对象替代 enum
const ThemeMode = {
  Light: "light",
  Dark: "dark",
  System: "system",
} as const;

type ThemeMode = typeof ThemeMode[keyof typeof ThemeMode];

// ❌ 错误
enum ThemeMode {           // 避免使用 enum
  Light = "light",
  Dark = "dark",
}
```

**函数返回类型**:
```tsx
// ✅ 正确
function useTheme(): ThemeContextType { }
async function fetchUser(id: string): Promise<User | null> { }

// ❌ 错误
function useTheme() { }    // 必须显式返回类型
```

### 16.5 React 组件规范

**组件定义**:
```tsx
// ✅ 正确
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Card Component
 * @description 卡片容器组件
 */
export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-xl", className)}>
      {children}
    </div>
  );
}
```

**Props 解构**:
```tsx
// ✅ 正确
export function Button({ 
  variant = "default", 
  size = "md", 
  disabled = false,
  children,
  ...props 
}: ButtonProps) {
  // ...
}

// ❌ 错误
export function Button(props: ButtonProps) {  // 直接解构
  const { variant, size } = props;
}
```

**Hooks 使用**:
```tsx
// ✅ 正确
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  
  useEffect(() => {
    // ...
  }, [key]);
  
  return [value, setValue] as const;
}

// ❌ 错误
function useData() {        // Hook 名必须以 use 开头
  const data = fetchData(); // 不要在 render 中直接调用异步
}
```

### 16.6 导入规范

**排序**:
```tsx
// 1. React/Next 内置
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. 第三方库
import { motion } from "framer-motion";
import { clsx } from "clsx";

// 3. 内部工具
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

// 4. 类型定义
import type { User, Theme } from "@/types";

// 5. 组件
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

**路径别名**:
```tsx
// ✅ 正确
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

// ❌ 错误
import { Button } from "../../../components/ui/button";  // 使用绝对路径
```

### 16.7 错误处理规范

**Try-Catch**:
```tsx
// ✅ 正确
async function loadConfig() {
  try {
    const config = await fetchConfig();
    return config;
  } catch (error) {
    console.error("Failed to load config:", error);
    return null;
  }
}

// ❌ 错误
async function loadConfig() {
  const config = await fetchConfig();  // 没有错误处理
  return config;
}
```

**Error Boundary**:
```tsx
// 组件级错误边界
"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

### 16.8 性能优化规范

**Memoization**:
```tsx
// ✅ 正确 - 复杂计算使用 useMemo
const filteredItems = useMemo(() => {
  return items.filter(item => item.active);
}, [items]);

// ✅ 正确 - 回调函数使用 useCallback
const handleClick = useCallback(() => {
  onSelect(id);
}, [id, onSelect]);

// ❌ 错误 - 简单计算不需要 useMemo
const count = useMemo(() => items.length, [items]);
```

**动态导入**:
```tsx
// ✅ 正确 - 大组件使用动态导入
const Chart = dynamic(() => import("./chart"), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});
```

---

## 17. 更新日志

### v1.1 (2026-03-07)

- 新增代码规范章节
- 定义文件命名规范
- 定义变量命名规范
- 定义代码注释规范
- 定义 TypeScript 规范
- 定义 React 组件规范
- 定义导入规范
- 定义错误处理规范
- 定义性能优化规范

### v1.0 (2026-03-07)

- 初始版本
- 定义颜色系统
- 定义字体系统
- 定义间距、圆角、阴影系统
- 定义动画规范
- 定义组件规范
- 添加深色模式支持
