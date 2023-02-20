import { ChangelogSection, Changeset, ChangesetWithCommit } from "../../types";
export declare function getChangelogSections(changesetsWithCommits: ChangesetWithCommit[] | Changeset[], repo: string): Promise<ChangelogSection[]>;
export declare function formatChangelogSections(sections: ChangelogSection[]): string;
