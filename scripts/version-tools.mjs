const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/u;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCargoPackageSection(cargoTomlText) {
  const packageHeaderMatch = cargoTomlText.match(/^\[package\]\s*$/mu);
  if (!packageHeaderMatch || packageHeaderMatch.index === undefined) {
    throw new Error("Could not find the [package] section in src-tauri/Cargo.toml.");
  }

  const sectionStart = packageHeaderMatch.index;
  const bodyStart = sectionStart + packageHeaderMatch[0].length;
  const remainingText = cargoTomlText.slice(bodyStart);
  const nextSectionMatch = remainingText.match(/^\[[^\]]+\]\s*$/mu);
  const sectionEnd =
    nextSectionMatch && nextSectionMatch.index !== undefined
      ? bodyStart + nextSectionMatch.index
      : cargoTomlText.length;

  return {
    sectionStart,
    sectionEnd,
    sectionText: cargoTomlText.slice(sectionStart, sectionEnd),
  };
}

export function assertValidSemver(version) {
  if (!SEMVER_PATTERN.test(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return version;
}

export function bumpSemver(version, releaseType) {
  assertValidSemver(version);

  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/u);
  if (!match) {
    throw new Error(
      `Automatic bump only supports plain x.y.z versions. Received: ${version}`,
    );
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (releaseType) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      throw new Error(
        `Unsupported release type: ${releaseType}. Use patch, minor, or major.`,
      );
  }
}

export function readPackageVersion(packageJsonText) {
  const packageJson = JSON.parse(packageJsonText);
  const version = packageJson?.version;

  if (typeof version !== "string" || version.trim().length === 0) {
    throw new Error("package.json is missing a valid version field.");
  }

  return assertValidSemver(version);
}

export function setPackageVersion(packageJsonText, nextVersion) {
  assertValidSemver(nextVersion);

  const packageJson = JSON.parse(packageJsonText);
  packageJson.version = nextVersion;

  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

export function readCargoTomlVersion(cargoTomlText) {
  const { sectionText } = getCargoPackageSection(cargoTomlText);
  const match = sectionText.match(/^\s*version = "([^"]+)"\s*$/mu);
  if (!match) {
    throw new Error("Could not find the package version in src-tauri/Cargo.toml.");
  }

  return match[1];
}

export function setCargoTomlVersion(cargoTomlText, nextVersion) {
  assertValidSemver(nextVersion);

  const { sectionStart, sectionEnd, sectionText } =
    getCargoPackageSection(cargoTomlText);
  let replaced = false;
  const nextSectionText = sectionText.replace(
    /^\s*version = "([^"]+)"\s*$/mu,
    () => {
      replaced = true;
      return `version = "${nextVersion}"`;
    },
  );

  if (!replaced) {
    throw new Error("Could not update the package version in src-tauri/Cargo.toml.");
  }

  return `${cargoTomlText.slice(0, sectionStart)}${nextSectionText}${cargoTomlText.slice(
    sectionEnd,
  )}`;
}

export function readCargoLockVersion(cargoLockText, cargoPackageName) {
  const pattern = new RegExp(
    `\\[\\[package\\]\\]\\r?\\nname = "${escapeRegExp(
      cargoPackageName,
    )}"\\r?\\nversion = "([^"]+)"`,
    "u",
  );
  const match = cargoLockText.match(pattern);

  if (!match) {
    throw new Error(
      `Could not find package ${cargoPackageName} in src-tauri/Cargo.lock.`,
    );
  }

  return match[1];
}

export function setCargoLockVersion(cargoLockText, cargoPackageName, nextVersion) {
  assertValidSemver(nextVersion);

  const pattern = new RegExp(
    `(\\[\\[package\\]\\]\\r?\\nname = "${escapeRegExp(
      cargoPackageName,
    )}"\\r?\\nversion = )"[^"]+"`,
    "u",
  );

  if (!pattern.test(cargoLockText)) {
    throw new Error(
      `Could not update package ${cargoPackageName} in src-tauri/Cargo.lock.`,
    );
  }

  return cargoLockText.replace(pattern, `$1"${nextVersion}"`);
}

export function syncProjectVersions({
  packageJsonText,
  cargoTomlText,
  cargoLockText,
  cargoPackageName,
}) {
  const packageVersion = readPackageVersion(packageJsonText);
  const cargoTomlVersion = readCargoTomlVersion(cargoTomlText);
  const cargoLockVersion = readCargoLockVersion(cargoLockText, cargoPackageName);
  const isInSync =
    packageVersion === cargoTomlVersion && packageVersion === cargoLockVersion;

  return {
    packageVersion,
    cargoTomlVersion,
    cargoLockVersion,
    isInSync,
    nextCargoTomlText: setCargoTomlVersion(cargoTomlText, packageVersion),
    nextCargoLockText: setCargoLockVersion(
      cargoLockText,
      cargoPackageName,
      packageVersion,
    ),
  };
}
