// العدّاد: بيسجّل «الصفحة اتفتحت» و«الثواني اللي الصفحة كانت ظاهرة فيها».
// - على الجهاز (mst-log): عشان الطالب يشوف وقته في «وقتي»، ويشتغل من غير نت.
// - وبيبعتها لعدّاد مُستدرِك على Cloudflare (ومن غير نت بتستنى في mst-q لحد ما النت يرجع).
// - mst-dev رقم عشوائي للجهاز، و mst-name و mst-phone اللي الطالب كتبهم في كارت الاسم.
// مابيلمسش أي مفتاح تاني في localStorage (تقدّم المواد زي ما هو).
// ملفات المواد فيها نفس المنطق (core/stats.js في المحرّك)، بنفس المفاتيح، فالوقت جوّه المواد بيظهر في «وقتي» لوحده.
(function () {
  "use strict";
  var EP = "https://mustadrak-stats.mustadrak.workers.dev";
  // لينك التجربة مابيبعتش حاجة للعدّاد، عشان مايلخبطش الأرقام
  var SEND = /(^|\.)nooh-ibrahim\.github\.io$|^localhost$/.test(location.hostname);
  try { if (location.hostname === "localhost" && localStorage.getItem("mst-ep")) EP = localStorage.getItem("mst-ep"); } catch (e) {} // للتجربة على الجهاز
  var me = document.currentScript, PAGE = (me && me.getAttribute("data-page")) || "home";
  function rid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getJ(k, d) { try { return JSON.parse(get(k)) || d; } catch (e) { return d; } }
  var CAIRO = (function () { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }); } catch (e) { return null; } })();
  function day(t) { if (CAIRO) try { var o = {}; CAIRO.formatToParts(new Date(t)).forEach(function (x) { o[x.type] = x.value; }); if (o.year && o.month && o.day) return o.year + "-" + o.month + "-" + o.day; } catch (e) {} return new Date(t + 2 * 3600e3).toISOString().slice(0, 10); } // بتوقيت القاهرة (صيفي وشتوي)، زي السيرفر

  var dev = get("mst-dev"); if (!dev) { dev = rid(); set("mst-dev", dev); }
  var ses = rid();
  var app = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  var mob = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  // نوع الجهاز لصفحة الإدارة (زي "iPhone · Safari")، من غير أي حاجة تعرّف الشخص
  var dv = (function (u) {
    var d = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? "iPad" : /Android/.test(u) ? "Android"
      : /Windows/.test(u) ? "Windows" : /Macintosh/.test(u) ? "Mac" : /CrOS/.test(u) ? "ChromeOS" : /Linux/.test(u) ? "Linux" : "";
    var b = /Edg\//.test(u) ? "Edge" : /SamsungBrowser/.test(u) ? "Samsung" : /OPR\//.test(u) ? "Opera" : /Firefox|FxiOS/.test(u) ? "Firefox"
      : /CriOS|Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "";
    return [d, b].filter(Boolean).join(" · ").slice(0, 40);
  })(navigator.userAgent);
  var q = getJ("mst-q", []);

  // سجل الجهاز: { "2026-10-09": { "bas114": [ثواني, مرات فتح] } }
  function addLog(page, secs, opens) {
    var L = getJ("mst-log", {}), d = day(Date.now()), e = (L[d] = L[d] || {}), r = (e[page] = e[page] || [0, 0]);
    r[0] += secs; r[1] += opens; set("mst-log", JSON.stringify(L));
  }
  function push(page, kind, secs) {
    addLog(page, kind === "beat" ? secs : 0, kind === "view" ? 1 : 0);
    if (!SEND) return;
    q.push({ dev: dev, ses: ses, page: page, kind: kind, secs: secs || 0, t: Date.now(), app: app, mob: mob, dv: dv });
    if (q.length > 3000) q = q.slice(-3000); // من غير نت: لحد حوالي يومين مذاكرة بيستنوا النت
    set("mst-q", JSON.stringify(q));
  }
  var busy = false;
  function flush(leaving) {
    if (!SEND || !q.length || busy || navigator.onLine === false) return;
    // الأحداث بتتبعت بالتصريح بس (من 2026-10-16). من غير تسجيل بتستنى في الطابور لحد ما الاسم يتبعت
    var tok = get("mst-tok");
    if (!tok || get("mst-blocked") === "1") { sendWho(); return; }
    var batch = q.slice(0, 50), body = JSON.stringify({ tok: tok, ev: batch });
    // text/plain عشان الطلب يبقى بسيط (من غير طلب استئذان قبله)
    if (leaving && navigator.sendBeacon) {
      if (navigator.sendBeacon(EP + "/hit", new Blob([body], { type: "text/plain" }))) { q = q.slice(batch.length); set("mst-q", JSON.stringify(q)); }
      return;
    }
    busy = true;
    fetch(EP + "/hit", { method: "POST", headers: { "Content-Type": "text/plain" }, body: body, keepalive: true })
      .then(function (r) { busy = false; if (r.status === 401) { set("mst-tok", ""); set("mst-who-sent", "0"); sendWho(); } if (r.status === 403) set("mst-blocked", "1"); if (r.ok) { q = q.slice(batch.length); set("mst-q", JSON.stringify(q)); if (q.length) flush(); } })
      .catch(function () { busy = false; });
    sendWho();
  }

  // الاسم والرقم: بيتبعتوا مرة، ولو مفيش نت بيتبعتوا بعدين
  // التسجيل بيرجّع «تصريح» (mst-tok) على الحساب (mst-acct): بيفتح الملفات ويزامن التقدّم (acct.js)
  function sendWho() {
    if (!SEND || (get("mst-who-sent") === "1" && get("mst-tok")) || !get("mst-name") || get("mst-blocked") === "1") return;
    var acct = get("mst-acct"); if (!acct) { acct = rid(); set("mst-acct", acct); }
    fetch(EP + "/who", { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ dev: dev, name: get("mst-name"), phone: get("mst-phone") || "", acct: acct, dv: dv }) })
      .then(function (r) { return r.json().then(function (j) { if (r.ok && j.tok) { set("mst-who-sent", "1"); set("mst-tok", j.tok); set("mst-acct", j.acct); } else if (j.blocked) set("mst-blocked", "1"); }); }).catch(function () {});
  }

  // الوقت: كل 15 ثانية والصفحة ظاهرة بنزوّد، وكل 60 ثانية بنسجّل
  var acc = 0, last = Date.now();
  function tick() {
    var now = Date.now();
    if (document.visibilityState === "visible") acc += Math.min(now - last, 20000) / 1000;
    last = now;
    if (acc >= 60) { push(PAGE, "beat", Math.round(acc)); acc = 0; flush(); }
  }
  setInterval(tick, 15000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      tick(); if (acc >= 3) { push(PAGE, "beat", Math.round(acc)); acc = 0; }
      flush(true);
    } else { last = Date.now(); flush(); }
  });
  addEventListener("online", function () { flush(); });

  // فتح المادة ووقتها بيتحسبوا من جوّه ملف المادة نفسه (core/stats.js في المحرّك)، فالرئيسية مابتحسبهمش عشان مايتحسبوش مرتين

  // رسايل نوح للطالب: كارت فوق الصفحة لكل رسالة، و«تمام» بيقول للسيرفر إنها اتقرت (فماتظهرش تاني على أي جهاز ليه)
  var shown = {};
  function msgs() {
    if (!SEND || navigator.onLine === false) return;
    fetch(EP + "/msg?dev=" + encodeURIComponent(dev)).then(function (r) { return r.ok ? r.json() : []; }).then(function (list) {
      if (!Array.isArray(list)) return;
      var main = document.querySelector("main"); if (!main) return;
      list.forEach(function (m) {
        if (shown[m.id] || typeof m.txt !== "string") return; shown[m.id] = 1;
        var c = document.createElement("section"); c.className = "card msg-card"; c.setAttribute("role", "status");
        var h = document.createElement("h2"); h.textContent = "رسالة من نوح";
        var p = document.createElement("p"); p.className = "msg-txt"; p.textContent = m.txt;
        var b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.textContent = "تمام";
        b.onclick = function () {
          c.remove();
          fetch(EP + "/msg-seen", { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ dev: dev, id: m.id }) }).catch(function () {});
        };
        c.appendChild(h); c.appendChild(p); c.appendChild(b);
        main.insertBefore(c, main.firstChild);
      });
    }).catch(function () {});
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") msgs(); });

  window.MST = {
    log: function () { return getJ("mst-log", {}); },
    who: function () { return { name: get("mst-name") || "", phone: get("mst-phone") || "" }; },
    setWho: function (name, phone) { set("mst-name", name); set("mst-phone", phone); set("mst-who-sent", "0"); sendWho(); },
    day: day
  };

  push(PAGE, "view");
  flush();
  msgs();
  if (window.onMST) window.onMST();
})();
