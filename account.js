// صفحة «حسابك» (account.html): الاسم والرقم، والتقدّم في كل مادة، والجلسات، والأسئلة اللي غلط فيها، والأجهزة.
// التقدّم بيتقري من الجهاز (<مفتاح المادة>-track و -marks)، فبيظهر من غير نت. والباقي من السيرفر: POST /me بالتصريح
// (الشكل في mustadrak-stats/API_حسابك.md). الطلب مرة واحدة لما الصفحة تفتح (السيرفر عليه حد للطلبات).
// «وقت مذاكرتك» في mytime.js.
(function () {
  "use strict";
  var EP = "https://mustadrak-stats.mustadrak.workers.dev";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function getJ(k) { try { return JSON.parse(get(k)); } catch (e) { return null; } }
  if (location.hostname === "localhost" && get("mst-ep")) EP = get("mst-ep");
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(s) {
    s = Math.round(s || 0); if (s < 60) return s ? "أقل من دقيقة" : "0 دقيقة";
    var m = Math.round(s / 60); if (m < 60) return m + " دقيقة";
    var h = Math.floor(m / 60); m = m % 60; return h + " ساعة" + (m ? " و " + m + " دقيقة" : "");
  }
  var CAIRO = "Africa/Cairo";
  function dt(sec, o) { try { return new Intl.DateTimeFormat("ar-EG-u-nu-latn", Object.assign({ timeZone: CAIRO }, o)).format(new Date(sec * 1000)); } catch (e) { return ""; } }

  var name = get("mst-name");
  if (!name) { $("p-gate").hidden = false; $("p-body").hidden = true; $("p-edit").hidden = true; }

  function profile(n, phone, reg) {
    n = n || name || "";
    $("p-name").textContent = n || "حسابك";
    $("p-av").textContent = n ? n.trim().charAt(0) : "؟";
    $("p-phone").innerHTML = phone ? 'رقمك: <bdi dir="ltr">' + esc(phone) + "</bdi>" : "";
    $("p-since").textContent = reg ? "متسجّل من " + dt(reg, { day: "numeric", month: "long", year: "numeric" }) : "";
  }
  profile(name, get("mst-phone"), 0);

  // ---------- التقدّم في كل مادة (من الجهاز) ----------
  function subjects() {
    var l = getJ("mst-subjects") || [], info = (getJ("mst-cinfo") || {}).courses || {};
    if (!l.length) l = Object.keys(info).map(function (b) { var c = info[b]; return { base: b, code: c.code, name: c.ar, skey: c.key, state: "open" }; });
    return l.filter(function (s) { return s.state !== "hidden"; }).map(function (s) { var c = info[s.base]; return { base: s.base, code: s.code, name: s.name, skey: s.skey, total: c ? c.counts.q : 0 }; });
  }
  function progress() {
    var T = { ans: 0, ok: 0, no: 0, mk: 0 }, cards = [];
    subjects().forEach(function (s) {
      var tr = getJ(s.skey + "-track") || {}, mk = getJ(s.skey + "-marks") || {}, a = 0, ok = 0, no = 0;
      Object.keys(tr).forEach(function (id) { var r = tr[id]; if (!r || r.last === undefined) return; a++; if (r.last) ok++; else no++; });
      var m = Object.keys(mk).length;
      T.ans += a; T.ok += ok; T.no += no; T.mk += m;
      var tot = Math.max(s.total, a) || 1;
      cards.push([a + m, '<div class="ccard"><h3><a href="m.html?s=' + encodeURIComponent(s.base) + '">' + esc(s.name) + '</a><span class="code">' + esc(s.code) + "</span></h3>" +
        '<div class="cbar" role="img" aria-label="' + ok + " صح و" + no + " غلط من " + (s.total || a) + '"><span class="g" style="width:' + (ok / tot * 100) + '%"></span><span class="r" style="width:' + (no / tot * 100) + '%"></span></div>' +
        '<p class="cnums"><span>جاوبت <b>' + a + "</b>" + (s.total ? " من " + s.total : "") + "</span><span>صح آخر مرة <b>" + ok + "</b></span><span>محتاج مراجعة <b>" + no + "</b></span><span>مهم <b>" + m + "</b></span></p></div>"]);
    });
    cards.sort(function (a, b) { return b[0] - a[0]; });
    $("p-courses").innerHTML = cards.map(function (c) { return c[1]; }).join("");
    $("p-tiles").innerHTML = [[T.ans, "سؤال جاوبته"], [T.ok, "صح آخر مرة"], [T.no, "محتاج مراجعة"], [T.mk, "علّمته مهم"]].map(function (x) {
      return '<div class="stile"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>";
    }).join("");
  }
  progress();
  addEventListener("mst-sync", progress);

  // «وقت مذاكرتك» مستخبي لو مفيش وقت: رسالة بداله
  function noTime() { $("t-none").hidden = !$("mytime").hidden || !name; }
  setTimeout(noTime, 300); addEventListener("mst-time", function () { setTimeout(noTime, 1500); });

  // ---------- من السيرفر (/me) ----------
  var DEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.5 18.5h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function server(j) {
    profile(j.name, j.phone, j.reg);
    var S = j.subjects || {}, sn = function (k) { return S[k] || (k === "home" ? "الصفحة الرئيسية" : k === "guide" ? "الشرح" : k); };
    // الأجهزة
    $("d-list").innerHTML = (j.devices || []).map(function (d) {
      return '<li class="' + (d.this ? "me" : "") + '">' + DEV + "<span><b>" + esc(d.dv || "جهاز " + d.n) + (d.this ? " (الجهاز ده)" : "") + "</b><small>آخر مرة: " + dt(d.last, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }) + "</small></span></li>";
    }).join("") || '<li>الجهاز ده بس</li>';
    // الجلسات: آخر 8 جوّه المواد
    var ss = (j.sessions || []).filter(function (s) { return s.subj !== "home" && s.subj !== "guide" && s.secs >= 60; }).slice(0, 8);
    $("s-sec").hidden = !ss.length;
    $("s-list").innerHTML = ss.map(function (s) {
      var x = []; if (s.ans) x.push("جاوبت " + s.ans + " سؤال" + (s.wrong ? "، وغلطت في " + s.wrong : ""));
      return '<div class="ses"><span class="sd">' + dt(s.start, { weekday: "short", day: "numeric", month: "short" }) + '</span><span class="sn">' + esc(sn(s.subj)) + '</span><span class="st">' + fmt(s.secs) + "</span>" +
        '<span class="sx">' + dt(s.start, { hour: "numeric", minute: "2-digit" }) + " لحد " + dt(s.end, { hour: "numeric", minute: "2-digit" }) + (x.length ? " · " + x.join("") : "") + "</span></div>";
    }).join("");
    // الأسئلة اللي غلط فيها: آخر 10
    var w = (j.wrong || []).slice(0, 10);
    $("w-sec").hidden = !w.length;
    $("w-list").innerHTML = w.map(function (q) {
      return "<li>" + (q.txt ? '<span class="wq" lang="en" dir="ltr">' + esc(q.txt) + "</span>" : "<b>سؤال <bdi dir=\"ltr\">" + esc(q.qid) + "</bdi></b>") +
        '<span class="wm">' + esc(sn(q.page)) + (q.lt ? " · " + esc(q.lt) : "") + " · غلطت فيه " + q.w + (q.w === 1 ? " مرة" : " مرات") + " · " +
        (q.fixed ? '<span class="fx">✓ اتصلّحت</span>' : '<span class="nf">لسه</span>') + "</span></li>";
    }).join("");
  }
  function msg(t, bad) { var m = $("srv"); m.textContent = t || ""; m.className = "srvmsg" + (bad ? " bad" : ""); }
  function pull(again) {
    var A = window.MSTA; if (!A || !A.on || !name) { if (name) msg("الأجهزة والجلسات بتظهر على الموقع الحقيقي بس."); return; }
    if (navigator.onLine === false) { msg("مفيش نت: ده تقدّمك على الجهاز ده بس."); return; }
    A.ensure().then(function (tok) {
      return fetch(EP + "/me", { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ tok: tok }) });
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.status = r.status; return j; }); }).then(function (j) {
      if (j.ok) { msg(""); server(j); return; }
      if (j.status === 401 && !again) { try { localStorage.removeItem("mst-tok"); } catch (e) {} return pull(true); }
      if (j.status === 403) return msg("الوصول مقفول لرقمك. كلّم نوح.", true);
      if (j.status === 429) return msg("طلبات كتير. افتح الصفحة تاني بعد دقيقة.");
      msg("ماقدرناش نجيب بياناتك من السيرفر دلوقتي. ده تقدّمك على الجهاز ده.");
    }, function (e) { msg(e && e.message === "blocked" ? "الوصول مقفول لرقمك. كلّم نوح." : "ماقدرناش نوصل للسيرفر. ده تقدّمك على الجهاز ده.", e && e.message === "blocked"); });
  }
  // acct.js بيتحمّل defer قبل الملف ده، فـ MSTA جاهز
  if (name) { $("d-list").innerHTML = "<li>" + DEV + "<span><b>الجهاز ده</b></span></li>"; pull(false); }
})();
