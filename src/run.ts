import fs from "fs-extra";
import path from "path";
import { error } from "./utils/logger";
import { ExitError } from "@changesets/errors";

import init from "./commands/init";
import add from "./commands/add";
import version from "./commands/version";
import { CliOptions } from "./types";

export async function run(
  input: string[],
  flags: { [name: string]: any },
  cwd: string
) {
  if (input[0] === "init") {
    await init(cwd);
    return;
  }

  if (!fs.existsSync(path.resolve(cwd, ".changeset"))) {
    error("There is no .changeset folder. ");
    error(
      "If this is the first time `changesets` have been used in this project, run `yarn changeset init` to get set up."
    );
    error(
      "If you expected there to be changesets, you should check git history for when the folder was removed to ensure you do not lose any configuration."
    );
    throw new ExitError(1);
  }

  if (input.length < 1) {
    const { open }: CliOptions = flags;
    await add(cwd, open);
  } else if (input[0] !== "pre" && input.length > 1) {
    error(
      "Too many arguments passed to changesets - we only accept the command name as an argument"
    );
  } else {
    const { open }: CliOptions = flags;

    switch (input[0]) {
      case "add": {
        await add(cwd, open);
        return;
      }
      case "version": {
        await version(cwd);
        return;
      }
      default: {
        error(`Invalid command ${input[0]} was provided`);
        throw new ExitError(1);
      }
    }
  }
}
