export declare function getGithubInfo(request: {
    commit: string;
    repo: string;
}): Promise<{
    user: string | null;
    pull: number | null;
    links: {
        commit: string;
        pull: string | null;
        user: string | null;
    };
}>;
