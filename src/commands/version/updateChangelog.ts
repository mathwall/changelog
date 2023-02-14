import fs from "fs-extra";

export async function updateChangelog(
  changelogPath: string,
  newVersion: string,
  changelog: string
) {
  const templateString = `\n${changelog.trim()}\n`;

  try {
    if (fs.existsSync(changelogPath)) {
      await prependFile(changelogPath, newVersion, templateString);
    } else {
      await writeFormattedMarkdownFile(
        changelogPath,
        `## ${newVersion}${templateString}`
      );
    }
  } catch (e) {
    console.warn(e);
  }
}

async function prependFile(
  filePath: string,
  newVersion: string,
  detail: string
) {
  const fileData = fs.readFileSync(filePath).toString();
  // if the file exists but doesn't have the header, we'll add it in
  if (!fileData) {
    const completelyNewChangelog = `
## ${newVersion}${detail}`;
    await writeFormattedMarkdownFile(filePath, completelyNewChangelog);
    return;
  }
  const today = new Date();
  const newChangelog = fileData.replace(
    "\n",
    `
  
## [${newVersion}] ${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}
  
  ${detail}`
  );

  await writeFormattedMarkdownFile(filePath, newChangelog);
}

async function writeFormattedMarkdownFile(filePath: string, content: string) {
  await fs.writeFile(filePath, content);
}
