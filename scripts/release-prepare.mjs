#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReleaseTagPlan } from "./release-tools.mjs";
import {
  assertValidSemver,
  bumpSemver,
  readPackageVersion,
} from "./version-tools.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(repoRoot, "package.json");

function runNodeScript(scriptName, args = []) {
  return execFileSync(process.execPath, [path.join(__dirname, scriptName), ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function parseArguments(argv) {
  let releaseTarget = "patch";
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return { help: true, dryRun: false, releaseTarget };
    }

    releaseTarget = arg;
  }

  return {
    help: false,
    dryRun,
    releaseTarget,
  };
}

function isReleaseType(value) {
  return value === "patch" || value === "minor" || value === "major";
}

function resolveNextVersion(currentVersion, releaseTarget) {
  if (isReleaseType(releaseTarget)) {
    return {
      currentVersion,
      nextVersion: bumpSemver(currentVersion, releaseTarget),
      mode: releaseTarget,
    };
  }

  return {
    currentVersion,
    nextVersion: assertValidSemver(releaseTarget),
    mode: "set",
  };
}

function printUsage() {
  console.log(
    "Usage: node scripts/release-prepare.mjs [patch|minor|major|x.y.z] [--dry-run]",
  );
  console.log("Defaults to `patch` when no version target is provided.");
}

async function main() {
  const { help, dryRun, releaseTarget } = parseArguments(process.argv.slice(2));

  if (help) {
    printUsage();
    return;
  }

  const packageJsonText = await readFile(packageJsonPath, "utf8");
  const currentVersion = readPackageVersion(packageJsonText);
  const plan = resolveNextVersion(currentVersion, releaseTarget);
  const existingTagsOutput = git(["tag", "--list"]);
  const existingTags = existingTagsOutput
    ? existingTagsOutput.split(/\r?\n/u).filter(Boolean)
    : [];
  const tagPlan = buildReleaseTagPlan({
    version: plan.nextVersion,
    existingTags,
  });

  runNodeScript("changelog-manager.mjs", ["check"]);

  if (dryRun) {
    console.log(
      [
        "Dry run only. No files were changed.",
        `Current version: ${plan.currentVersion}`,
        `Next version: ${plan.nextVersion}`,
        `Bump mode: ${plan.mode}`,
        `Next release tag: ${tagPlan.tagName}`,
      ].join("\n"),
    );
    return;
  }

  if (plan.mode === "set") {
    runNodeScript("version-manager.mjs", ["set", plan.nextVersion]);
  } else {
    runNodeScript("version-manager.mjs", ["bump", plan.mode]);
  }

  const versionCheckOutput = runNodeScript("version-manager.mjs", ["check"]);
  const printedTag = runNodeScript("release-tag.mjs", ["--print"]);

  if (printedTag !== tagPlan.tagName) {
    throw new Error(
      `Release tag mismatch after version bump. Expected ${tagPlan.tagName}, received ${printedTag}.`,
    );
  }

  console.log(
    [
      `Prepared release version ${plan.nextVersion}.`,
      versionCheckOutput,
      `Next release tag: ${printedTag}`,
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown release-prepare failure.",
  );
  process.exit(1);
});
