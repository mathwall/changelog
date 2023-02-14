import yaml from "js-yaml";
import { Summary, Release, VersionType, SummaryType } from "../../types";

const mdRegex = /\s*---([^]*?)\n\s*---(\s*(?:\n|$)[^]*)/;

export default function parseChangesetFile(contents: string): {
  summary: Summary;
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
    const yamlReleases = yaml.load(roughReleases) as {
      [key: string]: VersionType;
    };
    const yamlSummary = yaml.load(roughSummary) as {
      [key: string]: VersionType;
    };

    const releases =
      yamlReleases &&
      Object.entries(yamlReleases).map(([name, type]) => ({
        name,
        type,
      }));
    const summaryType =
      yamlSummary && (Object.keys(yamlSummary)[0] as SummaryType);
    const summary = { type: summaryType, detail: yamlSummary[summaryType] };

    if (!releases || !summary) {
      throw new Error(`could not parse changeset - unknown error: ${contents}`);
    }

    return { releases, summary };
  } catch (e) {
    throw new Error(
      `could not parse changeset - invalid frontmatter: ${contents}`
    );
  }
}
