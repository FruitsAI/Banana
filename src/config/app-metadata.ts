import packageJson from "../../package.json";

type RepositoryConfig =
  | {
      type?: string;
      url?: string;
    }
  | string
  | undefined;

export interface AppLink {
  label: string;
  url: string;
  value: string;
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

export const APP_LINKS: AppLink[] = [
  {
    label: "官方网站",
    url: "https://banana.willxue.com",
    value: "banana.willxue.com",
  },
  {
    label: "GitHub",
    url: readRepositoryUrl(packageJson.repository as RepositoryConfig),
    value: "github.com/FruitsAI/Banana",
  },
  {
    label: "文档",
    url: "https://docs.banana.willxue.com",
    value: "docs.banana.willxue.com",
  },
];
