export type CliOptions = {
  // opens the created changeset in an external editor
  open?: boolean;
};

export type VersionType = "major" | "minor" | "patch" | "none";

export type InternalRelease = {
  name: string;
  type: VersionType;
  oldVersion: string;
  changesets: string[];
};

export type Release = { name: string; type: VersionType };

export type SummaryType =
  | "added"
  | "removed"
  | "changed"
  | "fixed"
  | "security"
  | "deprecated";

export type Summary = { type: SummaryType; detail: string };

export declare type Changeset = {
  summary: Summary;
  releases: Array<Release>;
};
export declare type NewChangeset = Changeset & {
  id: string;
};

export type ComprehensiveRelease = {
  name: string;
  type: VersionType;
  oldVersion: string;
  newVersion: string;
  changesets: string[];
};

export type ReleasePlan = {
  newVersion: string;
  changesets: NewChangeset[];
  releases: ComprehensiveRelease[];
};

export declare type Config = {
  changelogPath: string;
  baseBranch: string;
};
