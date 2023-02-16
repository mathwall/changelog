import {
  ChangelogSection,
  Changeset,
  ChangesetWithCommit,
  isChangesetWithCommit,
} from "../../types";
import { getGithubInfo } from "./getGithubInfo";

export async function getChangelogSections(
  changesetsWithCommits: ChangesetWithCommit[] | Changeset[],
  repo: string
): Promise<ChangelogSection[]> {
  const changelogSections: ChangelogSection[] = [];

  for (const changeset of changesetsWithCommits) {
    const releaseLine = await getReleaseLine(changeset, repo);
    for (const release of changeset.releases) {
      const subsectionContent = {
        type: release.type,
        changelogEntry: releaseLine,
      };

      const section = changelogSections.find(
        (section) => section.package === release.name
      );
      if (!section) {
        changelogSections.push({
          package: release.name,
          subsections: [subsectionContent],
        });
        break;
      }

      const subsection = section.subsections.find(
        (s) => s.type === release.type
      );
      if (subsection) {
        subsection.changelogEntry += `
${releaseLine}`;
      } else {
        section.subsections.push(subsectionContent);
      }
    }
  }
  return changelogSections;
}

export function formatChangelogSections(sections: ChangelogSection[]): string {
  return sections.reduce((acc, section) => {
    const packageDetail = section.subsections.reduce((acc, subsection) => {
      return (
        acc +
        `
${subsection.type} changes:
${subsection.changelogEntry}`
      );
    }, "");
    return (
      acc +
      `
### ${section.package}
${packageDetail}
    `
    );
  }, "");
}

const getReleaseLine = async (
  changeset: Changeset | ChangesetWithCommit,
  repo?: string
): Promise<string> => {
  if (!repo) {
    throw new Error(
      'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]'
    );
  }

  const [firstLine, ...futureLines] = changeset.summary
    .split("\n")
    .map((l) => l.trimEnd());

  const links = await (async () => {
    if (isChangesetWithCommit(changeset)) {
      let { links } = await getGithubInfo({
        repo: repo,
        commit: changeset.commit,
      });
      return links;
    }
    return {
      commit: null,
      pull: null,
      user: null,
    };
  })();

  const suffix = [
    links.pull === null ? "" : `${links.pull}`,
    links.user === null ? "" : ` Thanks ${links.user}!`,
  ].join("");

  return `- ${firstLine}\n${futureLines.map((l) => `  ${l}`).join("\n")}
  ${suffix ?? ""}`;
};
