import chalk from "chalk";
import path from "path";
import { spawn } from "child_process";

import * as cli from "../../utils/cli-utilities";
import * as git from "@changesets/git";
import { info, log, warn } from "../../utils/logger";
import packages from "../../packages";
import writeChangeset from "./writeChangeset";

import createChangeset from "./createChangeset";
import printConfirmationMessage from "./messages";
import { ExternalEditor } from "external-editor";
import { getAddMessage } from "../../commit/index";

export default async function add(cwd: string, open?: boolean) {
  const changesetBase = path.resolve(cwd, ".changeset");

  const newChangeset = await createChangeset(packages);
  printConfirmationMessage(newChangeset);

  const isChangesetConfirmed = await cli.askConfirm(
    "Is this your desired changeset?"
  );

  if (isChangesetConfirmed) {
    const changesetID = await writeChangeset(newChangeset, cwd);

    await git.add(path.resolve(changesetBase, `${changesetID}.md`), cwd);

    const commitMessage = await getAddMessage(newChangeset);
    await git.commit(commitMessage, cwd);

    log(chalk.green(`Changeset added and committed`));

    const hasMajorChange = [...newChangeset.releases].find(
      (c) => c.type === "major"
    );

    if (hasMajorChange) {
      warn(
        "This Changeset includes a major change and we STRONGLY recommend adding more information to the changeset:"
      );
      warn("WHAT the breaking change is");
      warn("WHY the change was made");
      warn("HOW a consumer should update their code");
    } else {
      log(
        chalk.green(
          "If you want to modify or expand on the changeset summary, you can find it here"
        )
      );
    }
    const changesetPath = path.resolve(changesetBase, `${changesetID}.md`);
    info(chalk.blue(changesetPath));

    if (open) {
      // this is really a hack to reuse the logic embedded in `external-editor` related to determining the editor
      const externalEditor = new ExternalEditor();
      externalEditor.cleanup();
      spawn(
        externalEditor.editor.bin,
        externalEditor.editor.args.concat([changesetPath]),
        {
          detached: true,
          stdio: "inherit",
        }
      );
    }
  }
}
