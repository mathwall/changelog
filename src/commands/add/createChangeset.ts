import chalk from "chalk";

import * as cli from "../../utils/cli-utilities";
import { error, log } from "../../utils/logger";
import { Release, Changeset, VersionType } from "../../types";

async function getPackagesToRelease(
  packages: Array<string>
): Promise<string[]> {
  function askInitialReleaseQuestion(defaultChoiceList: Array<any>) {
    return cli.askCheckboxPlus(
      `Which packages would you like to include?`,
      defaultChoiceList
    );
  }

  if (packages.length > 1) {
    const defaultChoiceList = [
      {
        name: "Available packages",
        choices: packages,
      },
    ];

    let packagesToRelease = await askInitialReleaseQuestion(defaultChoiceList);

    if (packagesToRelease.length === 0) {
      do {
        error("You must select at least one package to release");
        error("(You most likely hit enter instead of space!)");

        packagesToRelease = await askInitialReleaseQuestion(defaultChoiceList);
      } while (packagesToRelease.length === 0);
    }

    return packagesToRelease;
  }
  return [packages[0]];
}

async function getReleaseType(): Promise<VersionType> {
  return cli.askList(`What kind of release should it be ?`, [
    "patch",
    "minor",
    "major",
  ]);
}

async function getReleaseSummary(): Promise<string> {
  log(
    "Please enter a summary for this change (this will be in the changelogs)."
  );
  log(chalk.gray("  (submit empty line to open external editor)"));

  let summary = await cli.askQuestion("Summary");
  if (summary.length === 0) {
    try {
      summary = cli.askQuestionWithEditor(
        "\n\n# Please enter a summary for your changes.\n# An empty message aborts the editor."
      );
      if (summary.length > 0) {
        return summary;
      }
    } catch (err) {
      log(
        "An error happened using external editor. Please type your summary here:"
      );
    }

    summary = await cli.askQuestion("");
    while (summary.length === 0) {
      summary = await cli.askQuestion(
        "\n\n# A summary is required for the changelog! 😪"
      );
    }
  }
  return summary;
}

export default async function createChangeset(
  packages: string[]
): Promise<Changeset> {
  const releases: Array<Release> = [];

  const packagesToRelease = await getPackagesToRelease(packages);
  const releaseType = await getReleaseType();

  for (const packageToRelease of packagesToRelease) {
    releases.push({ name: packageToRelease, type: releaseType });
  }
  const summary = await getReleaseSummary();

  return {
    summary,
    releases,
  };
}
