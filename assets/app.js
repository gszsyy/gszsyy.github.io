(function () {
  "use strict";

  var USERNAME = "gszsyy";
  var PASSWORD = "gszsyy1234";
  var AUTH_KEY = "duomianma-sdk-weekly-auth";
  var DRAFT_KEY = "duomianma-sdk-weekly-draft-v1";
  var PROJECTS_KEY = "duomianma-sdk-projects-v1";
  var DEFAULT_PUBLISH_API_URL = "http://10.40.92.74:8787";
  var AUTO_PUBLISH_PREFIX = "#auto-publish=";
  var PROJECTS_MANIFEST = "/assets/projects.json?v=20260629-published-projects";
  var GITHUB_OWNER = "gszsyy";
  var GITHUB_REPO = "gszsyy.github.io";
  var GITHUB_BRANCH = "main";
  var BUILTIN_PROJECTS = [{
    id: "apriltag-unity-pose",
    name: "DeepTag 多面体位姿驱动 Unity",
    owner: "中数元宇",
    intro: "阶段 1：在 360 度八等份可见面的立体结构上贴附 AprilTag / DeepTag，融合多面 Tag 得到 6DoF 位姿，并输出给 Unity 驱动虚拟物体。",
    completeness: 35,
    entries: 1,
    updatedAt: "2026-06-29 11:54",
    url: "/projects/apriltag-unity-pose/"
  }];
  var publishedProjects = BUILTIN_PROJECTS.slice();
  var scriptLoads = {};

  var loginScreen = document.getElementById("login-screen");
  var appShell = document.getElementById("app-shell");
  var loginForm = document.getElementById("login-form");
  var loginButton = document.getElementById("login-button") || (loginForm && loginForm.querySelector("button[type=submit]"));
  var loginError = document.getElementById("login-error");
  var cards = document.getElementById("cards");
  var newProjectPage = document.getElementById("new-project-page");
  var localProjectPage = document.getElementById("local-project-page");
  var projectForm = document.getElementById("project-form");
  var projectCount = document.getElementById("project-count");
  var entryCount = document.getElementById("entry-count");
  var copyProjectJsonButton = document.getElementById("copy-project-json");
  var reviewPublishButton = document.getElementById("review-publish-project");
  var publishApiUrlInput = document.getElementById("publish-api-url");

  var fields = {
    title: document.getElementById("report-title"),
    period: document.getElementById("report-period"),
    owner: document.getElementById("report-owner"),
    done: document.getElementById("done"),
    risks: document.getElementById("risks"),
    next: document.getElementById("next")
  };

  var preview = {
    title: document.getElementById("preview-title"),
    period: document.getElementById("preview-period"),
    owner: document.getElementById("preview-owner"),
    done: document.getElementById("preview-done"),
    risks: document.getElementById("preview-risks"),
    next: document.getElementById("preview-next")
  };

  function textOrDefault(value) {
    return (value || "").trim() || "未填写";
  }

  function renderBlock(target, value) {
    if (!target) return;
    var text = textOrDefault(value);
    target.textContent = text;
    target.classList.toggle("empty", text === "未填写");
  }

  function updatePreview() {
    if (!preview.title || !preview.period || !preview.owner) return;
    preview.title.textContent = textOrDefault(fieldValue("title"));
    preview.period.textContent = textOrDefault(fieldValue("period"));
    preview.owner.textContent = textOrDefault(fieldValue("owner"));
    renderBlock(preview.done, fieldValue("done"));
    renderBlock(preview.risks, fieldValue("risks"));
    renderBlock(preview.next, fieldValue("next"));
  }

  function fieldValue(key) {
    return fields[key] ? fields[key].value : "";
  }

  function currentDraft() {
    return {
      title: fieldValue("title"),
      period: fieldValue("period"),
      owner: fieldValue("owner"),
      done: fieldValue("done"),
      risks: fieldValue("risks"),
      next: fieldValue("next")
    };
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
    var date = new Date();
    var pad = function (value) { return String(value).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
      " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function loadProjects() {
    try {
      var raw = localStorage.getItem(PROJECTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn("project load failed", error);
      return [];
    }
  }

  function saveProjects(projects) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }

  function saveOrReplaceLocalProject(project) {
    var projects = loadProjects().filter(function (item) {
      return item.id !== project.id;
    });
    projects.unshift(project);
    saveProjects(projects);
  }

  function loadPublishApiUrl() {
    return DEFAULT_PUBLISH_API_URL;
  }

  function isLocalPublishPage() {
    return window.location.origin === DEFAULT_PUBLISH_API_URL;
  }

  function localPublishUrlFor(project) {
    return DEFAULT_PUBLISH_API_URL + "/" + AUTO_PUBLISH_PREFIX + encodeURIComponent(JSON.stringify(project));
  }

  function autoPublishProjectFromHash() {
    if (location.hash.indexOf(AUTO_PUBLISH_PREFIX) !== 0) return null;
    try {
      return JSON.parse(decodeURIComponent(location.hash.slice(AUTO_PUBLISH_PREFIX.length)));
    } catch (error) {
      console.warn("auto publish payload failed", error);
      return null;
    }
  }

  function setPublishStatus(message, isError) {
    var status = document.getElementById("publish-status");
    if (!status) return;
    status.textContent = message || "";
    status.style.color = isError ? "#b42318" : "#8a5a12";
  }

  function mergeProjects(published, local) {
    var seen = {};
    var publishedList = published.map(function (project) {
      return Object.assign({ localDraft: false }, project);
    });
    var localList = local.map(function (project) {
      var copy = Object.assign({}, project);
      copy.localDraft = true;
      return copy;
    });
    return publishedList.concat(localList).filter(function (project) {
      var id = project && project.id;
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function loadPublishedProjects() {
    if (!window.fetch) return Promise.resolve(publishedProjects);
    return fetch(PROJECTS_MANIFEST, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (projects) {
        if (Array.isArray(projects) && projects.length) publishedProjects = projects;
        return publishedProjects;
      })
      .catch(function (error) {
        console.warn("published project manifest failed", error);
        return publishedProjects;
      });
  }

  function starMarkup(score) {
    var html = "";
    for (var index = 0; index < 5; index += 1) {
      var off = (index + 1) * 20 > score ? "off" : "";
      html += '<img class="' + off + '" src="/static/cloned-assets/spyfamily/star-mini.png" alt="">';
    }
    return html;
  }

  function projectCard(project) {
    var score = Math.max(0, Math.min(100, Number(project.completeness) || 0));
    var owner = project.owner || "未填写";
    var intro = project.intro || "暂无简介。";
    var url = project.url || ("#local-project-" + project.id);
    var draftLabel = project.localDraft ? " · 本机草稿" : "";
    return [
      '<a class="report ac-reveal" href="' + escapeHtml(url) + '" id="project-' + escapeHtml(project.id) + '"' + (project.localDraft ? ' data-local-project="' + escapeHtml(project.id) + '"' : "") + '>',
      '<img class="crest" src="/static/cloned-assets/spyfamily/star-mini.png" alt="">',
      '<div class="label">EDEN ACADEMY · REPORT CARD</div>',
      '<h3>' + escapeHtml(project.name) + '</h3>',
      '<div class="owner">负责人 ' + escapeHtml(owner) + ' · 更新 ' + escapeHtml(project.updatedAt) + draftLabel + '</div>',
      '<p class="intro">' + escapeHtml(intro).slice(0, 90) + '</p>',
      '<div class="stella">' + starMarkup(score) + '<span class="grade">' + score + '%</span></div>',
      '<div class="foot"><span>📒 ' + (Number(project.entries) || 0) + ' 份联合开发进度</span><span>AI 评估完成度</span></div>',
      '</a>'
    ].join("");
  }

  function emptyState() {
    return '<div class="empty"><b>还没有在册项目。</b>点「+ 新建项目 ★」创建 GitHub Pages 独立项目。</div>';
  }

  function renderProjects() {
    if (!cards) return;
    var projects = mergeProjects(publishedProjects, loadProjects());
    cards.innerHTML = projects.length ? projects.map(projectCard).join("") : emptyState();
    cards.querySelectorAll(".ac-reveal").forEach(function (element) {
      element.classList.add("is-in");
    });
    if (projectCount) {
      projectCount.textContent = String(projects.length);
      projectCount.setAttribute("data-count", String(projects.length));
    }
    if (entryCount) {
      var entries = projects.reduce(function (total, project) {
        return total + (Number(project.entries) || 0);
      }, 0);
      entryCount.textContent = String(entries);
      entryCount.setAttribute("data-count", String(entries));
    }
  }

  function showProjectForm() {
    if (newProjectPage) {
      newProjectPage.hidden = false;
      newProjectPage.classList.remove("is-hidden");
    }
    if (localProjectPage) {
      localProjectPage.hidden = true;
      localProjectPage.classList.add("is-hidden");
    }
    if (cards) cards.classList.add("is-hidden");
  }

  function showProjectList() {
    if (newProjectPage) {
      newProjectPage.hidden = true;
      newProjectPage.classList.add("is-hidden");
    }
    if (localProjectPage) {
      localProjectPage.hidden = true;
      localProjectPage.classList.add("is-hidden");
    }
    if (cards) cards.classList.remove("is-hidden");
  }

  function projectManifestEntry(project) {
    return {
      id: project.id,
      name: project.name,
      owner: project.owner || "未填写",
      intro: project.intro || "",
      completeness: Number(project.completeness) || 0,
      entries: Number(project.entries) || 0,
      updatedAt: project.updatedAt || nowLabel(),
      url: project.url || ("/projects/" + project.id + "/")
    };
  }

  function projectPageHtml(project) {
    return '<!DOCTYPE html>\n' +
      '<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      '<title>' + escapeHtml(project.name) + ' · 项目详情</title>\n' +
      '<link rel="stylesheet" href="/static/theme/anya-core.css">\n' +
      '<style>body{margin:0;background:#efe2c4;color:#172033;font-family:var(--display);line-height:1.65}.bg{position:fixed;inset:0;background:radial-gradient(rgba(120,90,40,.08) 1.3px,transparent 1.4px) 0 0/15px 15px,linear-gradient(180deg,#f3e8cd,#e6d6b2)}.wrap{position:relative;z-index:1;max-width:980px;margin:0 auto;padding:46px 22px 80px}.nav{display:flex;justify-content:space-between;margin-bottom:32px}.nav a{color:#0b6b57;font-family:var(--display-bold);text-decoration:none}.section{background:#fffdf3;border:2px solid #c9a24a;border-radius:14px;box-shadow:0 14px 32px rgba(90,70,30,.16);padding:28px;margin:24px 0}.kicker{font-family:var(--poster);color:#0b6b57;letter-spacing:.08em;text-transform:uppercase}.title{font-family:var(--display-bold);font-size:clamp(34px,6vw,62px);line-height:1.08;color:#0b6b57;margin:0 0 10px}.meta{color:#6c5b37;font-family:var(--hand)}h2{font-family:var(--poster);color:#0b6b57;font-size:30px;margin:0 0 12px}.block{background:#fff8d8;border-left:5px solid #0b6b57;border-radius:8px;padding:14px;white-space:pre-wrap}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style>\n' +
      '</head>\n<body><div class="bg" aria-hidden="true"></div><main class="wrap"><nav class="nav"><a href="/">返回联合开发进度</a><a href="/projects/new/">新建项目</a></nav>' +
      '<section class="section"><p class="kicker">Published Project</p><h1 class="title">' + escapeHtml(project.name) + '</h1><p class="meta">负责人 ' + escapeHtml(project.owner || "未填写") + ' · 更新 ' + escapeHtml(project.updatedAt || nowLabel()) + '</p><div class="block">' + escapeHtml(project.intro || "未填写") + '</div></section>' +
      '<section class="grid"><div class="section"><h2>阶段性目标</h2><div class="block">' + escapeHtml(project.phasedGoals || "未填写") + '</div></div><div class="section"><h2>最终目标</h2><div class="block">' + escapeHtml(project.finalGoals || "未填写") + '</div></div></section>' +
      '</main></body>\n</html>\n';
  }

  function bytesToBase64(bytes) {
    var binary = "";
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function textToBase64(text) {
    return bytesToBase64(new TextEncoder().encode(text));
  }

  function base64ToText(value) {
    var binary = atob(String(value || "").replace(/\s/g, ""));
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function githubApi(token, path, options) {
    return fetch("https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + path, Object.assign({
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }, options || {})).then(function (response) {
      return response.text().then(function (text) {
        var data = text ? JSON.parse(text) : {};
        if (!response.ok) {
          throw new Error((data && data.message) || ("GitHub API " + response.status));
        }
        return data;
      });
    });
  }

  function getGithubFile(token, path) {
    return githubApi(token, path + "?ref=" + encodeURIComponent(GITHUB_BRANCH));
  }

  function putGithubFile(token, path, content, message, sha) {
    var body = {
      message: message,
      content: textToBase64(content),
      branch: GITHUB_BRANCH
    };
    if (sha) body.sha = sha;
    return githubApi(token, path, {
      method: "PUT",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }

  function optionalGithubFile(token, path) {
    return getGithubFile(token, path).catch(function (error) {
      if (String(error.message || "").indexOf("Not Found") >= 0) return null;
      throw error;
    });
  }

  function validateProjectForPublish(project) {
    var missing = [];
    if (!String(project.name || "").trim()) missing.push("项目名");
    if (!String(project.intro || "").trim()) missing.push("项目简介");
    if (!String(project.phasedGoals || "").trim()) missing.push("阶段性目标");
    if (!String(project.finalGoals || "").trim()) missing.push("最终目标");
    return missing;
  }

  function publishErrorMessage(error) {
    var message = String(error && error.message || error || "");
    if (message === "Bad credentials") {
      return "发布服务授权已失效。请联系管理员更新发布授权。";
    }
    if (message.indexOf("Resource not accessible by personal access token") >= 0 || message.indexOf("Requires authentication") >= 0) {
      return "发布服务权限不足。请联系管理员检查发布授权。";
    }
    if (message.indexOf("Not Found") >= 0) {
      return "发布目标未找到。请联系管理员检查发布配置。";
    }
    if (message.indexOf("Failed to fetch") >= 0 || message.indexOf("NetworkError") >= 0 || message.indexOf("Load failed") >= 0) {
      return "发布服务暂时不可用。请联系管理员确认发布服务正在运行。";
    }
    if (message.indexOf("后端未配置 GITHUB_TOKEN") >= 0) {
      return "发布服务尚未完成授权配置。请联系管理员处理。";
    }
    return message || "未知错误";
  }

  function removeLocalProject(id) {
    saveProjects(loadProjects().filter(function (project) {
      return project.id !== id;
    }));
  }

  function publishBackendUrl() {
    var value = publishApiUrlInput ? publishApiUrlInput.value.trim() : "";
    value = value || loadPublishApiUrl();
    return value.replace(/\/+$/, "");
  }

  async function publishProjectDraft(project, removeAfterPublish) {
    var missing = validateProjectForPublish(project);
    if (missing.length) {
      setPublishStatus("审核未通过：请补全 " + missing.join("、") + "。", true);
      return;
    }
    if (!isLocalPublishPage()) {
      setPublishStatus("正在切换到本机发布服务并继续发布...");
      window.location.href = localPublishUrlFor(project);
      return;
    }
    var originalText = reviewPublishButton ? reviewPublishButton.textContent : "";
    if (reviewPublishButton) {
      reviewPublishButton.disabled = true;
      reviewPublishButton.textContent = "正在审核发布";
    }
    try {
      setPublishStatus("正在审核并发布...");
      await publishViaBackend(project);
      setPublishStatus("发布提交完成。GitHub Pages 构建完成后，其他设备会显示该项目。");
      if (removeAfterPublish) removeLocalProject(project.id);
      await loadPublishedProjects();
      renderProjects();
      location.hash = "#cards";
      syncRoute();
    } catch (error) {
      setPublishStatus("审核发布失败：" + publishErrorMessage(error), true);
    } finally {
      if (reviewPublishButton) {
        reviewPublishButton.disabled = false;
        reviewPublishButton.textContent = originalText || "审核发布";
      }
    }
  }

  async function publishViaBackend(project) {
    var apiUrl = publishBackendUrl();
    var response = await fetch(apiUrl + "/api/publish-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: project })
    });
    var data = await response.json().catch(function () {
      return {};
    });
    if (!response.ok || !data.ok) {
      throw new Error(data.error || ("发布后端 HTTP " + response.status));
    }
    return data.project;
  }

  async function publishLocalProject(id) {
    var project = findLocalProject(id);
    if (!project) {
      setPublishStatus("没有找到本机草稿项目。", true);
      return;
    }
    await publishProjectDraft(project, true);
  }

  function findLocalProject(id) {
    return loadProjects().find(function (project) {
      return project.id === id;
    });
  }

  function showLocalProjectDetail(id) {
    var project = findLocalProject(id);
    if (!project || !localProjectPage) {
      showProjectList();
      return;
    }
    var title = document.getElementById("local-project-title");
    var meta = document.getElementById("local-project-meta");
    var intro = document.getElementById("local-project-intro");
    var phased = document.getElementById("local-project-phased");
    var finalGoals = document.getElementById("local-project-final");
    var reviewJson = document.getElementById("local-project-json");
    if (title) title.textContent = project.name || "未命名项目";
    if (meta) meta.textContent = "负责人 " + (project.owner || "未填写") + " · 更新 " + (project.updatedAt || "未填写") + " · 本机草稿";
    if (intro) intro.textContent = project.intro || "未填写";
    if (phased) phased.textContent = project.phasedGoals || "未填写";
    if (finalGoals) finalGoals.textContent = project.finalGoals || "未填写";
    if (reviewJson) reviewJson.value = JSON.stringify(projectManifestEntry(project), null, 2);
    if (newProjectPage) {
      newProjectPage.hidden = true;
      newProjectPage.classList.add("is-hidden");
    }
    if (cards) cards.classList.add("is-hidden");
    localProjectPage.hidden = false;
    localProjectPage.classList.remove("is-hidden");
  }

  function syncRoute() {
    if (location.hash === "#new") {
      showProjectForm();
    } else if (location.hash.indexOf("#local-project-") === 0) {
      showLocalProjectDetail(location.hash.replace("#local-project-", ""));
    } else {
      showProjectList();
    }
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(currentDraft()));
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      Object.keys(fields).forEach(function (key) {
        if (fields[key] && typeof data[key] === "string") fields[key].value = data[key];
      });
    } catch (error) {
      console.warn("draft load failed", error);
    }
  }

  function loadScriptOnce(src) {
    if (scriptLoads[src]) return scriptLoads[src];
    scriptLoads[src] = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return scriptLoads[src];
  }

  async function ensurePdfLibraries() {
    if (window.jspdf && window.html2canvas) return true;
    try {
      await loadScriptOnce("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
      await loadScriptOnce("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js");
      return Boolean(window.jspdf && window.html2canvas);
    } catch (error) {
      console.warn("pdf libraries failed to load", error);
      return false;
    }
  }

  function showApp() {
    if (loginScreen) {
      loginScreen.hidden = true;
      loginScreen.classList.add("is-hidden");
      loginScreen.style.display = "none";
    }
    if (appShell) {
      appShell.hidden = false;
      appShell.classList.remove("is-hidden");
      appShell.style.display = "";
    }
    loadDraft();
    updatePreview();
    renderProjects();
    loadPublishedProjects().then(renderProjects);
    syncRoute();
  }

  function showLogin() {
    if (loginScreen) {
      loginScreen.hidden = false;
      loginScreen.classList.remove("is-hidden");
      loginScreen.style.display = "";
    }
    if (appShell) {
      appShell.hidden = true;
      appShell.classList.add("is-hidden");
      appShell.style.display = "none";
    }
  }

  function attemptLogin() {
    var user = document.getElementById("username").value.trim();
    var pass = document.getElementById("password").value;
    if (user === USERNAME && pass === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      if (loginError) loginError.textContent = "";
      showApp();
      return;
    }
    if (loginError) loginError.textContent = "用户名或密码不正确。";
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      attemptLogin();
    });
  }

  if (loginButton) {
    loginButton.addEventListener("click", function (event) {
      event.preventDefault();
      attemptLogin();
    });
  }

  Object.keys(fields).forEach(function (key) {
    if (!fields[key]) return;
    fields[key].addEventListener("input", function () {
      updatePreview();
      saveDraft();
    });
  });

  var saveLocalButton = document.getElementById("save-local");
  if (saveLocalButton) saveLocalButton.addEventListener("click", function () {
    saveDraft();
    this.textContent = "已保存";
    var button = this;
    setTimeout(function () { button.textContent = "保存草稿"; }, 1200);
  });

  var logoutButton = document.getElementById("logout");
  if (logoutButton) logoutButton.addEventListener("click", function () {
    sessionStorage.removeItem(AUTH_KEY);
    showLogin();
  });

  if (projectForm) {
    projectForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var nameInput = document.getElementById("project-name");
      var ownerInput = document.getElementById("project-owner");
      var introInput = document.getElementById("project-intro");
      var phasedGoalsInput = document.getElementById("project-phased-goals");
      var finalGoalsInput = document.getElementById("project-final-goals");
      var editPinInput = document.getElementById("project-edit-pin");
      var name = nameInput.value.trim();
      if (!name) return;
      var projects = loadProjects();
      projects.unshift({
        id: Date.now().toString(36),
        name: name,
        owner: ownerInput.value.trim(),
        intro: introInput.value.trim(),
        phasedGoals: phasedGoalsInput.value.trim(),
        finalGoals: finalGoalsInput.value.trim(),
        editPin: editPinInput.value,
        completeness: 0,
        entries: 0,
        updatedAt: nowLabel()
      });
      saveProjects(projects);
      projectForm.reset();
      renderProjects();
      var notice = document.getElementById("project-publish-notice");
      if (notice) notice.textContent = "已保存为本机草稿。要让其他设备看到，需要审核后发布到托管项目清单。";
      location.hash = "#cards";
      syncRoute();
    });
  }

  if (cards) {
    cards.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("[data-local-project]");
      if (!link) return;
      event.preventDefault();
      location.hash = "#local-project-" + link.getAttribute("data-local-project");
      syncRoute();
    });
  }

  if (copyProjectJsonButton) {
    copyProjectJsonButton.addEventListener("click", function () {
      var reviewJson = document.getElementById("local-project-json");
      if (!reviewJson) return;
      reviewJson.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(reviewJson.value).catch(function () {});
      } else {
        document.execCommand("copy");
      }
      copyProjectJsonButton.textContent = "已复制审核 JSON";
      setTimeout(function () { copyProjectJsonButton.textContent = "复制审核 JSON"; }, 1400);
    });
  }

  if (reviewPublishButton) {
    reviewPublishButton.addEventListener("click", function () {
      if (location.hash.indexOf("#local-project-") !== 0) {
        setPublishStatus("请先打开一个本机草稿项目。", true);
        return;
      }
      publishLocalProject(location.hash.replace("#local-project-", ""));
    });
  }

  if (publishApiUrlInput) {
    publishApiUrlInput.value = loadPublishApiUrl();
  }

  window.addEventListener("hashchange", syncRoute);

  function handleAutoPublishRoute() {
    var project = autoPublishProjectFromHash();
    if (!project) return false;
    sessionStorage.setItem(AUTH_KEY, "1");
    saveOrReplaceLocalProject(project);
    showApp();
    showLocalProjectDetail(project.id);
    publishProjectDraft(project, true);
    return true;
  }

  var downloadPdfButton = document.getElementById("download-pdf");
  if (downloadPdfButton) downloadPdfButton.addEventListener("click", async function () {
    saveDraft();
    var button = this;
    var originalText = button.textContent;
    button.textContent = "正在生成 PDF";
    button.disabled = true;
    var target = document.getElementById("pdf-target");
    var period = fieldValue("period") || new Date().toISOString().slice(0, 10);
    var title = fieldValue("title") || document.title || "多面码SDK联合开发专项群联合开发进度";
    var filename = (textOrDefault(period) + "-" + textOrDefault(title))
      .replace(/[\\/:*?"<>|]+/g, "-") + ".pdf";

    try {
      if (target && await ensurePdfLibraries()) {
        var canvas = await window.html2canvas(target, { scale: 2, backgroundColor: "#ffffff" });
        var imgData = canvas.toDataURL("image/png");
        var pdf = new window.jspdf.jsPDF("p", "mm", "a4");
        var pageWidth = pdf.internal.pageSize.getWidth();
        var pageHeight = pdf.internal.pageSize.getHeight();
        var imgWidth = pageWidth;
        var imgHeight = canvas.height * imgWidth / canvas.width;
        var y = 0;
        pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
        while (imgHeight + y > pageHeight) {
          y -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
        }
        pdf.save(filename);
        return;
      }
    } catch (error) {
      console.warn("pdf generation failed", error);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }

    window.print();
  });

  if (handleAutoPublishRoute()) {
    return;
  }

  if (sessionStorage.getItem(AUTH_KEY) === "1") {
    showApp();
  } else {
    showLogin();
  }
})();
