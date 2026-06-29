#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const GITHUB_OWNER = process.env.GITHUB_OWNER || "gszsyy";
const GITHUB_REPO = process.env.GITHUB_REPO || "gszsyy.github.io";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const PUBLISH_PASSWORD = process.env.PUBLISH_PASSWORD || "";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

function readEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq < 0) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

readEnvFile();

function config() {
  return {
    port: Number(process.env.PORT || PORT),
    host: process.env.HOST || HOST,
    owner: process.env.GITHUB_OWNER || GITHUB_OWNER,
    repo: process.env.GITHUB_REPO || GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || GITHUB_BRANCH,
    token: process.env.GITHUB_TOKEN || GITHUB_TOKEN,
    publishPassword: process.env.PUBLISH_PASSWORD || PUBLISH_PASSWORD,
    allowedOrigin: process.env.ALLOWED_ORIGIN || ALLOWED_ORIGIN,
  };
}

function corsHeaders(req) {
  const cfg = config();
  const origin = req.headers.origin || "*";
  return {
    "Access-Control-Allow-Origin": cfg.allowedOrigin === "*" ? origin : cfg.allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    "Vary": "Origin",
  };
}

function sendJson(req, res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(req),
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("JSON 格式错误"));
      }
    });
    req.on("error", reject);
  });
}

function safeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function validateProject(project) {
  const missing = [];
  if (!String(project.name || "").trim()) missing.push("项目名");
  if (!String(project.intro || "").trim()) missing.push("项目简介");
  if (!String(project.phasedGoals || "").trim()) missing.push("阶段性目标");
  if (!String(project.finalGoals || "").trim()) missing.push("最终目标");
  return missing;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nowLabel() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function manifestEntry(project) {
  return {
    id: project.id,
    name: project.name,
    owner: project.owner || "未填写",
    intro: project.intro || "",
    completeness: Number(project.completeness) || 0,
    entries: Number(project.entries) || 0,
    updatedAt: project.updatedAt || nowLabel(),
    url: project.url || `/projects/${project.id}/`,
  };
}

function projectPageHtml(project) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(project.name)} · 项目详情</title>
  <link rel="stylesheet" href="/static/theme/anya-core.css">
  <style>
    body{margin:0;background:#efe2c4;color:#172033;font-family:var(--display);line-height:1.65}
    .bg{position:fixed;inset:0;background:radial-gradient(rgba(120,90,40,.08) 1.3px,transparent 1.4px) 0 0/15px 15px,linear-gradient(180deg,#f3e8cd,#e6d6b2)}
    .wrap{position:relative;z-index:1;max-width:980px;margin:0 auto;padding:46px 22px 80px}
    .nav{display:flex;justify-content:space-between;margin-bottom:32px}.nav a{color:#0b6b57;font-family:var(--display-bold);text-decoration:none}
    .section{background:#fffdf3;border:2px solid #c9a24a;border-radius:14px;box-shadow:0 14px 32px rgba(90,70,30,.16);padding:28px;margin:24px 0}
    .kicker{font-family:var(--poster);color:#0b6b57;letter-spacing:.08em;text-transform:uppercase}.title{font-family:var(--display-bold);font-size:clamp(34px,6vw,62px);line-height:1.08;color:#0b6b57;margin:0 0 10px}
    .meta{color:#6c5b37;font-family:var(--hand)}h2{font-family:var(--poster);color:#0b6b57;font-size:30px;margin:0 0 12px}
    .block{background:#fff8d8;border-left:5px solid #0b6b57;border-radius:8px;padding:14px;white-space:pre-wrap}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    @media(max-width:760px){.grid{grid-template-columns:1fr}}
  </style>
</head>
<body><div class="bg" aria-hidden="true"></div><main class="wrap">
  <nav class="nav"><a href="/">返回联合开发进度</a><a href="/projects/new/">新建项目</a></nav>
  <section class="section"><p class="kicker">Published Project</p><h1 class="title">${escapeHtml(project.name)}</h1><p class="meta">负责人 ${escapeHtml(project.owner || "未填写")} · 更新 ${escapeHtml(project.updatedAt || nowLabel())}</p><div class="block">${escapeHtml(project.intro || "未填写")}</div></section>
  <section class="grid"><div class="section"><h2>阶段性目标</h2><div class="block">${escapeHtml(project.phasedGoals || "未填写")}</div></div><div class="section"><h2>最终目标</h2><div class="block">${escapeHtml(project.finalGoals || "未填写")}</div></div></section>
</main></body>
</html>
`;
}

async function github(pathname, options = {}) {
  const cfg = config();
  const response = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${pathname}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${cfg.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.message || `GitHub API ${response.status}`);
  return data;
}

async function getFile(pathname) {
  return github(`${pathname}?ref=${encodeURIComponent(config().branch)}`);
}

async function optionalFile(pathname) {
  try {
    return await getFile(pathname);
  } catch (error) {
    if (String(error.message || "").includes("Not Found")) return null;
    throw error;
  }
}

async function putFile(pathname, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: config().branch,
  };
  if (sha) body.sha = sha;
  return github(pathname, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function decodeContent(file) {
  return Buffer.from(String(file.content || "").replace(/\s/g, ""), "base64").toString("utf8");
}

async function publishProject(project) {
  const cfg = config();
  if (!cfg.token) throw new Error("后端未配置 GITHUB_TOKEN");
  project.id = safeId(project.id || project.name);
  const missing = validateProject(project);
  if (missing.length) throw new Error(`审核未通过：请补全 ${missing.join("、")}`);

  const pagePath = `projects/${project.id}/index.html`;
  const existingPage = await optionalFile(pagePath);
  await putFile(pagePath, projectPageHtml(project), `Publish project page: ${project.name}`, existingPage && existingPage.sha);

  const manifest = await getFile("assets/projects.json");
  let projects = JSON.parse(decodeContent(manifest));
  const entry = manifestEntry({ ...project, url: `/projects/${project.id}/` });
  let found = false;
  projects = projects.map((item) => {
    if (item.id === entry.id) {
      found = true;
      return entry;
    }
    return item;
  });
  if (!found) projects.unshift(entry);
  await putFile("assets/projects.json", `${JSON.stringify(projects, null, 2)}\n`, `Publish project manifest entry: ${project.name}`, manifest.sha);
  return entry;
}

async function handlePublish(req, res) {
  const cfg = config();
  const body = await readJson(req);
  if (cfg.publishPassword && body.password !== cfg.publishPassword) {
    sendJson(req, res, 403, { ok: false, error: "发布密码不正确" });
    return;
  }
  const entry = await publishProject(body.project || {});
  sendJson(req, res, 200, { ok: true, project: entry });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders(req));
      res.end();
      return;
    }
    if (req.method === "GET" && req.url === "/health") {
      sendJson(req, res, 200, { ok: true, repo: `${config().owner}/${config().repo}`, branch: config().branch });
      return;
    }
    if (req.method === "POST" && req.url === "/api/publish-project") {
      await handlePublish(req, res);
      return;
    }
    sendJson(req, res, 404, { ok: false, error: "Not Found" });
  } catch (error) {
    sendJson(req, res, 500, { ok: false, error: error.message || String(error) });
  }
});

server.listen(config().port, config().host, () => {
  const cfg = config();
  console.log(`publish server listening on http://${cfg.host}:${cfg.port}`);
});
