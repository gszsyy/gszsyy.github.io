#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets/app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label}: missing ${needle}`);
  }
}

assertContains(app, 'var AUTO_PUBLISH_PREFIX = "#auto-publish=";', "auto publish hash route");
assertContains(app, "function isLocalPublishPage()", "local publish origin guard");
assertContains(app, "window.location.href = localPublishUrlFor(project);", "https to local publish handoff");
assertContains(app, "function handleAutoPublishRoute()", "auto publish route handler");
assertContains(index, "v13-auto-publish-handoff", "cache-busted app version");

console.log("publish routing checks passed");
