import { NewChangeset } from "../../types";
export default function getChangesets(cwd: string, sinceRef?: string): Promise<Array<NewChangeset>>;
