export declare type CliOptions = {
    open?: boolean;
};
export declare type VersionType = "major" | "minor" | "patch" | "none";
export declare type InternalRelease = {
    name: string;
    type: VersionType;
    oldVersion: string;
    changesets: string[];
};
export declare type Release = {
    name: string;
    type: VersionType;
};
export declare type Changeset = {
    summary: string;
    releases: Array<Release>;
};
export declare type NewChangeset = Changeset & {
    id: string;
};
export declare interface ChangesetWithCommit extends Changeset {
    commit: string;
}
export declare const isChangesetWithCommit: (changeset: Changeset | ChangesetWithCommit) => changeset is ChangesetWithCommit;
export declare type ChangelogSection = {
    package: string;
    subsections: {
        type: VersionType;
        changelogEntry: string;
    }[];
};
export declare type ComprehensiveRelease = {
    name: string;
    type: VersionType;
    oldVersion: string;
    newVersion: string;
    changesets: string[];
};
export declare type ReleasePlan = {
    newVersion: string;
    changesets: NewChangeset[];
    releases: ComprehensiveRelease[];
};
export declare type Config = {
    changelogPath: string;
    baseBranch: string;
};
