(function () {
  "use strict";

  var USERNAME = "gszsyy";
  var PASSWORD = "gszsyy1234";
  var AUTH_KEY = "duomianma-sdk-weekly-auth";
  var DRAFT_KEY = "duomianma-sdk-weekly-draft-v1";
  var PROJECTS_KEY = "duomianma-sdk-projects-v1";
  var BUILTIN_PROJECTS = [{
    id: "apriltag-unity-pose",
    name: "DeepTag 多面体位姿驱动 Unity",
    owner: "AprilTag（深度学习）SDK 提供方",
    intro: "阶段 1：在 360 度八等份可见面的立体结构上贴附 AprilTag / DeepTag，融合多面 Tag 得到 6DoF 位姿，并输出给 Unity 驱动虚拟物体。",
    completeness: 35,
    entries: 1,
    updatedAt: "2026-06-29 11:54",
    url: "/projects/apriltag-unity-pose/"
  }];
  var scriptLoads = {};

  var loginScreen = document.getElementById("login-screen");
  var appShell = document.getElementById("app-shell");
  var loginForm = document.getElementById("login-form");
  var loginButton = document.getElementById("login-button") || (loginForm && loginForm.querySelector("button[type=submit]"));
  var loginError = document.getElementById("login-error");
  var cards = document.getElementById("cards");
  var newProjectPage = document.getElementById("new-project-page");
  var projectForm = document.getElementById("project-form");
  var projectCount = document.getElementById("project-count");
  var entryCount = document.getElementById("entry-count");

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
    var url = project.url || ("#project-" + project.id);
    return [
      '<a class="report ac-reveal" href="' + escapeHtml(url) + '" id="project-' + escapeHtml(project.id) + '">',
      '<img class="crest" src="/static/cloned-assets/spyfamily/star-mini.png" alt="">',
      '<div class="label">EDEN ACADEMY · REPORT CARD</div>',
      '<h3>' + escapeHtml(project.name) + '</h3>',
      '<div class="owner">负责人 ' + escapeHtml(owner) + ' · 更新 ' + escapeHtml(project.updatedAt) + '</div>',
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
    var projects = BUILTIN_PROJECTS.concat(loadProjects());
    cards.innerHTML = projects.length ? projects.map(projectCard).join("") : emptyState();
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
    if (cards) cards.classList.add("is-hidden");
  }

  function showProjectList() {
    if (newProjectPage) {
      newProjectPage.hidden = true;
      newProjectPage.classList.add("is-hidden");
    }
    if (cards) cards.classList.remove("is-hidden");
  }

  function syncRoute() {
    if (location.hash === "#new") {
      showProjectForm();
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
      location.hash = "#cards";
      syncRoute();
    });
  }

  window.addEventListener("hashchange", syncRoute);

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

  if (sessionStorage.getItem(AUTH_KEY) === "1") {
    showApp();
  } else {
    showLogin();
  }
})();
