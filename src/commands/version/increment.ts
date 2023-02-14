import * as semver from "semver";
import { VersionType } from "../../types";

export function incrementVersion(oldVersion: string, type: VersionType) {
  if (type === "none") {
    return oldVersion;
  }
  let version = semver.inc(oldVersion, type)!;
  return version;
}
