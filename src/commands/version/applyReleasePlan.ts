import {
  Config,
  ReleasePlan,
  NewChangeset,
  ComprehensiveRelease,
  Summary,
} from "../../types";
import { ChangelogFunctions, ModCompWithPackage } from "@changesets/types";
import { defaultConfig } from "../../defaultConfig";
import * as git from "@changesets/git";
import resolveFrom from "resolve-from";
import { Packages } from "@manypkg/get-packages";
import detectIndent from "detect-indent";

import fs from "fs-extra";
import path from "path";

function stringDefined(s: string | undefined): s is string {
  return !!s;
}
async function getCommitsThatAddChangesets(
  changesetIds: string[],
  cwd: string
): Promise<string[]> {
  const paths = changesetIds.map((id) => `.changeset/${id}.md`);
  const changesetsCommits = await git.getCommitsThatAddFiles(paths, {
    cwd,
    short: true,
  });

  if (changesetsCommits.every(stringDefined)) {
    // We have commits for all files
    return changesetsCommits;
  }
  return [];
}

export default async function applyReleasePlan(
  releasePlan: ReleasePlan,
  cwd: string
) {
  const changesetBase = path.resolve(cwd, ".changeset");
  const config = await fs.readFile(
    path.join(changesetBase, "config.json"),
    "utf-8"
  );
  const parsedConfig = JSON.parse(config);

  let touchedFiles = [];

  const { newVersion } = releasePlan;
  const changelogEntry = await getNewChangelogEntry(
    releasePlan.releases,
    releasePlan.changesets,
    cwd
  );

  const changelogPath = path.resolve(cwd, parsedConfig.changelogPath);
  await updateChangelog(changelogPath, newVersion, changelogEntry);
  touchedFiles.push(changelogPath);

  // We return the touched files to be committed in the cli
  return touchedFiles;
}

async function getNewChangelogEntry(
  releases: ComprehensiveRelease[],
  changesets: NewChangeset[],
  cwd: string
) {
  const commits = await getCommitsThatAddChangesets(
    changesets.map((cs) => cs.id),
    cwd
  );

  const changelogEntriesPerPackage = releases.map((release) => {
    const changesetsSummaries = release.changesets.map((changesetId) => {
      return changesets.find((c) => c.id === changesetId)?.summary;
    });

    const changeDetails = changesetsSummaries.reduce(
      (acc: Summary[], summary: Summary | undefined): Summary[] => {
        if (!summary) return acc;
        const entry = acc.find((s) => s.type === summary.type);
        const formattedDetail = `- ${summary.detail}`;
        if (entry) {
          entry.detail += `
${formattedDetail}`;
        } else {
          acc.push({ type: summary.type, detail: formattedDetail });
        }
        return acc;
      },
      [] as Summary[]
    );
    const formattedDetails = changeDetails
      .map((changeDetail) => {
        return `\`${changeDetail.type}\`

${changeDetail.detail}`;
      })
      .reduce(
        (acc, section) => `${acc}

${section}`,
        ""
      );

    return `### ${release.name}
${formattedDetails}`;
  });

  return changelogEntriesPerPackage.reduce(
    (changelog, packageEntry) => `${changelog}
  
${packageEntry}`,
    ""
  );
}

async function updateChangelog(
  changelogPath: string,
  newVersion: string,
  changelog: string
) {
  const templateString = `\n\n${changelog.trim()}\n`;

  try {
    if (fs.existsSync(changelogPath)) {
      await prependFile(changelogPath, newVersion, templateString);
    } else {
      await writeFormattedMarkdownFile(
        changelogPath,
        `## ${newVersion}${templateString}`
      );
    }
  } catch (e) {
    console.warn(e);
  }
}

async function prependFile(
  filePath: string,
  newVersion: string,
  detail: string
) {
  const fileData = fs.readFileSync(filePath).toString();
  // if the file exists but doesn't have the header, we'll add it in
  if (!fileData) {
    const completelyNewChangelog = `
## ${newVersion}${detail}`;
    await writeFormattedMarkdownFile(filePath, completelyNewChangelog);
    return;
  }
  const today = new Date();
  const newChangelog = fileData.replace(
    "\n",
    `

## [${newVersion}] ${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}

${detail}`
  );

  await writeFormattedMarkdownFile(filePath, newChangelog);
}

async function writeFormattedMarkdownFile(filePath: string, content: string) {
  await fs.writeFile(filePath, content);
}
