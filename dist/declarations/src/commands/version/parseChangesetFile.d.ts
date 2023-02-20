import { Release } from "../../types";
export default function parseChangesetFile(contents: string): {
    summary: string;
    releases: Release[];
};
