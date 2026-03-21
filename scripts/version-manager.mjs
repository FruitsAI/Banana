#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertValidSemver,
  bumpSemver,
  readPackageVersion,
  setPackageVersion,
  syncProjectVersions,
} from "./version-tools.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const cargoTomlPath = path.join(repoRoot, "src-tauri", "Cargo.toml");
const cargoLockPath = path.join(repoRoot, "src-tauri", "Cargo.lock");
const cargoPackageName = "Banana";

async function readProjectFiles() {
  const [packageJsonText, cargoTomlText, cargoLockText] = await Promise.all([
    readFile(packageJsonPath, "utf8"),
    readFile(cargoTomlPath, "utf8"),
    readFile(cargoLockPath, "utf8"),
  ]);

  return {
    packageJsonText,
    cargoTomlText,
    cargoLockText,
  };
}

async function writeSyncedProjectFiles({
  packageJsonText,
  cargoTomlText,
  cargoLockText,
}) {
  await Promise.all([
    writeFile(packageJsonPath, packageJsonText),
    writeFile(cargoTomlPath, cargoTomlText),
    writeFile(cargoLockPath, cargoLockText),
  ]);
}

async function syncFromPackageVersion() {
  const files = await readProjectFiles();
  const synced = syncProjectVersions({
    ...files,
    cargoPackageName,
  });

  await writeSyncedProjectFiles({
    packageJsonText: files.packageJsonText,
    cargoTomlText: synced.nextCargoTomlText,
    cargoLockText: synced.nextCargoLockText,
  });

  console.log(
    synced.isInSync
      ? `Versions already aligned at ${synced.packageVersion}.`
      : `Synchronized Cargo metadata to ${synced.packageVersion}.`,
  );
}

async function checkVersions() {
  const files = await readProjectFiles();
  const synced = syncProjectVersions({
    ...files,
    cargoPackageName,
  });

  if (!synced.isInSync) {
    console.error("Version drift detected:");
    console.error(`- package.json: ${synced.packageVersion}`);
    console.error(`- src-tauri/Cargo.toml: ${synced.cargoTomlVersion}`);
    console.error(`- src-tauri/Cargo.lock: ${synced.cargoLockVersion}`);
    console.error("Run `pnpm version:sync` to align Cargo metadata.");
    process.exit(1);
  }

  console.log(`Version metadata is in sync at ${synced.packageVersion}.`);
}

async function setVersion(nextVersion) {
  assertValidSemver(nextVersion);

  const files = await readProjectFiles();
  const nextPackageJsonText = setPackageVersion(files.packageJsonText, nextVersion);
  const synced = syncProjectVersions({
    packageJsonText: nextPackageJsonText,
    cargoTomlText: files.cargoTomlText,
    cargoLockText: files.cargoLockText,
    cargoPackageName,
  });

  await writeSyncedProjectFiles({
    packageJsonText: nextPackageJsonText,
    cargoTomlText: synced.nextCargoTomlText,
    cargoLockText: synced.nextCargoLockText,
  });

  console.log(`Set project version to ${nextVersion}.`);
}

async function bumpVersion(releaseType) {
  const { packageJsonText } = await readProjectFiles();
  const currentVersion = readPackageVersion(packageJsonText);
  const nextVersion = bumpSemver(currentVersion, releaseType);
  await setVersion(nextVersion);
}

async function main() {
  const [command, value] = process.argv.slice(2);

  switch (command) {
    case "check":
      await checkVersions();
      return;
    case "sync":
      await syncFromPackageVersion();
      return;
    case "set":
      if (!value) {
        throw new Error("Usage: node scripts/version-manager.mjs set <x.y.z>");
      }
      await setVersion(value);
      return;
    case "bump":
      if (!value) {
        throw new Error(
          "Usage: node scripts/version-manager.mjs bump <patch|minor|major>",
        );
      }
      await bumpVersion(value);
      return;
    default:
      throw new Error(
        "Usage: node scripts/version-manager.mjs <check|sync|set|bump> [value]",
      );
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown version-manager failure.",
  );
  process.exit(1);
});
