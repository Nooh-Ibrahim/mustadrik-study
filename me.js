// الصفحة الرئيسية: كارت الاسم، و«أهلاً يا …»، وقسم «وقتي».
// بيقرا السجل من localStorage (mst-log) اللي stats.js بيكتبه، فبيشتغل من غير نت، وبيزوّد عليه وقت باقي أجهزة الحساب من /mytime (mst-tlog).
// ?demo=1 بيعرض أرقام تجريبية (من غير ما يحفظ حاجة)، عشان نشوف شكل «وقتي».
(function () {
  "use strict";
  var COURSES = [["bas114", "الفيزياء"], ["csc115", "نظم الحاسب"], ["bas112", "التفاضل والتكامل"], ["bas113", "الجبر الخطي"], ["bas116", "الكهرباء والإلكترونيات"]];
  // المواد الجديدة اللي نوح بيضيفها من صفحة الإدارة (home.js بيحفظ اللستة في mst-subjects)
  try { var SL = JSON.parse(localStorage.getItem("mst-subjects")); if (SL && SL.length) COURSES = SL.filter(function (s) { return s.state !== "hidden"; }).map(function (s) { return [s.code.toLowerCase(), s.name]; }); } catch (e) {}
  var DAYS = ["الحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];
  var $ = function (id) { return document.getElementById(id); };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function day(t) { return new Date(t + 3 * 3600e3).toISOString().slice(0, 10); }
  var DEMO = /demo=1/.test(location.search);

  // ---------- الاسم ----------
  function first(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }
  function hello() {
    var n = get("mst-name");
    $("hello").hidden = !n;
    if (n) $("hello-name").textContent = first(n);
  }
  function openWho(edit) {
    $("who").hidden = false;
    if (edit) { $("who-name").value = get("mst-name") || ""; $("who-phone").value = get("mst-phone") || ""; }
  }
  function saveWho(e) {
    e.preventDefault();
    var name = $("who-name").value.replace(/\s+/g, " ").trim();
    var phone = $("who-phone").value.replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
    var err = $("who-err");
    if (name.split(" ").length < 2) { err.textContent = "اكتب اسمك ثنائي على الأقل."; err.hidden = false; return; }
    if (!/^01[0125]\d{8}$/.test(phone)) { err.textContent = "رقم الواتساب لازم يبقى 11 رقم ويبدأ بـ 01."; err.hidden = false; return; }
    err.hidden = true;
    if (window.MST) window.MST.setWho(name, phone); else { set("mst-name", name); set("mst-phone", phone); set("mst-who-sent", "0"); }
    $("who").hidden = true; document.documentElement.classList.remove("gate"); hello();
    // التصريح والمزامنة (acct.js): أول ما يسجّل، تقدّمه بيتحفظ على حسابه
    if (window.MSTA) window.MSTA.ensure().then(function () { return window.MSTA.sync(); }).then(function () { window.dispatchEvent(new CustomEvent("mst-sync")); }).catch(function () {});
  }
  $("who-form").addEventListener("submit", saveWho);
  // المادة المقفولة: الضغط عليها (أو على أي لينك جوّاها) بيودّي لكارت التسجيل
  document.addEventListener("click", function (e) {
    if (!document.documentElement.classList.contains("gate") || !e.target.closest || !e.target.closest(".course")) return;
    e.preventDefault(); $("who").scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(function () { $("who-name").focus(); }, 400);
  }, true);
  // «إلغاء» بيظهر بس وانت بتعدّل اسم موجود (من غير اسم الكارت إجباري ومفيهوش إلغاء)
  $("who-later").addEventListener("click", function () { $("who").hidden = true; });
  $("edit-who").addEventListener("click", function () { openWho(true); $("who").scrollIntoView({ behavior: "smooth", block: "center" }); });
  window.MSTHello = hello;
  hello();
  if (!get("mst-name")) openWho(false);

  // ---------- وقتي ----------
  function fmt(s) {
    s = Math.round(s || 0); if (s < 60) return s ? "أقل من دقيقة" : "0 دقيقة";
    var m = Math.round(s / 60); if (m < 60) return m + " دقيقة";
    var h = Math.floor(m / 60); m = m % 60; return h + " ساعة" + (m ? " و " + m + " دقيقة" : "");
  }
  function demoLog() {
    var L = {}, now = Date.now();
    for (var i = 0; i < 30; i++) {
      var d = day(now - i * 864e5), e = (L[d] = {});
      COURSES.forEach(function (c, j) { if (Math.random() < 0.5) e[c[0]] = [Math.round(Math.random() * 3600 * (j % 2 ? 1 : 1.6)), 1]; });
    }
    return L;
  }
  var log = DEMO ? demoLog() : (function () { try { return JSON.parse(get("mst-log")) || {}; } catch (e) { return {}; } })();
  var range = 7;
  // وقت باقي أجهزة الحساب من السيرفر (/mytime): o = الجهاز ده، و x = الأجهزة التانية المربوطة.
  // الوقت = أكبر (المحلي، o) + x، فالجهاز اللي سجلّه اتمسح بياخد وقته من السيرفر، ومفيش حاجة بتتحسب مرتين.
  function getJ(k) { try { return JSON.parse(get(k)) || {}; } catch (e) { return {}; } }
  var TL = DEMO ? {} : getJ("mst-tlog");
  function one(d, c) {
    var e = log[d], l = e && e[c] ? e[c][0] : 0, o = TL.o && TL.o[d] && TL.o[d][c] || 0, x = TL.x && TL.x[d] && TL.x[d][c] || 0;
    return Math.max(l, o) + x;
  }
  function secsOf(d, c) { if (c) return one(d, c); return COURSES.reduce(function (s, k) { return s + one(d, k[0]); }, 0); }
  function allDays() { var D = {}; [log, TL.o || {}, TL.x || {}].forEach(function (m) { Object.keys(m).forEach(function (d) { D[d] = 1; }); }); return Object.keys(D); }
  var EP = "https://mustadrak-stats.mustadrak.workers.dev", tAt = 0;
  if (location.hostname === "localhost" && get("mst-ep")) EP = get("mst-ep");
  function pull() {
    var tok = get("mst-tok"); if (DEMO || !tok || navigator.onLine === false || Date.now() - tAt < 20000) return;
    tAt = Date.now();
    fetch(EP + "/mytime", { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ tok: tok }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (!j || !j.ok) return; TL = { o: j.o || {}, x: j.x || {}, at: Date.now() }; set("mst-tlog", JSON.stringify(TL)); draw(); })
      .catch(function () {});
  }
  function draw() {
    var now = Date.now(), today = day(now), days = [];
    for (var i = range - 1; i >= 0; i--) days.push(day(now - i * 864e5));
    var all = allDays().reduce(function (s, d) { return s + secsOf(d); }, 0);
    if (!all) { $("mytime").hidden = true; return; } // لسه مفيش وقت جوّه المواد
    $("mytime").hidden = false;
    var inRange = days.reduce(function (s, d) { return s + secsOf(d); }, 0);
    $("t-today").textContent = fmt(secsOf(today));
    $("t-range").textContent = fmt(inRange);
    $("t-range-l").textContent = range === 7 ? "آخر 7 أيام" : "آخر 30 يوم";
    $("t-all").textContent = fmt(all);
    var mx = Math.max.apply(null, days.map(function (d) { return secsOf(d); }).concat([60]));
    $("t-chart").innerHTML = days.map(function (d, i) {
      var s = secsOf(d), dt = new Date(d + "T12:00:00Z");
      var lab = range === 7 ? DAYS[dt.getUTCDay()] : ((range - 1 - i) % 5 === 0 ? String(dt.getUTCDate()) : "");
      return '<div class="tb' + (d === today ? " now" : "") + '" title="' + d + ': ' + fmt(s) + '"><span class="tv" style="height:' + Math.max(s ? 4 : 0, s / mx * 100) + '%"></span><i>' + lab + '</i></div>';
    }).join("");
    var per = COURSES.map(function (c) { return [c[1], days.reduce(function (s, d) { return s + secsOf(d, c[0]); }, 0)]; }).sort(function (a, b) { return b[1] - a[1]; });
    var pm = Math.max.apply(null, per.map(function (p) { return p[1]; }).concat([1]));
    $("t-per").innerHTML = per.map(function (p) {
      return '<div class="pr"><span class="pn">' + p[0] + '</span><span class="pb"><span style="width:' + (p[1] / pm * 100) + '%"></span></span><span class="pt">' + (p[1] ? fmt(p[1]) : "—") + '</span></div>';
    }).join("");
    [].forEach.call(document.querySelectorAll("[data-range]"), function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-range") === range)); });
  }
  [].forEach.call(document.querySelectorAll("[data-range]"), function (b) {
    b.addEventListener("click", function () { range = +b.getAttribute("data-range"); draw(); });
  });
  draw(); pull();
  addEventListener("pageshow", function () { if (!DEMO) { try { log = JSON.parse(get("mst-log")) || {}; } catch (e) {} draw(); pull(); } });
  addEventListener("mst-sync", function () { tAt = 0; pull(); });
  addEventListener("mst-time", function () { tAt = 0; pull(); }); // «زامن دلوقتي» وبعد الربط
})();
