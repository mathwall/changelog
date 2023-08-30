## [2.1.2]  2023-08-30

Update release commit name.
It now starts with [automated:release]

## [2.1.0]  2023-02-22

Introducing a changelog on this project since that takes the biscuit not to have a changelog on a changelog automation tool.
Nevertheless, since the tool has a hard-coded packages list, we won't be able to use it right away on itself.

For now, the tool has:
- an `init` command that creates a `.changeset` folder with a default config (needs to be updated by the user) and a Readme
- an `add` command that guides the user to add a "changeset" file:
  - the user can choose one or several packages affected by his change. The packages list is hard-coded.
  - the user can choose a type of change following semantic versioning convention
  - the user can describe the change
  - a changeset file containing all that information is created and committed
- a `version` command that updates the `CHANGELOG.md` file and the `.changeset/version` file with the new version number, the date, and the change details. This command deletes all the changeset files that were taken into account. 