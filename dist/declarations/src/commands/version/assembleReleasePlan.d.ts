import { NewChangeset, ReleasePlan } from "../../types";
declare function assembleReleasePlan(changesets: NewChangeset[], oldVersion: string): ReleasePlan;
export default assembleReleasePlan;
