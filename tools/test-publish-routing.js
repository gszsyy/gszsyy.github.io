#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets/app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/publish-project-from-issue.yml"), "utf8");

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label}: missing ${needle}`);
  }
}

assertContains(app, "function githubIssueUrlFor(project)", "GitHub issue publish route");
assertContains(app, "/issues/new?\" + params.toString()", "GitHub issue URL");
assertContains(app, "window.location.href = githubIssueUrlFor(project);", "publish button opens GitHub");
assertContains(index, "v14-github-issue-publish", "cache-busted app version");
assertContains(workflow, "Publish Project From Issue", "publish workflow");
assertContains(workflow, "types: [opened, edited, reopened]", "issue trigger");
assertContains(workflow, "contents: write", "workflow can write repository");
assertContains(workflow, "actions/deploy-pages@v4", "workflow deploys Pages");

if (app.includes("10.40.92.74") || app.includes("/api/publish-project")) {
  throw new Error("frontend must not call local backend or intranet publish API");
}

console.log("publish routing checks passed");
