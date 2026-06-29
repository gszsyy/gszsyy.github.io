(function () {
  "use strict";

  var USERNAME = "gszsyy";
  var PASSWORD = "gszsyy1234";
  var AUTH_KEY = "duomianma-sdk-weekly-auth";
  var DRAFT_KEY = "duomianma-sdk-weekly-draft-v1";
  var scriptLoads = {};

  var loginScreen = document.getElementById("login-screen");
  var appShell = document.getElementById("app-shell");
  var loginForm = document.getElementById("login-form");
  var loginButton = document.getElementById("login-button") || (loginForm && loginForm.querySelector("button[type=submit]"));
  var loginError = document.getElementById("login-error");

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
    preview.title.textContent = textOrDefault(fields.title.value);
    preview.period.textContent = textOrDefault(fields.period.value);
    preview.owner.textContent = textOrDefault(fields.owner.value);
    renderBlock(preview.done, fields.done.value);
    renderBlock(preview.risks, fields.risks.value);
    renderBlock(preview.next, fields.next.value);
  }

  function currentDraft() {
    return {
      title: fields.title.value,
      period: fields.period.value,
      owner: fields.owner.value,
      done: fields.done.value,
      risks: fields.risks.value,
      next: fields.next.value
    };
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
        if (typeof data[key] === "string") fields[key].value = data[key];
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

  var downloadPdfButton = document.getElementById("download-pdf");
  if (downloadPdfButton) downloadPdfButton.addEventListener("click", async function () {
    saveDraft();
    var button = this;
    var originalText = button.textContent;
    button.textContent = "正在生成 PDF";
    button.disabled = true;
    var target = document.getElementById("pdf-target");
    var filename = (textOrDefault(fields.period.value) + "-" + textOrDefault(fields.title.value))
      .replace(/[\\/:*?"<>|]+/g, "-") + ".pdf";

    try {
      if (await ensurePdfLibraries()) {
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
