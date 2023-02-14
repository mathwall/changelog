import path from "path";
import fs from "fs-extra";
import MarkdownIt from "markdown-it";

const err = "Could not parse CHANGELOG.md to find last version.";

export default async function extractOldVersion(cwd: string): Promise<string> {
  const changesetBase = path.resolve(cwd, ".changeset");
  const config = await fs.readFile(
    path.join(changesetBase, "config.json"),
    "utf-8"
  );
  const parsedConfig = JSON.parse(config);
  const changelog = await fs.readFile(
    path.join(cwd, parsedConfig.changelogPath),
    "utf-8"
  );
  const md = new MarkdownIt();
  const parsedChangelog = md.parse(changelog, {});
  const firstH2Tag = parsedChangelog.find((token) => token.markup === "##");
  if (!firstH2Tag) {
    // This could happen if it was the first changelog entry ever written
    // version would be 0.0.0
    // but this is not our case so let's do a MVP and not handle that case
    throw err;
  }

  const lastVersionToken = parsedChangelog.find(
    (token) =>
      token.type === "inline" &&
      token.map &&
      firstH2Tag.map &&
      token.map[0] === firstH2Tag.map[0] &&
      token.map[1] === firstH2Tag.map[1]
  );
  if (!lastVersionToken) {
    throw err;
  }

  const lastVersionText = lastVersionToken?.content;
  const re = /\[(.*)\]/;
  const extractedLastVersion = lastVersionText && re.exec(lastVersionText);
  if (!extractedLastVersion) {
    throw err;
  }

  return extractedLastVersion[1];
}
