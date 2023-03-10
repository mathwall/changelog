import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

import { info, log, warn } from "../../utils/logger";
import { defaultConfig } from "../../defaultConfig";

const stringifiedConfig = `${JSON.stringify({ ...defaultConfig }, null, 2)}\n`;

const readmeContent = `
# Changesets

Hello and welcome! This folder has been automatically generated by \`simple-changeset\`.

Use the \`simple-changeset add\` command to add a changeset file.
Use the \`simple-changeset version\` command to concatenate the changesets into your \`changelog\` file.

`;

export default async function init(cwd: string) {
  const changesetBase = path.resolve(cwd, ".changeset");

  if (fs.existsSync(changesetBase)) {
    if (!fs.existsSync(path.join(changesetBase, "config.json"))) {
      await fs.writeFile(
        path.resolve(changesetBase, "config.json"),
        stringifiedConfig
      );
    } else {
      warn(
        "It looks like you already have changesets initialized. You should be able to run changeset commands no problems."
      );
    }
  } else {
    fs.mkdirSync(changesetBase);
    await fs.writeFile(
      path.resolve(changesetBase, "config.json"),
      stringifiedConfig
    );
  }

  await fs.writeFile(path.resolve(changesetBase, "README.md"), readmeContent);

  log(
    chalk`Thanks for choosing {green simple-changeset} to help manage your versioning and publishing\n`
  );
  log("You should be set up to start using changesets now!\n");

  info(
    "We have added a `.changeset` folder, and a couple of files to help you out:"
  );
  info(
    chalk`- {blue .changeset/README.md} contains information about using changesets`
  );
  info(chalk`- {blue .changeset/config.json} is our default config`);
}
