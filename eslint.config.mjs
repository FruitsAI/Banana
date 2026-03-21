import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    // Rust/Tauri workspace and generated artifacts:
    "src-tauri/**",
    // Local worktrees and tool state:
    ".worktrees/**",
    ".agents/**",
    ".ai_memory/**",
    ".iflow/**",
    ".kiro/**",
    ".serena/**",
    ".trae/**",
  ]),
]);

export default eslintConfig;
