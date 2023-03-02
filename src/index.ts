import meow from "meow";
import { ExitError, InternalError } from "@changesets/errors";
import { error } from "./utils/logger";
import { run } from "./run";

const importMeta = {
  url: require('url').pathToFileURL(__filename).toString()
} as const

// TODO update the flags and documentation
const { input, flags } = meow(
  `
  Usage
    $ simple-changeset [command]
  Commands
    init
    add [--empty] [--open]
    version [--ignore] [--snapshot <?name>] [--snapshot-prerelease-template <template>]
    `,
  {
    importMeta: importMeta,
    flags: {
      sinceMaster: {
        type: "boolean",
      },
      verbose: {
        type: "boolean",
        alias: "v",
      },
      output: {
        type: "string",
        alias: "o",
      },
      otp: {
        type: "string",
      },
      empty: {
        type: "boolean",
      },
      since: {
        type: "string",
      },
      ignore: {
        type: "string",
        isMultiple: true,
      },
      tag: {
        type: "string",
      },
      open: {
        type: "boolean",
      },
      gitTag: {
        type: "boolean",
        default: true,
      },
      snapshotPrereleaseTemplate: {
        type: "string",
      },
      // mixed type like this is not supported by `meow`
      // if it gets passed explicitly then it's still available on the flags with an inferred type though
      // snapshot: { type: "boolean" | "string" },
    },
  }
);

const cwd = process.cwd();

run(input, flags, cwd).catch((err) => {
  if (err instanceof InternalError) {
    error(
      "The following error is an internal unexpected error, these should never happen."
    );
  }
  if (err instanceof ExitError) {
    return process.exit(err.code);
  }
  error(err);
  process.exit(1);
});
