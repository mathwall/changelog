import {
  ReleasePlan,
  NewChangeset,
  Changeset,
  ChangesetWithCommit,
} from "../../types";
import * as git from "@changesets/git";

import fs from "fs-extra";
import path from "path";
import {
  formatChangelogSections,
  getChangelogSections,
} from "./getChangelogEntry";
import { updateChangelog } from "./updateChangelog";

export default async function applyReleasePlan(
  releasePlan: ReleasePlan,
  cwd: string
): Promise<string[]> {
  const changesetBase = path.resolve(cwd, ".changeset");
  const config = await fs.readFile(
    path.join(changesetBase, "config.json"),
    "utf-8"
  );
  const parsedConfig = JSON.parse(config);

  const changesetsWithCommits = await getChangesetsCommits(
    releasePlan.changesets,
    cwd
  );

  const { newVersion } = releasePlan;
  const changelogSections = await getChangelogSections(
    changesetsWithCommits,
    parsedConfig.repo
  );
  const changelogEntry = formatChangelogSections(changelogSections);

  const changelogPath = path.resolve(cwd, parsedConfig.changelogPath);
  await updateChangelog(changelogPath, newVersion, changelogEntry);

  const versionFilePath = path.join(changesetBase, "version");
  await updateVersionFile(versionFilePath, newVersion);

  const touchedFiles = await deleteChangesetFiles(releasePlan.changesets, cwd);
  touchedFiles.push(changelogPath);
  touchedFiles.push(versionFilePath);

  return touchedFiles;
}

async function updateVersionFile(versionFilePath: string, newVersion: string) {
  await fs.writeFile(versionFilePath, newVersion);
}

async function deleteChangesetFiles(
  changesets: NewChangeset[],
  cwd: string
): Promise<string[]> {
  let changesetFolder = path.resolve(cwd, ".changeset");
  const changesetFiles: string[] = [];
  await Promise.all(
    changesets.map(async (changeset) => {
      let changesetPath = path.resolve(changesetFolder, `${changeset.id}.md`);
      if (await fs.pathExists(changesetPath)) {
        changesetFiles.push(changesetPath);
        await fs.remove(changesetPath);
      }
    })
  );
  return changesetFiles;
}

function stringDefined(s: string | undefined): s is string {
  return !!s;
}
async function getChangesetsCommits(
  changesets: NewChangeset[],
  cwd: string
): Promise<ChangesetWithCommit[] | Changeset[]> {
  const paths = changesets.map((changeset) => `.changeset/${changeset.id}.md`);
  const changesetsCommits = await git.getCommitsThatAddFiles(paths, {
    cwd,
    short: true,
  });

  if (changesetsCommits.every(stringDefined)) {
    // We have a commit corresponding to each changeset
    return changesets.map((cs, i) => ({
      ...cs,
      commit: changesetsCommits[i],
    }));
  }
  return changesets;
}
