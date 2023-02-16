import yaml from "js-yaml";
import { Release, VersionType } from "../../types";

const mdRegex = /\s*---([^]*?)\n\s*---(\s*(?:\n|$)[^]*)/;

export default function parseChangesetFile(contents: string): {
  summary: string;
  releases: Release[];
} {
  const execResult = mdRegex.exec(contents);
  if (!execResult) {
    throw new Error(
      `could not parse changeset - invalid frontmatter: ${contents}`
    );
  }

  const [, roughReleases, roughSummary] = execResult;

  try {
    const summary = roughSummary.trim();

    const yamlReleases = yaml.load(roughReleases) as {
      [key: string]: VersionType;
    };

    const releases =
      yamlReleases &&
      Object.entries(yamlReleases).map(([name, type]) => ({
        name,
        type,
      }));

    if (!releases) {
      throw new Error(`could not parse changeset - unknown error: ${contents}`);
    }

    return { releases, summary };
  } catch (e) {
    throw new Error(
      `could not parse changeset - invalid frontmatter: ${contents}`
    );
  }
}
