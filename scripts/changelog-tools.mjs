function uniquePaths(paths) {
  return [...new Set(paths)];
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").trim();
}

function unquotePath(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function parseGitStatusPaths(statusText) {
  return uniquePaths(
    statusText
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(?:[ MADRCU?!]{1,2})\s+(.*)$/u);
        return (match?.[1] ?? line).trim();
      })
      .filter(Boolean)
      .map((pathText) => {
        const renamedPath = pathText.includes(" -> ")
          ? pathText.split(" -> ").at(-1)
          : pathText;

        return normalizePath(unquotePath(renamedPath ?? pathText));
      }),
  );
}

export function parseGitDiffPaths(diffText) {
  return uniquePaths(
    diffText
      .split(/\r?\n/u)
      .map((line) => normalizePath(unquotePath(line)))
      .filter(Boolean),
  );
}

export function evaluateChangelogRequirement(
  changedPaths,
  { changelogPath = "CHANGELOG.md" } = {},
) {
  const normalizedPaths = uniquePaths(
    changedPaths.map((value) => normalizePath(value)).filter(Boolean),
  );
  const hasChangelogUpdate = normalizedPaths.includes(changelogPath);
  const nonChangelogPaths = normalizedPaths.filter((value) => value !== changelogPath);
  const requiresChangelogUpdate = nonChangelogPaths.length > 0;

  if (!requiresChangelogUpdate) {
    return {
      ok: true,
      changedPaths: normalizedPaths,
      hasChangelogUpdate,
      nonChangelogPaths,
      requiresChangelogUpdate,
      message: "No non-changelog changes detected.",
    };
  }

  if (hasChangelogUpdate) {
    return {
      ok: true,
      changedPaths: normalizedPaths,
      hasChangelogUpdate,
      nonChangelogPaths,
      requiresChangelogUpdate,
      message: `${changelogPath} is updated alongside other changes.`,
    };
  }

  return {
    ok: false,
    changedPaths: normalizedPaths,
    hasChangelogUpdate,
    nonChangelogPaths,
    requiresChangelogUpdate,
    message: `${changelogPath} must be updated whenever other repository files change.`,
  };
}
