// الصفحة الرئيسية (فابل 2، 2026-11-16): «كمّل من مكان ما وقفت»، وأول مرة («ابدأ على طول» أو «جولة سريعة»)،
// وكروت المواد (من السيرفر، عشان أي مادة نوح يضيفها من صفحة الإدارة تظهر لوحدها)، وكود المادة الخاصة.
// الكارت كله مكان دوس واحد بيفتح المادة، وعليه رقم تقدّم واحد. كارت «حسابك على أكتر من جهاز» اتنقل لصفحة «حسابك» (link.js).
// لستة المواد بتتحفظ في localStorage (mst-subjects)، فالكروت بتظهر من غير نت.
(function () {
  "use strict";
  var EP = "https://mustadrak-stats.mustadrak.workers.dev";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getJ(k) { try { return JSON.parse(get(k)); } catch (e) { return null; } }
  if (location.hostname === "localhost" && get("mst-ep")) EP = get("mst-ep");
  var CONTENT = "mustadrak-study-content";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var A = window.MSTA, root = document.documentElement;

  // ---------- المواد ----------
  var DEFAULT = [
    { code: "BAS114", name: "الفيزياء", base: "BAS114_Physics", skey: "bas114", state: "open", pdf_size: 4527809 },
    { code: "CSC115", name: "مقدمة في نظم الحاسب", base: "CSC115_ComputerSystems", skey: "cis1ch1", state: "open", pdf_size: 6290452 },
    { code: "BAS112", name: "التفاضل والتكامل", base: "BAS112_Calculus", skey: "calc1w1", state: "open", pdf_size: 5717314 },
    { code: "BAS113", name: "الجبر الخطي", base: "BAS113_LinearAlgebra", skey: "linalg1w1", state: "open", pdf_size: 3864115 },
    { code: "BAS116", name: "أساسيات الكهرباء والإلكترونيات", base: "BAS116_Electronics", skey: "bas116", state: "open", pdf_size: 2358743 },
    { code: "GEN002", name: "اللغة الإنجليزية 1", base: "GEN002_English", skey: "gen002", state: "open", pdf_size: 0 }
  ];
  function list() { var l = getJ("mst-subjects"); return l && l.length ? l : DEFAULT; }
  // معلومات صفحات المواد (data/courses.json: عدد الدروس والأسئلة، والمحاضرات). بتتحفظ في mst-cinfo عشان تظهر من غير نت.
  function cinfo(s) { var j = getJ("mst-cinfo") || {}; return (j.courses || {})[s.base] || null; }
  function link(s) { return "c.html?s=" + encodeURIComponent(s.base); }
  // التقدّم من الجهاز نفسه (<مفتاح المادة>-track): عدد الأسئلة اللي اتحلّت، وآخر مرة
  function prog(s) {
    var tr = getJ(s.skey + "-track") || {}, a = 0, at = 0, id, r, c = cinfo(s), q = c && c.counts ? c.counts.q : 0;
    for (id in tr) { r = tr[id]; if (r && r.n > 0) { a++; if (r.at > at) at = r.at; } }
    return { a: a, at: at, pct: a && q ? Math.max(1, Math.min(100, Math.round(a * 100 / q))) : 0 };
  }
  function card(s) {
    var c = s.code.toLowerCase(), ci = cinfo(s), p = prog(s);
    var head = (s.grp ? "" : '<span class="code en">' + esc(s.code) + "</span>") + '<h3 id="c-' + c + '">' + esc(s.name) + "</h3>" +
      (ci && ci.counts ? '<span class="cmeta">' + ci.counts.lessons + " درس · " + ci.counts.q + " سؤال</span>" : "");
    if (s.state !== "open") return '<div class="card course soon" data-base="' + esc(s.base) + '">' + head + '<span class="cst">قريباً</span></div>';
    return '<a class="card course" href="' + link(s) + '" aria-labelledby="c-' + c + '" data-base="' + esc(s.base) + '">' + head +
      (p.pct ? '<span class="cbar" aria-hidden="true"><i style="width:' + Math.max(4, p.pct) + '%"></i></span><span class="cst">حلّيت ' + p.pct + "% من الأسئلة</span>"
        : '<span class="cst new">ابدأ</span>') + "</a>";
  }
  // المواد الخاصة (s.grp، بكود): كل مجموعة تحت عنوانها، ومواد الدفعة تحت «مواد الذكاء الاصطناعي». ومن غير كود: زي الأول بالظبط.
  function groups() { var g = getJ("mst-groups"); return g && g.length ? g : []; }
  var picking = false;
  function draw() {
    var l = list(), G = groups().filter(function (g) { return l.some(function (s) { return s.grp === g.grp; }); });
    $("courses").innerHTML = l.filter(function (s) { return !s.grp; }).map(card).join("");
    $("courses-h").textContent = picking ? "1. اختار مادة" : G.length ? "مواد الذكاء الاصطناعي" : "المواد";
    $("gcourses").innerHTML = G.map(function (g) {
      return '<h2 class="sec">' + esc(g.name) + '</h2><div class="courses">' + l.filter(function (s) { return s.grp === g.grp; }).map(card).join("") + "</div>";
    }).join("");
    resume(); news(); saved();
  }

  // ---------- كمّل من مكان ما وقفت ----------
  // آخر مادة اتذاكرت: من آخر إجابة (track)، أو من آخر درس اتفتح (mst-last: المحرّك بيكتبه، وفيه عنوان الدرس)
  function resume() {
    var box = $("resume"), L = getJ("mst-last") || {}, best = null;
    list().forEach(function (s) {
      if (s.state !== "open") return;
      var l = L[s.skey], at = Math.max(prog(s).at, (l && +l.at) || 0);
      if (at && (!best || at > best.at)) best = { s: s, at: at, l: l };
    });
    box.hidden = !best; if (!best) return;
    box.href = link(best.s);
    box.innerHTML = '<span class="rk">كمّل من مكان ما وقفت</span><b class="rn">' + esc(best.s.name) + "</b>" +
      (best.l && best.l.t ? '<span class="rl">' + esc(best.l.t) + "</span>" : "") + '<span class="rgo">كمّل</span>';
  }

  // كارت «جديد في المواد»: البنود العلمية من سجل التحديثات (news في data/courses.json، آخر أسبوعين). تحت المواد، مش فوقها.
  var MON = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  function arDate(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ""); return m ? (+m[3]) + " " + MON[+m[2] - 1] : ""; }
  function news() {
    var rows = [], box = $("news");
    list().forEach(function (s) {
      var c = cinfo(s); if (s.state !== "open" || !c || !c.news || !c.news.length) return;
      rows.push('<div class="nw"><a class="nwh" href="' + link(s) + '">' + esc(s.name) + "</a><ul>" + c.news.map(function (x) { return "<li>" + esc(x.t) + (arDate(x.date) ? " <small>" + arDate(x.date) + "</small>" : "") + "</li>"; }).join("") + "</ul></div>");
    });
    box.hidden = !rows.length;
    box.innerHTML = rows.length ? '<details><summary><h2 id="news-h">جديد في المواد</h2></summary><p class="fine">اللي اتضاف أو اتصلّح آخر أسبوعين. جوّه المادة فيه نقطة حمرا جنب الدرس اللي فيه الجديد.</p>' + rows.join("") + "</details>" : "";
  }
  // المادة المحفوظة على الجهاز: علامة ✓ صغيرة جنب عدد الدروس (الملف الكامل أو نسخة التجربة)
  function saved() {
    if (!window.caches) return;
    caches.open(CONTENT).then(function (c) {
      [].forEach.call(document.querySelectorAll("a.course[data-base]"), function (el) {
        var b = el.getAttribute("data-base");
        Promise.all([c.match(EP + "/file/" + b + ".html"), c.match(EP + "/trial/" + b + ".html")]).then(function (r) {
          if (r[0] || r[1]) { el.classList.add("sv"); el.title = "محفوظة على جهازك، وبتفتح من غير نت"; }
        });
      });
    }).catch(function () {});
  }
  draw();
  // بالتصريح لو موجود، عشان المواد الخاصة اللي الحساب دخل كودها تيجي معاها
  function pullSubjects() {
    var tok = get("mst-tok"), h = tok ? { "X-Tok": tok } : {};
    return fetch(EP + "/subjects", { cache: "no-store", headers: h }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.list || !j.list.length) return;
      var s = JSON.stringify(j.list), g = JSON.stringify(j.groups || []);
      if (s === get("mst-subjects") && g === (get("mst-groups") || "[]")) return;
      set("mst-subjects", s); set("mst-groups", g); draw();
    }).catch(function () {});
  }
  pullSubjects();
  fetch("data/courses.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (j) {
    var t = JSON.stringify(j); if (t !== get("mst-cinfo")) { set("mst-cinfo", t); draw(); }
  }).catch(function () {});

  // ---------- أول مرة: «ابدأ على طول» (مادة ثم محاضرة) أو «جولة سريعة» ----------
  // بيظهروا للي لسه مالوش اسم ولا تقدّم، وبيختفوا بعد أول مرة (mst-first)
  function fresh() { return !get("mst-first") && !get("mst-name") && !get("mst-last") && !list().some(function (s) { return prog(s).at > 0; }); }
  function seen() { set("mst-first", "1"); }
  // المحاضرات المفتوحة من غير حساب: trial في بيانات المادة، والافتراضي أول وآخر محاضرة مرقّمة
  function trialOf(c) {
    if (c.trial) return c.trial.map(String);
    var num = c.lectures.filter(function (l) { return /^\d+$/.test(l.n) && +l.n >= 1 && (!l.lessons || l.lessons.length); });
    return num.length ? [num[0].n, num[num.length - 1].n] : [];
  }
  function pick() {
    picking = true; seen(); root.classList.add("pick");
    $("first").hidden = true;
    $("courses-h").textContent = "1. اختار مادة";
    $("courses-h").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function lectures(s, el) {
    var c = cinfo(s), box = $("lecpick");
    if (!c || !c.lectures || !c.lectures.length) { location.href = link(s); return; }
    var tr = trialOf(c), reg = !!get("mst-name");
    [].forEach.call(document.querySelectorAll(".course.sel"), function (x) { x.classList.remove("sel"); });
    el.classList.add("sel");
    box.hidden = false;
    box.innerHTML = '<h2 class="sec" id="lp-h">2. اختار محاضرة من ' + esc(s.name) + '</h2><div class="lplist">' + c.lectures.map(function (l) {
      var free = reg || tr.indexOf(String(l.n)) >= 0;
      var dr = (c.draft || []).indexOf(String(l.n)) >= 0;
      return '<a class="lp' + (free ? "" : " lock") + '" href="' + link(s) + "#lec=" + encodeURIComponent(l.n) + '"><b>' + esc(l.t) + (dr ? ' <i class="dr">تجريبية</i>' : "") + "</b>" +
        (reg ? "" : "<span>" + (free ? "مفتوحة من غير حساب" : "بحساب (التسجيل 10 ثواني)") + "</span>") + "</a>";
    }).join("") + "</div>";
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if (!t.closest) return;
    if ((el = t.closest("a.course"))) {
      seen();
      if (!picking) return;
      var b = el.getAttribute("data-base"), s = list().filter(function (x) { return x.base === b; })[0];
      if (s) { e.preventDefault(); lectures(s, el); }
      return;
    }
    // محاضرة بحساب والطالب لسه ماسجّلش: كارت التسجيل، وبعده يروح للمحاضرة على طول
    if ((el = t.closest("a.lp.lock")) && !get("mst-name")) {
      e.preventDefault();
      try { sessionStorage.setItem("mst-next", el.getAttribute("href")); } catch (er) {}
      if (window.MSTWho) window.MSTWho.open("lock");
    }
  });
  var TOUR = [
    "<b>كل مادة ملف واحد:</b> الدروس بالشرح خطوة خطوة، وكل أسئلة الشيتات والكويزات بحلها.",
    "<b>تحت كل سؤال:</b> ليه الإجابة الصح صح، وليه كل اختيار تاني غلط.",
    "<b>النجمة ★ معناها «مهم».</b> والأسئلة اللي غلطت فيها بتتجمع لوحدها، عشان تراجعها قبل الامتحان.",
    "<b>أول وآخر محاضرة في كل مادة مفتوحين من غير حساب.</b> والتسجيل 10 ثواني: يفتح الباقي، ويحفظ تقدّمك على كل أجهزتك."
  ];
  function tour(i) {
    var box = $("tour"), last = i === TOUR.length - 1;
    $("first-b").hidden = true; box.hidden = false;
    box.innerHTML = '<p class="tn">' + (i + 1) + " من " + TOUR.length + '</p><p class="tt">' + TOUR[i] + '</p><div class="row"><button type="button" class="btn" id="t-next">' +
      (last ? "اختار مادة" : "التالي") + "</button>" + (last ? "" : '<button type="button" class="linkbtn" id="t-skip">تخطّي</button>') + "</div>";
    $("t-next").onclick = function () { if (last) pick(); else tour(i + 1); };
    if (!last) $("t-skip").onclick = pick;
    $("t-next").focus();
  }
  if (fresh()) $("first").hidden = false;
  $("f-start").addEventListener("click", pick);
  $("f-tour").addEventListener("click", function () { tour(0); });

  // ---------- كود مادة خاصة (مثلاً مواد الهندسة) ----------
  // اللينك ممكن يبقى فيه الكود (?code=...): بيتحفظ، ويتبعت أول ما يبقى فيه اسم وتصريح (حتى لو سجّل بعدين)
  var qc = (/[?&]code=([A-Za-z0-9-]{4,24})/.exec(location.search) || [])[1];
  if (qc) { set("mst-gcode", qc); try { history.replaceState(null, "", location.pathname); } catch (e) {} }
  function redeem(code, m) {
    if (!A || !A.on) { if (m) m.textContent = "الكود محتاج الموقع الحقيقي (nooh-ibrahim.github.io)."; return Promise.resolve(); }
    return A.ensure().then(function (tok) {
      return fetch(EP + "/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tok: tok, code: code }) })
        .then(function (r) { return r.json().catch(function () { return {}; }); });
    }).then(function (j) {
      if (j.ok) { try { localStorage.removeItem("mst-gcode"); } catch (e) {} if (m) { m.className = "fine okm"; m.textContent = "✓ اتفتحت: " + j.name + "."; } return pullSubjects(); }
      if (j.err === "code") { try { localStorage.removeItem("mst-gcode"); } catch (e) {} }
      if (m) m.textContent = j.err === "many" ? "محاولات كتير غلط. استنى ساعة وجرّب تاني." : j.err === "code" ? "الكود ده مش صح. اتأكد منه من اللي بعتهولك." : j.blocked ? "الوصول مقفول لرقمك. كلّم نوح." : "حصل مشكلة. جرّب تاني.";
    }, function (e) {
      if (e.message === "noname") { if (m) m.textContent = "الكود محتاج حساب. سجّل الأول، والكود هيتبعت لوحده."; set("mst-gcode", code); if (window.MSTWho) window.MSTWho.open(); }
      else if (m) m.textContent = "محتاج نت عشان الكود.";
    });
  }
  function pending() { var c = get("mst-gcode"); if (c && get("mst-name")) redeem(c, $("g-msg")); }
  pending();
  addEventListener("mst-sync", pending); // بعد ما يكتب اسمه ورقمه (me.js)
  $("g-open").addEventListener("click", function () { var b = $("g-box"); b.hidden = !b.hidden; if (!b.hidden) $("g-code").focus(); });
  $("g-box").addEventListener("submit", function (e) {
    e.preventDefault(); var m = $("g-msg"), v = $("g-code").value.trim(); m.className = "fine"; m.textContent = "";
    if (v.length < 4) { m.textContent = "اكتب الكود كامل."; return; }
    m.textContent = "لحظة…"; redeem(v, m);
  });

  // ---------- «عندي حساب على جهاز تاني» (من كارت التسجيل) ----------
  $("join-open").addEventListener("click", function () { $("join").hidden = false; $("join-code").focus(); });
  $("join-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var m = $("join-err"), btn = e.target.querySelector("button[type=submit]");
    m.hidden = true; btn.disabled = true;
    A.join($("join-code").value).then(function (r) {
      try { window.dispatchEvent(new CustomEvent("mst-time")); } catch (er) {}
      btn.disabled = false; seen(); $("join").hidden = true;
      if (window.MSTWho) window.MSTWho.close();
      if (window.MSTHello) window.MSTHello();
      $("home-msg").textContent = "✓ الجهاز ده اتربط بحسابك" + (r.changed && r.changed.length ? "، وجالك تقدّمك في " + r.changed.length + " مادة." : ".");
      draw(); pullSubjects();
    }, function (er) {
      btn.disabled = false; m.hidden = false;
      m.textContent = er.message === "many" ? "محاولات كتير غلط. استنى ساعة وجرّب تاني." : er.message === "blocked" ? "الوصول مقفول للرقم ده. كلّم نوح." : er.message === "code" ? "الكود غلط أو خلص. طلّع كود جديد من الجهاز التاني." : "محتاج نت عشان تربط الجهاز.";
    });
  });

  // أول ما الصفحة تفتح (ولما ترجعلها): مزامنة كل المواد، وبعدها التقدّم على الكروت يتحدّث
  function auto() { if (A && get("mst-name") && navigator.onLine !== false) A.sync(list().map(function (s) { return s.skey; })).then(draw, function () {}); }
  setTimeout(auto, 800);
  window.addEventListener("mst-sync", draw);
  window.addEventListener("mst-who", draw);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") { draw(); if (A && Date.now() - A.lastSync() > 60000) auto(); } });
  window.addEventListener("pageshow", function (e) { if (e.persisted) draw(); });
})();
