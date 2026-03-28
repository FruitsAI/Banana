import packageJson from "../../package.json";

type RepositoryConfig =
  | {
      type?: string;
      url?: string;
    }
  | string
  | undefined;

export interface AppLink {
  description: string;
  label: string;
  url: string;
  value: string;
}

export interface AppAboutFact {
  description: string;
  title: string;
}

function readPackageVersion() {
  return typeof packageJson.version === "string" && packageJson.version.trim().length > 0
    ? packageJson.version
    : "0.0.0";
}

function readRepositoryUrl(repository: RepositoryConfig) {
  const rawUrl =
    typeof repository === "string"
      ? repository
      : typeof repository?.url === "string"
        ? repository.url
        : "https://github.com/FruitsAI/Banana";

  return rawUrl.replace(/^git\+/u, "").replace(/\.git$/u, "");
}

export const APP_NAME = "Banana";
export const APP_TAGLINE = "Tiny AI Assistant";
export const APP_VERSION = readPackageVersion();
export const APP_DISPLAY_VERSION = `v${APP_VERSION}`;
export const APP_COPYRIGHT_OWNER = "Fruits AI";
export const APP_COPYRIGHT_YEAR = new Date().getFullYear();
export const APP_ABOUT_DESCRIPTION =
  "本地优先的桌面 AI 助手，让会话、模型与 MCP 工具在同一处协作。";

export const APP_ABOUT_FACTS: AppAboutFact[] = [
  {
    title: "本地优先",
    description: "会话、模型配置与 MCP 服务器配置默认保存在本地，适合持续使用与桌面工作流。",
  },
  {
    title: "多模型接入",
    description: "可按 Provider 管理模型、连接状态与默认选择，让不同模型在同一应用内切换协作。",
  },
  {
    title: "MCP 工具扩展",
    description: "支持配置 MCP Server、发现工具并在对话中调用，让 Banana 接上更多外部能力。",
  },
];

export const APP_ABOUT_TECH_BADGES = [
  "Tauri 2",
  "Next.js",
  "Vercel AI SDK",
  "TypeScript",
] as const;

export const APP_LINKS: AppLink[] = [
  {
    description: "访问 Banana 官方站点，了解产品介绍与最新公开信息。",
    label: "官方网站",
    url: "https://banana.willxue.com",
    value: "banana.willxue.com",
  },
  {
    description: "查看源码仓库、开发进展与 issue / PR 协作记录。",
    label: "GitHub",
    url: readRepositoryUrl(packageJson.repository as RepositoryConfig),
    value: "github.com/FruitsAI/Banana",
  },
  {
    description: "阅读产品与使用文档，了解配置方式与功能说明。",
    label: "文档",
    url: "https://docs.banana.willxue.com",
    value: "docs.banana.willxue.com",
  },
];
