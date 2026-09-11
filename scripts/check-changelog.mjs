#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index].startsWith("--")) args.set(process.argv[index], process.argv[index + 1]);
}

const run = (command, commandArgs) => execFileSync(command, commandArgs, { encoding: "utf8" }).trim();
let base = args.get("--base") || (process.env.GITHUB_EVENT_NAME === "pull_request"
  ? process.env.GITHUB_BASE_SHA
  : process.env.GITHUB_EVENT_BEFORE);
const head = args.get("--head") || process.env.GITHUB_SHA || "HEAD";

if (!base) {
  try {
    base = run("git", ["rev-parse", `${head}^`]);
  } catch {
    base = undefined;
  }
}

if (!base || base === "0000000000000000000000000000000000000000") {
  console.log("Changelog check skipped: no comparable base commit was provided.");
  process.exit(0);
}

const changed = run("git", ["diff", "--name-only", base, head]).split("\n").filter(Boolean);
const messages = run("git", ["log", "-1", "--format=%B", head]);
const changelogChanged = changed.includes("CHANGELOG.md");
const bypassed = /changelog:\s*none/i.test(messages);
const userVisible = changed.some((file) => {
  if (/^(src\/.*\.test\.|e2e\/|scripts\/)/.test(file)) return false;
  return /^(src\/|public\/|docs\/|README\.md$|index\.html$|package\.json$|pnpm-lock\.yaml$|vite\.config\.ts$|\.github\/workflows\/)/.test(file);
});

if (!userVisible || bypassed) {
  console.log(bypassed ? "Changelog check passed with explicit Changelog: none marker." : "Changelog check passed: no user-visible files changed.");
  process.exit(0);
}

const changelog = readFileSync("CHANGELOG.md", "utf8");
const packageVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const guideSource = readFileSync("src/guideData.ts", "utf8");
const appVersion = guideSource.match(/export const RELEASE_NOTES[\s\S]*?version:\s*"([^"]+)"/)?.[1];
const latestChangelogVersion = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1];
if (!appVersion || appVersion !== packageVersion || (latestChangelogVersion && latestChangelogVersion !== packageVersion)) {
  console.error(`Changelog check failed: package (${packageVersion}), in-app release (${appVersion ?? "missing"}), and latest changelog release (${latestChangelogVersion ?? "missing"}) must align.`);
  process.exit(1);
}
const unreleased = changelog.match(/## \[Unreleased\]([\s\S]*?)(?=\n## \[|\n\[Unreleased\]:|$)/i)?.[1] ?? "";
if (!changelogChanged || !/^- /m.test(unreleased)) {
  console.error("Changelog check failed: add a plain-language bullet under ## [Unreleased] in CHANGELOG.md, or use the documented Changelog: none marker for an internal-only change.");
  process.exit(1);
}

console.log("Changelog check passed: user-visible changes are documented under Unreleased.");
