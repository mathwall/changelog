import { Changeset, ReleasePlan } from "../types";
import outdent from "outdent";

export const getAddMessage = (changeset: Changeset): string => {
  return outdent`docs(changeset): ${changeset.summary}`;
};

export const getVersionMessage = (releasePlan: ReleasePlan): string => {
  const publishableReleases = releasePlan.releases.filter(
    (release) => release.type !== "none"
  );
  const numPackagesReleased = publishableReleases.length;

  const releasesLines = publishableReleases
    .map((release) => `  ${release.name}@${release.newVersion}`)
    .join("\n");

  return outdent`
    RELEASING: Releasing ${numPackagesReleased} package(s)

    Releases:
    ${releasesLines}
`;
};
