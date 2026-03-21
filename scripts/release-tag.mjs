#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReleaseTagPlan } from "./release-tools.mjs";
import { readPackageVersion, syncProjectVersions } from "./version-tools.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const cargoTomlPath = path.join(repoRoot, "src-tauri", "Cargo.toml");
const cargoLockPath = path.join(repoRoot, "src-tauri", "Cargo.lock");
const cargoPackageName = "Banana";

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function readProjectVersionState() {
  const [packageJsonText, cargoTomlText, cargoLockText] = await Promise.all([
    readFile(packageJsonPath, "utf8"),
    readFile(cargoTomlPath, "utf8"),
    readFile(cargoLockPath, "utf8"),
  ]);

  return syncProjectVersions({
    packageJsonText,
    cargoTomlText,
    cargoLockText,
    cargoPackageName,
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const printOnly = args.has("--print");
  const pushAfterCreate = args.has("--push");

  const versionState = await readProjectVersionState();
  if (!versionState.isInSync) {
    throw new Error(
      "Version metadata is out of sync. Run `pnpm version:sync` before tagging.",
    );
  }

  const packageVersion = readPackageVersion(
    await readFile(packageJsonPath, "utf8"),
  );
  const existingTagsOutput = git(["tag", "--list"]);
  const existingTags = existingTagsOutput
    ? existingTagsOutput.split(/\r?\n/u).filter(Boolean)
    : [];

  const plan = buildReleaseTagPlan({
    version: packageVersion,
    existingTags,
  });

  if (printOnly) {
    console.log(plan.tagName);
    return;
  }

  git(["tag", "-a", plan.tagName, "-m", plan.tagMessage]);

  if (pushAfterCreate) {
    git(["push", "origin", plan.tagName]);
    console.log(`Created and pushed tag ${plan.tagName}.`);
    return;
  }

  console.log(`Created local tag ${plan.tagName}.`);
  console.log(`Push it with: git push origin ${plan.tagName}`);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown release-tag failure.",
  );
  process.exit(1);
});
