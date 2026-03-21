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
