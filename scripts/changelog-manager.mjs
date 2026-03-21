#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateChangelogRequirement,
  parseGitDiffPaths,
  parseGitStatusPaths,
} from "./changelog-tools.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function parseArguments(argv) {
  const args = [...argv];
  const command = args.shift() ?? "check";
  const rangeIndex = args.indexOf("--range");
  const range =
    rangeIndex >= 0 && typeof args[rangeIndex + 1] === "string"
      ? args[rangeIndex + 1]
      : undefined;

  return { command, range };
}

function readChangedPaths(range) {
  if (range) {
    return parseGitDiffPaths(git(["diff", "--name-only", range]));
  }

  return parseGitStatusPaths(
    git(["status", "--short", "--untracked-files=normal"]),
  );
}

function printFailure(result, range) {
  console.error(result.message);
  console.error("");
  console.error(
    range
      ? `Checked diff range: ${range}`
      : "Checked current working tree changes.",
  );
  console.error("Changed files:");

  for (const changedPath of result.nonChangelogPaths) {
    console.error(`- ${changedPath}`);
  }

  console.error("");
  console.error(
    "Update CHANGELOG.md in Keep a Changelog format with bilingual entries before committing or releasing.",
  );
}

function printSuccess(result, range) {
  console.log(result.message);
  console.log(
    range
      ? `Checked diff range: ${range}`
      : "Checked current working tree changes.",
  );
}

async function main() {
  const { command, range } = parseArguments(process.argv.slice(2));

  if (command !== "check") {
    throw new Error("Usage: node scripts/changelog-manager.mjs check [--range A...B]");
  }

  const result = evaluateChangelogRequirement(readChangedPaths(range));

  if (!result.ok) {
    printFailure(result, range);
    process.exit(1);
  }

  printSuccess(result, range);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown changelog-manager failure.",
  );
  process.exit(1);
});
