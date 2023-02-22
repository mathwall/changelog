'use strict';

var meow = require('meow');
var errors = require('@changesets/errors');
var chalk = require('chalk');
var util = require('util');
var fs = require('fs-extra');
var path = require('path');
var child_process = require('child_process');
var termSize = require('term-size');
var enquirer = require('enquirer');
var externalEditor = require('external-editor');
var ansiColors = require('ansi-colors');
var git = require('@changesets/git');
var prettier = require('prettier');
var humanId = require('human-id');
var outdent = require('outdent');
var yaml = require('js-yaml');
var semver = require('semver');
var fetch = require('node-fetch');
var DataLoader = require('dataloader');
var MarkdownIt = require('markdown-it');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var meow__default = /*#__PURE__*/_interopDefault(meow);
var chalk__default = /*#__PURE__*/_interopDefault(chalk);
var util__default = /*#__PURE__*/_interopDefault(util);
var fs__default = /*#__PURE__*/_interopDefault(fs);
var path__default = /*#__PURE__*/_interopDefault(path);
var termSize__default = /*#__PURE__*/_interopDefault(termSize);
var git__namespace = /*#__PURE__*/_interopNamespace(git);
var prettier__default = /*#__PURE__*/_interopDefault(prettier);
var humanId__default = /*#__PURE__*/_interopDefault(humanId);
var outdent__default = /*#__PURE__*/_interopDefault(outdent);
var yaml__default = /*#__PURE__*/_interopDefault(yaml);
var semver__namespace = /*#__PURE__*/_interopNamespace(semver);
var fetch__default = /*#__PURE__*/_interopDefault(fetch);
var DataLoader__default = /*#__PURE__*/_interopDefault(DataLoader);
var MarkdownIt__default = /*#__PURE__*/_interopDefault(MarkdownIt);

let prefix = "🦋 ";
function format(args, customPrefix) {
  let fullPrefix = prefix + (customPrefix === undefined ? "" : " " + customPrefix);
  return fullPrefix + util__default["default"].format("", ...args).split("\n").join("\n" + fullPrefix + " ");
}
function error(...args) {
  console.error(format(args, chalk__default["default"].red("error")));
}
function info(...args) {
  console.info(format(args, chalk__default["default"].cyan("info")));
}
function log(...args) {
  console.log(format(args));
}
function success(...args) {
  console.log(format(args, chalk__default["default"].green("success")));
}
function warn(...args) {
  console.warn(format(args, chalk__default["default"].yellow("warn")));
}

const defaultConfig = {
  baseBranch: "main",
  changelogPath: "./CHANGELOG.md"
};

const stringifiedConfig = `${JSON.stringify({
  ...defaultConfig
}, null, 2)}\n`;
const readmeContent = `
# Changesets

Hello and welcome! This folder has been automatically generated by \`simple-changeset\`.

Use the \`simple-changeset add\` command to add a changeset file.
Use the \`simple-changeset version\` command to concatenate the changesets into your \`changelog\` file.

`;
async function init(cwd) {
  const changesetBase = path__default["default"].resolve(cwd, ".changeset");
  if (fs__default["default"].existsSync(changesetBase)) {
    if (!fs__default["default"].existsSync(path__default["default"].join(changesetBase, "config.json"))) {
      await fs__default["default"].writeFile(path__default["default"].resolve(changesetBase, "config.json"), stringifiedConfig);
    } else {
      warn("It looks like you already have changesets initialized. You should be able to run changeset commands no problems.");
    }
  } else {
    fs__default["default"].mkdirSync(changesetBase);
    await fs__default["default"].writeFile(path__default["default"].resolve(changesetBase, "config.json"), stringifiedConfig);
  }
  await fs__default["default"].writeFile(path__default["default"].resolve(changesetBase, "README.md"), readmeContent);
  log(chalk__default["default"]`Thanks for choosing {green simple-changeset} to help manage your versioning and publishing\n`);
  log("You should be set up to start using changesets now!\n");
  info("We have added a `.changeset` folder, and a couple of files to help you out:");
  info(chalk__default["default"]`- {blue .changeset/README.md} contains information about using changesets`);
  info(chalk__default["default"]`- {blue .changeset/config.json} is our default config`);
}

/* Notes on using enquirer:
 * Each question needs a key, as inquirer is assembling an object behind-the-scenes.
 * At each call, the entire responses object is returned, so we need a unique
 * identifier for the name every time. This is why we are using serial IDs
 */
const serialId = function () {
  let id = 0;
  return () => id++;
}();
const limit = Math.max(termSize__default["default"]().rows - 5, 10);
let cancelFlow = () => {
  success("Cancelled... 👋 ");
  process.exit();
};
async function askCheckboxPlus(message, choices, format) {
  const name = `CheckboxPlus-${serialId()}`;
  return enquirer.prompt({
    type: "autocomplete",
    name,
    message,
    prefix,
    multiple: true,
    choices,
    format,
    limit,
    onCancel: cancelFlow,
    symbols: {
      indicator: ansiColors.symbols.radioOff,
      checked: ansiColors.symbols.radioOn
    },
    indicator(state, choice) {
      return choice.enabled ? state.symbols.checked : state.symbols.indicator;
    }
  }).then(responses => responses[name]).catch(err => {
    error(err);
  });
}
async function askQuestion(message) {
  const name = `Question-${serialId()}`;
  return enquirer.prompt([{
    type: "input",
    message,
    name,
    prefix,
    onCancel: cancelFlow
  }]).then(responses => responses[name]).catch(err => {
    error(err);
  });
}
function askQuestionWithEditor(message) {
  const response = externalEditor.edit(message, {
    postfix: ".md"
  });
  return response.replace(/^#.*\n?/gm, "").replace(/\n+$/g, "").trim();
}
async function askConfirm(message) {
  const name = `Confirm-${serialId()}`;
  return enquirer.prompt([{
    message,
    name,
    prefix,
    type: "confirm",
    initial: true,
    onCancel: cancelFlow
  }]).then(responses => responses[name]).catch(err => {
    error(err);
  });
}
async function askList(message, choices) {
  const name = `List-${serialId()}`;
  return enquirer.prompt([{
    choices,
    message,
    name,
    prefix,
    type: "select",
    onCancel: cancelFlow
  }]).then(responses => responses[name]).catch(err => {
    error(err);
  });
}

var packages = ["bigdata-spark-service", "bigdata-spark-collector", "bigdata-log-collector", "bigdata-secret-manager", "bigdata-notebook-service", "bigdata-log-archive-dispatcher", "libs/data-objects", "libs/shared-utils", "libs/test-sdk", "libs/db", "libs/spot", "libs/chunklib", "libs/aws-client", "libs/gcp-client", "libs/sel-processing", "libs/smart-defaults", "libs/certificate-authority", "libs/fastapi-extended", "libs/spark-k8s", "libs/core", "db/platform"];

function getPrettierInstance(cwd) {
  try {
    return require(require.resolve("prettier", {
      paths: [cwd]
    }));
  } catch (err) {
    if (!err || err.code !== "MODULE_NOT_FOUND") {
      throw err;
    }
    return prettier__default["default"];
  }
}
async function writeChangeset(changeset, cwd) {
  const {
    summary,
    releases
  } = changeset;
  const changesetBase = path__default["default"].resolve(cwd, ".changeset");

  // Worth understanding that the ID merely needs to be a unique hash to avoid git conflicts
  // experimenting with human readable ids to make finding changesets easier
  const changesetID = humanId__default["default"]({
    separator: "-",
    capitalize: false
  });
  const prettierInstance = getPrettierInstance(cwd);
  const prettierConfig = await prettierInstance.resolveConfig(cwd);
  const newChangesetPath = path__default["default"].resolve(changesetBase, `${changesetID}.md`);

  // NOTE: The quotation marks in here are really important even though they are
  // not spec for yaml. This is because package names can contain special
  // characters that will otherwise break the parsing step
  const changesetContents = `---
${releases.map(release => `"${release.name}": ${release.type}`).join("\n")}
---

${summary}
  `;
  await fs__default["default"].outputFile(newChangesetPath,
  // Prettier v3 returns a promise
  await prettierInstance.format(changesetContents, {
    ...prettierConfig,
    parser: "markdown"
  }));
  return changesetID;
}

async function getPackagesToRelease(packages) {
  function askInitialReleaseQuestion(defaultChoiceList) {
    return askCheckboxPlus(`Which packages would you like to include?`, defaultChoiceList);
  }
  if (packages.length > 1) {
    const defaultChoiceList = [{
      name: "Available packages",
      choices: packages
    }];
    let packagesToRelease = await askInitialReleaseQuestion(defaultChoiceList);
    if (packagesToRelease.length === 0) {
      do {
        error("You must select at least one package to release");
        error("(You most likely hit enter instead of space!)");
        packagesToRelease = await askInitialReleaseQuestion(defaultChoiceList);
      } while (packagesToRelease.length === 0);
    }
    return packagesToRelease;
  }
  return [packages[0]];
}
async function getReleaseType$1() {
  return askList(`What kind of release should it be ?`, ["patch", "minor", "major"]);
}
async function getReleaseSummary() {
  log("Please enter a summary for this change (this will be in the changelogs).");
  log(chalk__default["default"].gray("  (submit empty line to open external editor)"));
  let summary = await askQuestion("Summary");
  if (summary.length === 0) {
    try {
      summary = askQuestionWithEditor("\n\n# Please enter a summary for your changes.\n# An empty message aborts the editor.");
      if (summary.length > 0) {
        return summary;
      }
    } catch (err) {
      log("An error happened using external editor. Please type your summary here:");
    }
    summary = await askQuestion("");
    while (summary.length === 0) {
      summary = await askQuestion("\n\n# A summary is required for the changelog! 😪");
    }
  }
  return summary;
}
async function createChangeset(packages) {
  const releases = [];
  const packagesToRelease = await getPackagesToRelease(packages);
  const releaseType = await getReleaseType$1();
  for (const packageToRelease of packagesToRelease) {
    releases.push({
      name: packageToRelease,
      type: releaseType
    });
  }
  const summary = await getReleaseSummary();
  return {
    summary,
    releases
  };
}

function printConfirmationMessage(changeset) {
  function getReleasesOfType(type) {
    return changeset.releases.filter(release => release.type === type).map(release => release.name);
  }
  log("\n=== Summary of changesets ===");
  const majorReleases = getReleasesOfType("major");
  const minorReleases = getReleasesOfType("minor");
  const patchReleases = getReleasesOfType("patch");
  if (majorReleases.length > 0) log(`${chalk__default["default"].bold.green("major")}:  ${majorReleases.join(", ")}`);
  if (minorReleases.length > 0) log(`${chalk__default["default"].bold.green("minor")}:  ${minorReleases.join(", ")}`);
  if (patchReleases.length > 0) log(`${chalk__default["default"].bold.green("patch")}:  ${patchReleases.join(", ")}`);
}

const getAddMessage = changeset => {
  return outdent__default["default"]`docs(changeset): ${changeset.summary}`;
};
const getVersionMessage = releasePlan => {
  const publishableReleases = releasePlan.releases.filter(release => release.type !== "none");
  const numPackagesReleased = publishableReleases.length;
  const releasesLines = publishableReleases.map(release => `  ${release.name}@${release.newVersion}`).join("\n");
  return outdent__default["default"]`
    RELEASING: Releasing ${numPackagesReleased} package(s)
    [automated:release]
    Releases:
    ${releasesLines}
`;
};

async function add(cwd, open) {
  const changesetBase = path__default["default"].resolve(cwd, ".changeset");
  const newChangeset = await createChangeset(packages);
  printConfirmationMessage(newChangeset);
  const isChangesetConfirmed = await askConfirm("Is this your desired changeset?");
  if (isChangesetConfirmed) {
    const changesetID = await writeChangeset(newChangeset, cwd);
    await git__namespace.add(path__default["default"].resolve(changesetBase, `${changesetID}.md`), cwd);
    const commitMessage = await getAddMessage(newChangeset);
    await git__namespace.commit(commitMessage, cwd);
    log(chalk__default["default"].green(`Changeset added and committed`));
    const hasMajorChange = [...newChangeset.releases].find(c => c.type === "major");
    if (hasMajorChange) {
      warn("This Changeset includes a major change and we STRONGLY recommend adding more information to the changeset:");
      warn("WHAT the breaking change is");
      warn("WHY the change was made");
      warn("HOW a consumer should update their code");
    } else {
      log(chalk__default["default"].green("If you want to modify or expand on the changeset summary, you can find it here"));
    }
    const changesetPath = path__default["default"].resolve(changesetBase, `${changesetID}.md`);
    info(chalk__default["default"].blue(changesetPath));
    if (open) {
      // this is really a hack to reuse the logic embedded in `external-editor` related to determining the editor
      const externalEditor$1 = new externalEditor.ExternalEditor();
      externalEditor$1.cleanup();
      child_process.spawn(externalEditor$1.editor.bin, externalEditor$1.editor.args.concat([changesetPath]), {
        detached: true,
        stdio: "inherit"
      });
    }
  }
}

const mdRegex = /\s*---([^]*?)\n\s*---(\s*(?:\n|$)[^]*)/;
function parseChangesetFile(contents) {
  const execResult = mdRegex.exec(contents);
  if (!execResult) {
    throw new Error(`could not parse changeset - invalid frontmatter: ${contents}`);
  }
  const [, roughReleases, roughSummary] = execResult;
  try {
    const summary = roughSummary.trim();
    const yamlReleases = yaml__default["default"].load(roughReleases);
    const releases = yamlReleases && Object.entries(yamlReleases).map(([name, type]) => ({
      name,
      type
    }));
    if (!releases) {
      throw new Error(`could not parse changeset - unknown error: ${contents}`);
    }
    return {
      releases,
      summary
    };
  } catch (e) {
    throw new Error(`could not parse changeset - invalid frontmatter: ${contents}`);
  }
}

async function filterChangesetsSinceRef(changesets, changesetBase, sinceRef) {
  const newChangesets = await git__namespace.getChangedChangesetFilesSinceRef({
    cwd: changesetBase,
    ref: sinceRef
  });
  const newHashes = newChangesets.map(c => c.split("/")[1]);
  return changesets.filter(dir => newHashes.includes(dir));
}
async function getChangesets(cwd, sinceRef) {
  const changesetBase = path__default["default"].join(cwd, ".changeset");
  let contents;
  try {
    contents = await fs__default["default"].readdir(changesetBase);
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error("There is no .changeset directory in this project");
    }
    throw err;
  }
  if (sinceRef !== undefined) {
    contents = await filterChangesetsSinceRef(contents, changesetBase, sinceRef);
  }
  const changesets = contents.filter(file => !file.startsWith(".") && file.endsWith(".md") && file !== "README.md");
  const changesetContents = changesets.map(async file => {
    const changeset = await fs__default["default"].readFile(path__default["default"].join(changesetBase, file), "utf-8");
    return {
      ...parseChangesetFile(changeset),
      id: file.replace(".md", "")
    };
  });
  return [...(await Promise.all(changesetContents))];
}

function incrementVersion(oldVersion, type) {
  if (type === "none") {
    return oldVersion;
  }
  let version = semver__namespace.inc(oldVersion, type);
  return version;
}

function assembleReleasePlan(changesets, oldVersion) {
  const releases = flattenReleases(changesets, oldVersion);
  const releasesType = getReleaseType(releases);
  const newVersion = incrementVersion(oldVersion, releasesType);
  const releasesWithNewVersion = releases.map(incompleteRelease => {
    return {
      ...incompleteRelease,
      newVersion
    };
  });
  return {
    newVersion,
    changesets,
    releases: releasesWithNewVersion
  };
}
function getReleaseType(releases) {
  const hasMajorChange = releases.find(release => release.type === "major");
  if (hasMajorChange) {
    return "major";
  }
  const hasMinorChange = releases.find(release => release.type === "minor");
  if (hasMinorChange) {
    return "minor";
  }
  return "patch";
}
function flattenReleases(changesets, oldVersion) {
  let releases = new Map();
  changesets.forEach(changeset => {
    changeset.releases.forEach(({
      name,
      type
    }) => {
      let release = releases.get(name);
      if (!release) {
        release = {
          name,
          type,
          oldVersion,
          changesets: [changeset.id]
        };
      } else {
        if (type === "major" || (release.type === "patch" || release.type === "none") && (type === "minor" || type === "patch")) {
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

const isChangesetWithCommit = changeset => {
  return changeset.commit !== undefined;
};

const validRepoNameRegex = /^[\w.-]+\/[\w.-]+$/;
function makeQuery(repos) {
  return `
        query {
          ${Object.keys(repos).map((repo, i) => `a${i}: repository(
              owner: ${JSON.stringify(repo.split("/")[0])}
              name: ${JSON.stringify(repo.split("/")[1])}
            ) {
              ${repos[repo].map(data => data.kind === "commit" ? `a${data.commit}: object(expression: ${JSON.stringify(data.commit)}) {
              ... on Commit {
              commitUrl
              associatedPullRequests(first: 50) {
                nodes {
                  number
                  url
                  mergedAt
                  author {
                    login
                    url
                  }
                }
              }
              author {
                user {
                  login
                  url
                }
              }
            }}` : `pr__${data.pull}: pullRequest(number: ${data.pull}) {
                      url
                      author {
                        login
                        url
                      }
                      mergeCommit {
                        commitUrl
                        abbreviatedOid
                      }
                    }`).join("\n")}
            }`).join("\n")}
          }
      `;
}

// why are we using dataloader?
// it provides use with two things
// 1. caching
// since getInfo will be called inside of changeset's getReleaseLine
// and there could be a lot of release lines for a single commit
// caching is important so we don't do a bunch of requests for the same commit
// 2. batching
// getReleaseLine will be called a large number of times but it'll be called at the same time
// so instead of doing a bunch of network requests, we can do a single one.
const GHDataLoader = new DataLoader__default["default"](async requests => {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("Please create a GitHub personal access token at https://github.com/settings/tokens/new with `read:user` and `repo:status` permissions and add it as the GITHUB_TOKEN environment variable");
  }
  let repos = {};
  requests.forEach(({
    repo,
    ...data
  }) => {
    if (repos[repo] === undefined) {
      repos[repo] = [];
    }
    repos[repo].push(data);
  });
  const data = await fetch__default["default"]("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.GITHUB_TOKEN}`
    },
    body: JSON.stringify({
      query: makeQuery(repos)
    })
  }).then(x => x.json());
  if (data.errors) {
    throw new Error(`An error occurred when fetching data from GitHub\n${JSON.stringify(data.errors, null, 2)}`);
  }

  // this is mainly for the case where there's an authentication problem
  if (!data.data) {
    throw new Error(`An error occurred when fetching data from GitHub\n${JSON.stringify(data)}`);
  }
  let cleanedData = {};
  Object.keys(repos).forEach((repo, index) => {
    let output = {
      commit: {},
      pull: {}
    };
    cleanedData[repo] = output;
    Object.entries(data.data[`a${index}`]).forEach(([field, value]) => {
      // this is "a" because that's how it was when it was first written, "a" means it's a commit not a pr
      // we could change it to commit__ but then we have to get new GraphQL results from the GH API to put in the tests
      if (field[0] === "a") {
        output.commit[field.substring(1)] = value;
      } else {
        output.pull[field.replace("pr__", "")] = value;
      }
    });
  });
  return requests.map(({
    repo,
    ...data
  }) => cleanedData[repo][data.kind][data.kind === "pull" ? data.pull : data.commit]);
});
async function getGithubInfo(request) {
  var _data$author;
  if (!request.commit) {
    throw new Error("Please pass a commit SHA to getInfo");
  }
  if (!request.repo) {
    throw new Error("Please pass a GitHub repository in the form of userOrOrg/repoName to getInfo");
  }
  if (!validRepoNameRegex.test(request.repo)) {
    throw new Error(`Please pass a valid GitHub repository in the form of userOrOrg/repoName to getInfo (it has to match the "${validRepoNameRegex.source}" pattern)`);
  }
  const data = await GHDataLoader.load({
    kind: "commit",
    ...request
  });
  const associatedPullRequest = data && data.associatedPullRequests && data.associatedPullRequests.nodes && data.associatedPullRequests.nodes.length ? data.associatedPullRequests.nodes.sort((a, b) => {
    if (a.mergedAt === null && b.mergedAt === null) {
      return 0;
    }
    if (a.mergedAt === null) {
      return 1;
    }
    if (b.mergedAt === null) {
      return -1;
    }
    a = new Date(a.mergedAt);
    b = new Date(b.mergedAt);
    return a > b ? 1 : a < b ? -1 : 0;
  })[0] : null;
  const user = (data === null || data === void 0 ? void 0 : (_data$author = data.author) === null || _data$author === void 0 ? void 0 : _data$author.user) ?? (associatedPullRequest === null || associatedPullRequest === void 0 ? void 0 : associatedPullRequest.author);
  return {
    user: (user === null || user === void 0 ? void 0 : user.login) ?? null,
    pull: (associatedPullRequest === null || associatedPullRequest === void 0 ? void 0 : associatedPullRequest.number) ?? null,
    links: {
      commit: `[\`${request.commit}\`](${data === null || data === void 0 ? void 0 : data.commitUrl})`,
      pull: associatedPullRequest ? `[#${associatedPullRequest.number}](${associatedPullRequest.url})` : null,
      user: user ? `[@${user.login}](${user.url})` : null
    }
  };
}

async function getChangelogSections(changesetsWithCommits, repo) {
  const changelogSections = [];
  for (const changeset of changesetsWithCommits) {
    const releaseLine = await getReleaseLine(changeset, repo);
    for (const release of changeset.releases) {
      const subsectionContent = {
        type: release.type,
        changelogEntry: releaseLine
      };
      const section = changelogSections.find(section => section.package === release.name);
      if (!section) {
        changelogSections.push({
          package: release.name,
          subsections: [subsectionContent]
        });
      } else {
        const subsection = section.subsections.find(s => s.type === release.type);
        if (subsection) {
          subsection.changelogEntry += `
  ${releaseLine}`;
        } else {
          section.subsections.push(subsectionContent);
        }
      }
    }
  }
  return changelogSections;
}
function formatChangelogSections(sections) {
  return sections.reduce((acc, section) => {
    const packageDetail = section.subsections.reduce((acc, subsection) => {
      return acc + `
${subsection.type} changes:
${subsection.changelogEntry}`;
    }, "");
    return acc + `
### ${section.package}
${packageDetail}
    `;
  }, "");
}
const getReleaseLine = async (changeset, repo) => {
  if (!repo) {
    throw new Error('Please provide a repo to this changelog generator like this:\n"repo": "org/repo"');
  }
  const [firstLine, ...futureLines] = changeset.summary.split("\n").map(l => l.trimEnd());
  const links = await (async () => {
    if (isChangesetWithCommit(changeset)) {
      let {
        links
      } = await getGithubInfo({
        repo: repo,
        commit: changeset.commit
      });
      return links;
    }
    return {
      commit: null,
      pull: null,
      user: null
    };
  })();
  const suffix = [links.pull === null ? "" : `${links.pull}`, links.user === null ? "" : ` Thanks ${links.user}!`].join("");
  return `- ${firstLine}\n${futureLines.map(l => `  ${l}`).join("\n")}
  ${suffix ?? ""}`;
};

async function updateChangelog(changelogPath, newVersion, changelog) {
  const templateString = `\n${changelog.trim()}\n`;
  try {
    if (fs__default["default"].existsSync(changelogPath)) {
      await prependFile(changelogPath, newVersion, templateString);
    } else {
      await writeFormattedMarkdownFile(changelogPath, `## ${newVersion}${templateString}`);
    }
  } catch (e) {
    console.warn(e);
  }
}
async function prependFile(filePath, newVersion, detail) {
  const fileData = fs__default["default"].readFileSync(filePath).toString();
  // if the file exists but doesn't have the header, we'll add it in
  if (!fileData) {
    const completelyNewChangelog = `
## ${newVersion}${detail}`;
    await writeFormattedMarkdownFile(filePath, completelyNewChangelog);
    return;
  }
  const today = new Date();
  const newChangelog = fileData.replace("\n", `
  
## [${newVersion}] ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}
  
  ${detail}`);
  await writeFormattedMarkdownFile(filePath, newChangelog);
}
async function writeFormattedMarkdownFile(filePath, content) {
  await fs__default["default"].writeFile(filePath, content);
}

async function applyReleasePlan(releasePlan, cwd) {
  const changesetBase = path__default["default"].resolve(cwd, ".changeset");
  const config = await fs__default["default"].readFile(path__default["default"].join(changesetBase, "config.json"), "utf-8");
  const parsedConfig = JSON.parse(config);
  const changesetsWithCommits = await getChangesetsCommits(releasePlan.changesets, cwd);
  const {
    newVersion
  } = releasePlan;
  const changelogSections = await getChangelogSections(changesetsWithCommits, parsedConfig.repo);
  const changelogEntry = formatChangelogSections(changelogSections);
  const changelogPath = path__default["default"].resolve(cwd, parsedConfig.changelogPath);
  await updateChangelog(changelogPath, newVersion, changelogEntry);
  const versionFilePath = path__default["default"].join(changesetBase, "version");
  await updateVersionFile(versionFilePath, newVersion);
  const touchedFiles = await deleteChangesetFiles(releasePlan.changesets, cwd);
  touchedFiles.push(changelogPath);
  touchedFiles.push(versionFilePath);
  return touchedFiles;
}
async function updateVersionFile(versionFilePath, newVersion) {
  await fs__default["default"].writeFile(versionFilePath, newVersion);
}
async function deleteChangesetFiles(changesets, cwd) {
  let changesetFolder = path__default["default"].resolve(cwd, ".changeset");
  const changesetFiles = [];
  await Promise.all(changesets.map(async changeset => {
    let changesetPath = path__default["default"].resolve(changesetFolder, `${changeset.id}.md`);
    if (await fs__default["default"].pathExists(changesetPath)) {
      changesetFiles.push(changesetPath);
      await fs__default["default"].remove(changesetPath);
    }
  }));
  return changesetFiles;
}
function stringDefined(s) {
  return !!s;
}
async function getChangesetsCommits(changesets, cwd) {
  const paths = changesets.map(changeset => `.changeset/${changeset.id}.md`);
  const changesetsCommits = await git__namespace.getCommitsThatAddFiles(paths, {
    cwd,
    short: true
  });
  if (changesetsCommits.every(stringDefined)) {
    // We have a commit corresponding to each changeset
    return changesets.map((cs, i) => ({
      ...cs,
      commit: changesetsCommits[i]
    }));
  }
  return changesets;
}

const err = "Could not parse CHANGELOG.md to find last version.";
async function extractOldVersion(cwd) {
  const changesetBase = path__default["default"].resolve(cwd, ".changeset");
  const config = await fs__default["default"].readFile(path__default["default"].join(changesetBase, "config.json"), "utf-8");
  const parsedConfig = JSON.parse(config);
  const changelog = await fs__default["default"].readFile(path__default["default"].join(cwd, parsedConfig.changelogPath), "utf-8");
  const md = new MarkdownIt__default["default"]();
  const parsedChangelog = md.parse(changelog, {});
  const firstH2Tag = parsedChangelog.find(token => token.markup === "##");
  if (!firstH2Tag) {
    // This could happen if it was the first changelog entry ever written
    // version would be 0.0.0
    // but this is not our case so let's do a MVP and not handle that case
    throw err;
  }
  const lastVersionToken = parsedChangelog.find(token => token.type === "inline" && token.map && firstH2Tag.map && token.map[0] === firstH2Tag.map[0] && token.map[1] === firstH2Tag.map[1]);
  if (!lastVersionToken) {
    throw err;
  }
  const lastVersionText = lastVersionToken === null || lastVersionToken === void 0 ? void 0 : lastVersionToken.content;
  const re = /\[(.*)\]/;
  const extractedLastVersion = lastVersionText && re.exec(lastVersionText);
  if (!extractedLastVersion) {
    throw err;
  }
  return extractedLastVersion[1];
}

async function version(cwd) {
  const changesets = await getChangesets(cwd);
  if (changesets.length === 0) {
    warn("No unreleased changesets found, exiting.");
    return process.exit(1);
  }
  const oldVersion = await extractOldVersion(cwd);
  const releasePlan = assembleReleasePlan(changesets, oldVersion);
  const [...touchedFiles] = await applyReleasePlan(releasePlan, cwd);
  let touchedFile;
  // Note, git gets angry if you try and have two git actions running at once
  // So we need to be careful that these iterations are properly sequential
  while (touchedFile = touchedFiles.shift()) {
    await git__namespace.add(path__default["default"].relative(cwd, touchedFile), cwd);
  }
  const commit = await git__namespace.commit(await getVersionMessage(releasePlan), cwd);
  if (!commit) {
    error("Changesets ran into trouble committing your files");
  } else {
    log("All files have been updated and committed. You're ready to publish!");
  }
}

async function run(input, flags, cwd) {
  if (input[0] === "init") {
    await init(cwd);
    return;
  }
  if (!fs__default["default"].existsSync(path__default["default"].resolve(cwd, ".changeset"))) {
    error("There is no .changeset folder. ");
    error("If this is the first time `simple-changeset` have been used in this project, run `simple-changeset init` to get set up.");
    error("If you expected there to be changesets, you should check git history for when the folder was removed to ensure you do not lose any configuration.");
    throw new errors.ExitError(1);
  }
  if (input.length < 1) {
    const {
      open
    } = flags;
    await add(cwd, open);
  } else if (input[0] !== "pre" && input.length > 1) {
    error("Too many arguments passed to simple-changeset - we only accept the command name as an argument");
  } else {
    const {
      open
    } = flags;
    switch (input[0]) {
      case "add":
        {
          await add(cwd, open);
          return;
        }
      case "version":
        {
          await version(cwd);
          return;
        }
      default:
        {
          error(`Invalid command ${input[0]} was provided`);
          throw new errors.ExitError(1);
        }
    }
  }
}

// TODO update the flags and documentation
const {
  input,
  flags
} = meow__default["default"](`
  Usage
    $ simple-changeset [command]
  Commands
    init
    add [--empty] [--open]
    version [--ignore] [--snapshot <?name>] [--snapshot-prerelease-template <template>]
    `, {
  flags: {
    sinceMaster: {
      type: "boolean"
    },
    verbose: {
      type: "boolean",
      alias: "v"
    },
    output: {
      type: "string",
      alias: "o"
    },
    otp: {
      type: "string"
    },
    empty: {
      type: "boolean"
    },
    since: {
      type: "string"
    },
    ignore: {
      type: "string",
      isMultiple: true
    },
    tag: {
      type: "string"
    },
    open: {
      type: "boolean"
    },
    gitTag: {
      type: "boolean",
      default: true
    },
    snapshotPrereleaseTemplate: {
      type: "string"
    }
    // mixed type like this is not supported by `meow`
    // if it gets passed explicitly then it's still available on the flags with an inferred type though
    // snapshot: { type: "boolean" | "string" },
  }
});

const cwd = process.cwd();
run(input, flags, cwd).catch(err => {
  if (err instanceof errors.InternalError) {
    error("The following error is an internal unexpected error, these should never happen.");
  }
  if (err instanceof errors.ExitError) {
    return process.exit(err.code);
  }
  error(err);
  process.exit(1);
});
