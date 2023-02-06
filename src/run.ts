import fs from "fs-extra";
import path from "path";
import { error } from "./utils/logger";
import { ExitError } from "@changesets/errors";

import init from "./commands/init";
import add from "./commands/add";
// import version from "./commands/version";
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

}
