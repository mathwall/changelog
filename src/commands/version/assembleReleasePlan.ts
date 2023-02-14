import { incrementVersion } from "./increment";
import { NewChangeset, InternalRelease, ReleasePlan } from "../../types";

function assembleReleasePlan(
  changesets: NewChangeset[],
  oldVersion: string
): ReleasePlan {
  const releases = flattenReleases(changesets, oldVersion);
  const releasesArray = [...releases.values()];
  const releasesType = releasesArray[0]?.type;
  const newVersion = incrementVersion(oldVersion, releasesType);
  const releasesWithNewVersion = releasesArray.map((incompleteRelease) => {
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

function flattenReleases(
  changesets: NewChangeset[],
  oldVersion: string
): Map<string, InternalRelease> {
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

  return releases;
}

export default assembleReleasePlan;
