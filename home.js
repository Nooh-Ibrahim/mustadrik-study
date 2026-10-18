// الصفحة الرئيسية: كروت المواد (من السيرفر، عشان أي مادة نوح يضيفها من صفحة الإدارة تظهر لوحدها)،
// وتحميل ملف الطباعة بالتصريح، وكارت «حسابك على أكتر من جهاز» (المزامنة، والربط بكود، والنسخة الاحتياطية).
// لستة المواد بتتحفظ في localStorage (mst-subjects)، فالكروت بتظهر من غير نت.
(function () {
  "use strict";
  var EP = "https://mustadrak-stats.mustadrak.workers.dev";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  if (location.hostname === "localhost" && get("mst-ep")) EP = get("mst-ep");
  var CONTENT = "mustadrak-study-content";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var A = window.MSTA;

  // ---------- المواد ----------
  var DEFAULT = [
    { code: "BAS114", name: "الفيزياء", base: "BAS114_Physics", skey: "bas114", state: "open", pdf_size: 4527809 },
    { code: "CSC115", name: "مقدمة في نظم الحاسب", base: "CSC115_ComputerSystems", skey: "cis1ch1", state: "open", pdf_size: 6290452 },
    { code: "BAS112", name: "التفاضل والتكامل", base: "BAS112_Calculus", skey: "calc1w1", state: "open", pdf_size: 5717314 },
    { code: "BAS113", name: "الجبر الخطي", base: "BAS113_LinearAlgebra", skey: "linalg1w1", state: "open", pdf_size: 3864115 },
    { code: "BAS116", name: "أساسيات الكهرباء والإلكترونيات", base: "BAS116_Electronics", skey: "bas116", state: "open", pdf_size: 2358743 },
    { code: "GEN002", name: "اللغة الإنجليزية 1", base: "GEN002_English", skey: "gen002", state: "open", pdf_size: 0 }
  ];
  function list() { try { var l = JSON.parse(get("mst-subjects")); if (l && l.length) return l; } catch (e) {} return DEFAULT; }
  function mb(b) { return b ? (b / 1048576).toFixed(1) + " MB" : ""; }
  function card(s) {
    var c = s.code.toLowerCase(), open = s.state === "open";
    return '<section class="card course' + (open ? "" : " soon") + '" aria-labelledby="c-' + c + '" data-base="' + esc(s.base) + '">' +
      '<p class="code en">' + esc(s.code) + '</p><h3 id="c-' + c + '">' + esc(s.name) + '</h3>' +
      (open ? '<p class="saved">افتحها مرة بالنت عشان تتحفظ</p><a class="go" href="c.html?s=' + encodeURIComponent(s.base) + '">افتح المادة</a>' +
        (s.pdf_size ? '<button type="button" class="pdf" data-pdf="' + esc(s.base) + '">نسخة الطباعة كاملة<span class="en">PDF · ' + mb(s.pdf_size) + '</span></button>' : "") + lecPdfs(s)
        : '<p class="saved">قريباً</p>') + "</section>";
  }
  // ملف طباعة لكل محاضرة (s.lec_pdfs من السيرفر: [{n: "L1", t: "المحاضرة 1", size}])، مقفول لحد ما يدوس عليه
  function lecPdfs(s) {
    var l = s.lec_pdfs; if (!l || !l.length) return "";
    return '<details class="lpdf"><summary>ملف لكل محاضرة (' + l.length + ")</summary>" + l.map(function (x) {
      return '<button type="button" class="pdf lp" data-pdf="' + esc(s.base + "_" + x.n) + '">' + esc(x.t) + '<span class="en">PDF · ' + mb(x.size) + "</span></button>";
    }).join("") + "</details>";
  }
  function draw() { $("courses").innerHTML = list().map(card).join(""); saved(); }
  // كل كارت بيقول مادته محفوظة على الجهاز ولا لأ
  function saved() {
    if (!window.caches) return;
    caches.open(CONTENT).then(function (c) {
      [].forEach.call(document.querySelectorAll("[data-base]"), function (el) {
        c.match(EP + "/file/" + el.getAttribute("data-base") + ".html").then(function (r) {
          var s = el.querySelector(".saved"); if (r && s && !el.classList.contains("soon")) { s.textContent = "✓ محفوظة، وبتفتح من غير نت"; s.classList.add("on"); }
        });
      });
    });
  }
  draw();
  fetch(EP + "/subjects", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.list || !j.list.length) return;
    var s = JSON.stringify(j.list); if (s === get("mst-subjects")) return;
    set("mst-subjects", s); draw();
  }).catch(function () {});

  // ملف الطباعة: بيتجاب بالتصريح، وبيتحفظ على الجهاز، وبعدين ينزل
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-pdf]"); if (!b || document.documentElement.classList.contains("gate")) return;
    var base = b.getAttribute("data-pdf"), url = EP + "/file/" + base + ".pdf", lab = b.firstChild, old = lab.textContent;
    function done(blob) { lab.textContent = old; b.disabled = false; var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = base + ".pdf"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 60000); }
    function fail(m) { lab.textContent = m; b.disabled = false; setTimeout(function () { lab.textContent = old; }, 4000); }
    b.disabled = true; lab.textContent = "بينزّل...";
    (window.caches ? caches.open(CONTENT).then(function (c) { return c.match(url); }) : Promise.resolve(null)).then(function (hit) {
      if (hit && navigator.onLine === false) return hit.blob().then(done);
      return A.ensure().then(function (tok) {
        return fetch(url, { headers: { "X-Tok": tok }, cache: "no-store" });
      }).then(function (r) {
        if (r.ok) { if (window.caches) { var cp = r.clone(); caches.open(CONTENT).then(function (c) { return c.put(url, cp); }).catch(function () {}); } return r.blob().then(done); }
        if (r.status === 401) { try { localStorage.removeItem("mst-tok"); } catch (_) {} }
        if (r.status === 403) return r.json().then(function (j) { fail(j.err === "blocked" ? "الوصول مقفول" : "مقفولة"); });
        throw new Error();
      }).catch(function () { if (hit) return hit.blob().then(done); fail("مفيش نت"); });
    });
  });

  // ---------- حسابك على أكتر من جهاز ----------
  function ago(t) {
    if (!t) return "لسه";
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return "دلوقتي"; if (m < 60) return "من " + m + " دقيقة";
    var h = Math.round(m / 60); if (h < 24) return "من " + h + " ساعة";
    return "من " + Math.round(h / 24) + " يوم";
  }
  function status() {
    var el = $("acc-st"); if (!el) return;
    if (get("mst-blocked") === "1") { el.innerHTML = "الوصول للملفات مقفول لرقمك. كلّم نوح."; el.className = "acc-st bad"; return; }
    el.className = "acc-st" + (A.linked() ? " on" : "");
    el.textContent = A.linked() ? "✓ تقدّمك في كل المواد بيتحفظ على حسابك. آخر مزامنة: " + ago(A.lastSync()) : "تقدّمك لسه على الجهاز ده بس. هيتزامن أول ما يبقى فيه نت.";
  }
  function doSync(btn) {
    var m = $("acc-msg"); if (btn) btn.disabled = true; m.textContent = "بيزامن...";
    A.sync(list().map(function (s) { return s.skey; })).then(function (r) {
      m.textContent = r.changed.length ? "✓ اتزامن، وجالك تقدّم جديد في " + r.changed.length + " مادة." : "✓ اتزامن، وكله متطابق.";
    }, function (e) { m.textContent = e.message === "blocked" ? "الوصول مقفول لرقمك." : "مفيش نت دلوقتي. هيتزامن لوحده بعدين."; })
      .then(function () { if (btn) btn.disabled = false; status(); try { window.dispatchEvent(new CustomEvent("mst-time")); } catch (e) {} });
  }
  var cd = 0;
  function showCode(btn) {
    var box = $("acc-code"), m = $("acc-msg"); btn.disabled = true; m.textContent = "";
    A.link().then(function (j) {
      var end = Date.now() + j.exp * 1000;
      box.hidden = false;
      box.innerHTML = '<p>على الجهاز التاني: افتح الموقع، ودوس <b>«عندي حساب على جهاز تاني»</b> تحت كارت الاسم، واكتب الكود ده:</p><p class="bigcode" dir="ltr">' + j.code.slice(0, 3) + " " + j.code.slice(3) + '</p><p class="fine" id="acc-left"></p>';
      clearInterval(cd);
      cd = setInterval(function () {
        var s = Math.round((end - Date.now()) / 1000);
        if (s <= 0) { clearInterval(cd); box.innerHTML = "<p>الكود خلص. دوس «اربط جهاز تاني» تاني لو محتاج.</p>"; btn.disabled = false; return; }
        $("acc-left").textContent = "الكود شغّال " + Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2) + " دقيقة، ومرة واحدة بس.";
      }, 1000);
    }, function (e) { btn.disabled = false; m.textContent = e.message === "blocked" ? "الوصول مقفول لرقمك." : "محتاج نت عشان تطلّع كود."; });
  }
  function backupOut() {
    var b = A.backup(list().map(function (s) { return s.skey; })), box = $("bk-box");
    box.innerHTML = '<p>فيه تقدّم في <b>' + b.n + '</b> مادة. انسخ الكود وابعته لنفسك (واتساب أو النوتس).</p><textarea class="xcode" readonly dir="ltr" rows="4" id="bk-code"></textarea><div class="row"><button type="button" class="btn" id="bk-copy">انسخ الكود</button></div><p class="fine" id="bk-msg" aria-live="polite"></p>';
    $("bk-code").value = b.code;
  }
  function backupIn() {
    $("bk-box").innerHTML = '<p>الصق الكود (كود كل المواد من هنا، أو كود مادة واحدة من «انقل تقدّمي» جوّه المادة أو من لينك كلود):</p><textarea class="xcode" dir="ltr" rows="4" id="bk-paste" placeholder="MST:..."></textarea>' +
      '<div class="chips"><label class="chip"><input type="radio" name="bk-mode" value="merge" checked> ادمج (خُد الأحدث لكل سؤال)</label><label class="chip"><input type="radio" name="bk-mode" value="replace"> استبدل تقدّمي في المواد اللي في الكود</label></div><div class="row"><button type="button" class="btn" id="bk-apply">استرجع</button></div><p class="fine" id="bk-msg" aria-live="polite"></p>';
  }
  function backupApply() {
    var m = $("bk-msg"), rep = (document.querySelector('input[name="bk-mode"]:checked') || {}).value === "replace";
    try {
      var r = A.restore($("bk-paste").value, rep), names = {};
      list().forEach(function (s) { names[s.skey] = s.name; });
      m.className = "fine okm";
      m.textContent = "✓ اتسترجع " + r.n + " سؤال في: " + r.keys.map(function (k) { return names[k] || k; }).join("، ") + ".";
    } catch (e) { m.className = "fine bad"; m.textContent = "الكود مش سليم. اتأكد إنك نسخته كله (من أول حرف لآخر حرف)."; }
  }
  function copy() {
    var ta = $("bk-code"), m = $("bk-msg"); ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
    function ok() { m.className = "fine okm"; m.textContent = "اتنسخ ✓"; }
    function manual() { var d = false; try { d = document.execCommand("copy"); } catch (e) {} if (d) ok(); else m.textContent = "النسخ التلقائي مش شغال هنا. الكود متعلّم، دوس عليه مطوّل واختار «نسخ»."; }
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, manual); else manual(); } catch (e) { manual(); }
  }
  // «عندي حساب على جهاز تاني»: من كارت الاسم
  function joinApply(e) {
    e.preventDefault();
    var m = $("join-err"), btn = e.target.querySelector("button[type=submit]");
    m.hidden = true; btn.disabled = true;
    A.join($("join-code").value).then(function (r) { try { window.dispatchEvent(new CustomEvent("mst-time")); } catch (e) {}
      document.documentElement.classList.remove("gate"); $("who").hidden = true; $("join").hidden = true;
      if (window.MSTHello) window.MSTHello();
      $("acc-msg").textContent = "✓ الجهاز ده اتربط بحسابك" + (r.changed && r.changed.length ? "، وجالك تقدّمك في " + r.changed.length + " مادة." : ".");
      status(); $("acc").scrollIntoView({ behavior: "smooth", block: "center" });
    }, function (er) {
      btn.disabled = false; m.hidden = false;
      m.textContent = er.message === "many" ? "محاولات كتير غلط. استنى ساعة وجرّب تاني." : er.message === "blocked" ? "الوصول مقفول للرقم ده. كلّم نوح." : er.message === "code" ? "الكود غلط أو خلص. طلّع كود جديد من الجهاز التاني." : "محتاج نت عشان تربط الجهاز.";
    });
  }

  $("acc-sync").addEventListener("click", function () { doSync(this); });
  $("acc-link").addEventListener("click", function () { showCode(this); });
  $("bk-out").addEventListener("click", backupOut);
  $("bk-in").addEventListener("click", backupIn);
  document.addEventListener("click", function (e) {
    if (e.target.closest("#bk-copy")) copy();
    if (e.target.closest("#bk-apply")) backupApply();
    if (e.target.closest("#join-open")) { $("join").hidden = false; $("join-code").focus(); }
  });
  $("join-form").addEventListener("submit", joinApply);
  window.addEventListener("mst-sync", status);
  status();
  // أول ما الصفحة تفتح (ولما ترجعلها): مزامنة كل المواد
  function auto() { if (get("mst-name") && navigator.onLine !== false) A.sync(list().map(function (s) { return s.skey; })).then(status, status); }
  setTimeout(auto, 800);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && Date.now() - A.lastSync() > 60000) auto(); });
  setInterval(status, 30000);
})();
