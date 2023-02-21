import path from "path";
import * as git from "@changesets/git";
import { log, warn, error } from "../../utils/logger";
import readChangesets from "./readChangesets";
import assembleReleasePlan from "./assembleReleasePlan";
import applyReleasePlan from "./applyReleasePlan";

import { getVersionMessage } from "../../commit";
import extractOldVersion from "./extractOldVersion";

export default async function version(cwd: string) {
  const changesets = await readChangesets(cwd);
  if (changesets.length === 0) {
    warn("No unreleased changesets found, exiting.");
    return process.exit(1);
  }
  const oldVersion = await extractOldVersion(cwd);
  const releasePlan = assembleReleasePlan(changesets, oldVersion);

  const [...touchedFiles] = await applyReleasePlan(releasePlan, cwd);

  let touchedFile: string | undefined;
  // Note, git gets angry if you try and have two git actions running at once
  // So we need to be careful that these iterations are properly sequential
  while ((touchedFile = touchedFiles.shift())) {
    await git.add(path.relative(cwd, touchedFile), cwd);
  }

  const commit = await git.commit(await getVersionMessage(releasePlan), cwd);

  if (!commit) {
    error("Changesets ran into trouble committing your files");
  } else {
    log("All files have been updated and committed. You're ready to publish!");
  }
}
