import { incrementVersion } from "./increment";
import {
  NewChangeset,
  InternalRelease,
  ReleasePlan,
  VersionType,
} from "../../types";

function assembleReleasePlan(
  changesets: NewChangeset[],
  oldVersion: string
): ReleasePlan {
  const releases = flattenReleases(changesets, oldVersion);
  const releasesType = getReleaseType(releases);
  const newVersion = incrementVersion(oldVersion, releasesType);
  const releasesWithNewVersion = releases.map((incompleteRelease) => {
    return {
      ...incompleteRelease,
      newVersion,
    };
  });
  return {
    newVersion,
    changesets,
    releases: releasesWithNewVersion,
  };
}

function getReleaseType(releases: InternalRelease[]): VersionType {
  const hasMajorChange = releases.find((release) => release.type === "major");
  if (hasMajorChange) {
    return "major";
  }
  const hasMinorChange = releases.find((release) => release.type === "minor");
  if (hasMinorChange) {
    return "minor";
  }
  return "patch";
}

function flattenReleases(
  changesets: NewChangeset[],
  oldVersion: string
): InternalRelease[] {
  let releases: Map<string, InternalRelease> = new Map();

  changesets.forEach((changeset) => {
    changeset.releases.forEach(({ name, type }) => {
      let release = releases.get(name);
      if (!release) {
        release = {
          name,
          type,
          oldVersion,
          changesets: [changeset.id],
        };
      } else {
        if (
          type === "major" ||
          ((release.type === "patch" || release.type === "none") &&
            (type === "minor" || type === "patch"))
        ) {
          release.type = type;
        }
        // Check whether the bumpType will change
        // If the bumpType has changed recalc newVersion
        // push new changeset to releases
        release.changesets.push(changeset.id);
      }

      releases.set(name, release);
    });
  });

  return [...releases.values()];
}

export default assembleReleasePlan;
