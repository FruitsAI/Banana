import { assertValidSemver } from "./version-tools.mjs";

export function releaseTagFromVersion(version) {
  assertValidSemver(version);
  return `v${version}`;
}

export function buildReleaseTagMessage(version) {
  return `Release ${releaseTagFromVersion(version)}`;
}

export function buildReleaseTagPlan({ version, existingTags }) {
  const tagName = releaseTagFromVersion(version);

  if (existingTags.includes(tagName)) {
    throw new Error(`Git tag already exists: ${tagName}`);
  }

  return {
    tagName,
    tagMessage: buildReleaseTagMessage(version),
  };
}

export function assertReleaseVersionMatchesProjectVersion({
  expectedVersion,
  projectVersion,
}) {
  assertValidSemver(expectedVersion);
  assertValidSemver(projectVersion);

  if (expectedVersion !== projectVersion) {
    throw new Error(
      `Release version mismatch: requested ${expectedVersion}, but package.json is ${projectVersion}.`,
    );
  }
}
