import { Changeset } from "../../types";
declare function writeChangeset(changeset: Changeset, cwd: string): Promise<string>;
export default writeChangeset;
