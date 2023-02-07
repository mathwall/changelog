import chalk from "chalk";
import { log } from "../../utils/logger";
import { Changeset, VersionType } from "../../types";

export default function printConfirmationMessage(changeset: Changeset) {
  function getReleasesOfType(type: VersionType) {
    return changeset.releases
      .filter((release) => release.type === type)
      .map((release) => release.name);
  }
  log("\n=== Summary of changesets ===");
  const majorReleases = getReleasesOfType("major");
  const minorReleases = getReleasesOfType("minor");
  const patchReleases = getReleasesOfType("patch");

  if (majorReleases.length > 0)
    log(`${chalk.bold.green("major")}:  ${majorReleases.join(", ")}`);
  if (minorReleases.length > 0)
    log(`${chalk.bold.green("minor")}:  ${minorReleases.join(", ")}`);
  if (patchReleases.length > 0)
    log(`${chalk.bold.green("patch")}:  ${patchReleases.join(", ")}`);
}
