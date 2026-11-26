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
    { code: "GEN002", name: "اللغة الإنجليزية 1", base: "GEN002_English", skey: "gen002", state: "open", pdf_size: 0 },
    { code: "CS50x", name: "CS50x: مقدمة في علوم الحاسب (هارفارد)", base: "CS50x_IntroCS", skey: "cs50x", state: "open", pdf_size: 0 }
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
    // بدأ المادة (حل سؤال أو فتح درس): شريط تقدّم و«كمّل». لسه: «ابدأ»
    var on = p.a > 0 || !!(getJ("mst-last") || {})[s.skey];
    return '<a class="card course' + (on ? " on" : "") + '" href="' + link(s) + '" aria-labelledby="c-' + c + '" data-base="' + esc(s.base) + '">' + head +
      (on ? '<span class="cbar" role="progressbar" aria-label="الأسئلة التي حللتها" aria-valuenow="' + p.pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + Math.max(3, p.pct) + '%"></i></span>' +
        '<span class="cfoot"><span class="cst">' + (p.pct ? "حللت " + p.pct + "% من الأسئلة" : "لم تحل أسئلة بعد") + '</span><span class="cgo">أكمل</span></span>'
        : '<span class="cfoot"><span class="cgo new">ابدأ</span></span>') + "</a>";
  }
  // الكورسات اللي برّه مواد الكلية (CS50x و ICPC): قسم «كورسات» لوحده. s.kind === "course" من السيرفر بيكفي لأي كورس جديد
  var TRACKS = { CS50x: 1, ICPC: 1 };
  function isTrack(s) { return s.kind === "course" || !!TRACKS[s.code]; }
  // المواد الخاصة (s.grp، بكود): كل مجموعة تحت عنوانها، ومواد الدفعة تحت «مواد الذكاء الاصطناعي». ومن غير كود: زي الأول بالظبط.
  function groups() { var g = getJ("mst-groups"); return g && g.length ? g : []; }
  var picking = false;
  // سهم جنب «مواد الكلية» و«كورسات» بيطوي القسم كله، عشان اللي عايز ينزل للي تحت يوصل بسرعة (طلب نوح 2026-11-26).
  // الطيّ بيتحفظ على الجهاز (home-fold)
  function folds() { return getJ("home-fold") || {}; }
  function paintFold() {
    var F = folds();
    [["courses", ["courses"]], ["tracks", ["tracks", "tracks-p"]]].forEach(function (x) {
      var shut = !!F[x[0]], b = $(x[0] + "-f"), none = x[0] === "tracks" && $("tracks-h").hidden;
      b.setAttribute("aria-expanded", String(!shut));
      x[1].forEach(function (id) { $(id).hidden = shut || none; });
    });
  }
  function fold(name, shut) { var F = folds(); if (shut) F[name] = 1; else delete F[name]; set("home-fold", JSON.stringify(F)); paintFold(); }
  ["courses", "tracks"].forEach(function (n) { $(n + "-f").addEventListener("click", function () { fold(n, this.getAttribute("aria-expanded") === "true"); }); });
  function draw() {
    var l = list(), G = groups().filter(function (g) { return l.some(function (s) { return s.grp === g.grp; }); });
    var T = l.filter(function (s) { return !s.grp && isTrack(s); });
    $("courses").innerHTML = l.filter(function (s) { return !s.grp && !isTrack(s); }).map(card).join("");
    $("courses-t").textContent = picking ? "1. اختر مادة" : "مواد الكلية";
    if (picking) fold("courses", false);
    $("tracks").innerHTML = T.map(card).join("");
    $("tracks-h").hidden = !T.length;
    paintFold();
    $("gcourses").innerHTML = G.map(function (g) {
      return '<h2 class="sec">' + esc(g.name) + '</h2><div class="courses">' + l.filter(function (s) { return s.grp === g.grp; }).map(card).join("") + "</div>";
    }).join("");
    resume(); news();
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
    // المحاضرة اللي كان فيها (L من المحرّك) بتفتح على طول، والدرس نفسه مكتوب
    var l = best.l || {}, ci = cinfo(best.s), lec = null, p = prog(best.s);
    if (l.L && ci && ci.lectures) lec = ci.lectures.filter(function (x) { return String(x.n) === String(l.L); })[0] || null;
    box.href = link(best.s) + (l.L ? "#lec=" + encodeURIComponent(l.L) : "");
    box.innerHTML = '<span class="rk">أكمل من حيث توقفت</span><b class="rn">' + esc(best.s.name) + "</b>" +
      (l.t ? '<span class="rl">' + (lec ? esc(lec.short || lec.t) + " · " : "") + esc(l.t) + "</span>" : "") +
      (p.pct ? '<span class="rbar"><span class="cbar" aria-hidden="true"><i style="width:' + Math.max(3, p.pct) + '%"></i></span><small>حللت ' + p.pct + "% من أسئلة المادة</small></span>" : "") +
      '<span class="rgo">أكمل</span>';
  }

  // كارت «جديد في المواد»: البنود العلمية من سجل التحديثات (news في data/courses.json، آخر أسبوعين).
  // فوق المواد ومفتوح (طلب نوح 2026-11-26): آخر جديد في كل مادة ظاهر، والباقي تحت «كل الجديد».
  var MON = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  function arDate(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ""); return m ? (+m[3]) + " " + MON[+m[2] - 1] : ""; }
  // آخر 5 أيام بس (طلب نوح 2026-11-26)، بتاريخ الجهاز
  var NEWS_DAYS = 5;
  function cutoff() { var d = new Date(Date.now() - NEWS_DAYS * 864e5); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function news() {
    var rows = [], more = [], n = 0, box = $("news"), cut = cutoff();
    function li(x) { return "<li>" + esc(x.t) + (arDate(x.date) ? " <small>" + arDate(x.date) + "</small>" : "") + "</li>"; }
    list().map(function (s) {
      var c = cinfo(s); if (s.state !== "open" || !c || !c.news) return null;
      var N = c.news.filter(function (x) { return (x.date || "") >= cut; }).sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
      return N.length ? { s: s, N: N, d: N[0].date || "" } : null;
    }).filter(Boolean).sort(function (a, b) { return b.d.localeCompare(a.d); }).forEach(function (o, i) {
      // أحدث مادتين ظاهرين (آخر بند في كل واحدة)، والباقي كله تحت «كل الجديد» عشان الكارت مايطوّلش على الموبايل
      var h = '<a class="nwh" href="' + link(o.s) + '">' + esc(o.s.name) + "</a>", N = i < 2 ? o.N.slice(1) : o.N;
      n += o.N.length;
      if (i < 2) rows.push('<div class="nw">' + h + "<ul>" + li(o.N[0]) + "</ul></div>");
      if (N.length) more.push('<div class="nw">' + h + "<ul>" + N.map(li).join("") + "</ul></div>");
    });
    box.hidden = !rows.length;
    box.innerHTML = rows.length ? '<h2 id="news-h"><span class="dot" aria-hidden="true"></span>جديد في المواد</h2><p class="fine">ما أُضيف في آخر ' + NEWS_DAYS + ' أيام. وداخل المادة نقطة حمراء بجانب الدرس الجديد.</p><div class="nws">' + rows.join("") + "</div>" +
      (more.length ? '<details class="nmore"><summary>كل الجديد (' + n + ")</summary>" + more.join("") + "</details>" : "") : "";
  }
  // علامة «✓» اللي كانت جنب عدد الدروس (المادة محفوظة على الجهاز) اتشالت 2026-11-26: محدش فهمها،
  // وسطر «الموقع اتحفظ على جهازك… وكل مادة بتتحفظ أول ما تفتحها» اللي تحت بيقول نفس الكلام.
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
    $("courses-t").textContent = "1. اختر مادة"; fold("courses", false);
    $("courses-h").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function lectures(s, el) {
    var c = cinfo(s), box = $("lecpick");
    if (!c || !c.lectures || !c.lectures.length) { location.href = link(s); return; }
    var tr = trialOf(c), reg = !!get("mst-name");
    [].forEach.call(document.querySelectorAll(".course.sel"), function (x) { x.classList.remove("sel"); });
    el.classList.add("sel");
    box.hidden = false;
    box.innerHTML = '<h2 class="sec" id="lp-h">2. اختر محاضرة من ' + esc(s.name) + '</h2><div class="lplist">' + c.lectures.map(function (l) {
      var free = reg || tr.indexOf(String(l.n)) >= 0;
      var dr = (c.draft || []).indexOf(String(l.n)) >= 0;
      return '<a class="lp' + (free ? "" : " lock") + '" href="' + link(s) + "#lec=" + encodeURIComponent(l.n) + '"><b>' + esc(l.t) + (dr ? ' <i class="dr">تجريبية</i>' : "") + "</b>" +
        (reg ? "" : "<span>" + (free ? "متاحة دون حساب" : "تحتاج حسابًا (التسجيل في 10 ثوانٍ)") + "</span>") + "</a>";
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
    "<b>كل مادة في ملف واحد:</b> الدروس مشروحة خطوة بخطوة، وكل أسئلة الشيتات والكويزات بحلولها.",
    "<b>تحت كل سؤال:</b> لماذا الإجابة الصحيحة صحيحة، ولماذا كل اختيار آخر خطأ.",
    "<b>النجمة ★ تعني «مهم».</b> والأسئلة التي أخطأت فيها تُجمع تلقائيًا لتراجعها قبل الامتحان.",
    "<b>أول محاضرة وآخر محاضرة في كل مادة متاحتان دون حساب.</b> والتسجيل يستغرق 10 ثوانٍ: يفتح الباقي، ويحفظ تقدّمك على كل أجهزتك."
  ];
  function tour(i) {
    var box = $("tour"), last = i === TOUR.length - 1;
    $("first-b").hidden = true; box.hidden = false;
    box.innerHTML = '<p class="tn">' + (i + 1) + " من " + TOUR.length + '</p><p class="tt">' + TOUR[i] + '</p><div class="row"><button type="button" class="btn" id="t-next">' +
      (last ? "اختر مادة" : "التالي") + "</button>" + (last ? "" : '<button type="button" class="linkbtn" id="t-skip">تخطّي</button>') + "</div>";
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
    if (!A || !A.on) { if (m) m.textContent = "الكود يعمل على الموقع الأصلي فقط (nooh-ibrahim.github.io)."; return Promise.resolve(); }
    return A.ensure().then(function (tok) {
      return fetch(EP + "/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tok: tok, code: code }) })
        .then(function (r) { return r.json().catch(function () { return {}; }); });
    }).then(function (j) {
      if (j.ok) { try { localStorage.removeItem("mst-gcode"); } catch (e) {} if (m) { m.className = "fine okm"; m.textContent = "✓ فُتحت: " + j.name + "."; } return pullSubjects(); }
      if (j.err === "code") { try { localStorage.removeItem("mst-gcode"); } catch (e) {} }
      if (m) m.textContent = j.err === "many" ? "محاولات خاطئة كثيرة. انتظر ساعة ثم حاول مرة أخرى." : j.err === "code" ? "هذا الكود غير صحيح. تأكد منه ممن أرسله إليك." : j.blocked ? "الوصول مغلق لرقمك. تواصل معنا." : "حدثت مشكلة. حاول مرة أخرى.";
    }, function (e) {
      if (e.message === "noname") { if (m) m.textContent = "الكود يحتاج حسابًا. سجّل أولًا، وسيُرسل الكود تلقائيًا."; set("mst-gcode", code); if (window.MSTWho) window.MSTWho.open(); }
      else if (m) m.textContent = "الكود يحتاج اتصالًا بالإنترنت.";
    });
  }
  function pending() { var c = get("mst-gcode"); if (c && get("mst-name")) redeem(c, $("g-msg")); }
  pending();
  addEventListener("mst-sync", pending); // بعد ما يكتب اسمه ورقمه (me.js)
  $("g-open").addEventListener("click", function () { var b = $("g-box"); b.hidden = !b.hidden; this.setAttribute("aria-expanded", String(!b.hidden)); if (!b.hidden) $("g-code").focus(); });
  $("g-box").addEventListener("submit", function (e) {
    e.preventDefault(); var m = $("g-msg"), v = $("g-code").value.trim(); m.className = "fine"; m.textContent = "";
    if (v.length < 4) { m.textContent = "اكتب الكود كاملًا."; return; }
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
      $("home-msg").textContent = "✓ رُبط هذا الجهاز بحسابك" + (r.changed && r.changed.length ? "، ووصل تقدّمك في " + r.changed.length + " مادة." : ".");
      draw(); pullSubjects();
    }, function (er) {
      btn.disabled = false; m.hidden = false;
      m.textContent = er.message === "many" ? "محاولات خاطئة كثيرة. انتظر ساعة ثم حاول مرة أخرى." : er.message === "blocked" ? "الوصول مغلق لهذا الرقم. تواصل معنا." : er.message === "code" ? "الكود خطأ أو انتهت صلاحيته. أنشئ كودًا جديدًا من الجهاز الآخر." : "ربط الجهاز يحتاج اتصالًا بالإنترنت.";
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
