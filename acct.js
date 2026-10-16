
// الحساب على أكتر من جهاز (نفس الملف ده في المواد وفي الموقع: group-a-study-hub/acct.js).
// - التسجيل (الاسم والرقم) بيدّي «تصريح» (mst-tok) على حساب (mst-acct). التصريح بيفتح الملفات ويزامن التقدّم.
// - المزامنة: تقدّم كل مادة (<key>-track و -marks و -mdel و -rst) بيتدمج مع اللي على الحساب، في الاتجاهين.
//   الدمج (mergeP) نفسه اللي في السيرفر: لكل سؤال الأحدث، و«سجل غلطاتي» (wat و clr) مابيضيعش،
//   والعلامة اللي اتشالت (mdel) والمسح (rst) بيوصلوا للأجهزة التانية.
// - ربط جهاز تاني: link() بيطلّع كود 6 أرقام، والجهاز التاني join(code).
// - نسخة احتياطية من غير نت: backup() كود واحد لكل المواد، و restore() (ونفس الكود بيتقري من «انقل تقدّمي» جوّه المادة).
// بيشتغل من الموقع و localhost بس. لينك كلود والملف المتنزّل: مفيش مزامنة.
(function () {
  "use strict";
  var EP = "https://mustadrak-stats.mustadrak.workers.dev";
  var ON = /(^|\.)nooh-ibrahim\.github\.io$|^localhost$/.test(location.hostname);
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function getJ(k, d) { try { var v = JSON.parse(get(k)); return v == null ? d : v; } catch (e) { return d; } }
  if (location.hostname === "localhost" && get("mst-ep")) EP = get("mst-ep"); // للتجربة على الجهاز
  function rid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12); }
  function dev() { var d = get("mst-dev"); if (!d) { d = rid(); set("mst-dev", d); } return d; }
  function acct() { var a = get("mst-acct"); if (!a) { a = rid(); set("mst-acct", a); } return a; }
  function post(path, body) {
    return fetch(EP + path, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.status = r.status; return j; }); });
  }

  function mergeP(a, b) {
    a = a || {}; b = b || {};
    var rst = Math.max(+a.rst || 0, +b.rst || 0), T = {}, M = {}, D = {};
    function mr(o, r) {
      var w = (r.at || 0) > (o.at || 0) || ((r.at || 0) === (o.at || 0) && (r.n || 0) > (o.n || 0));
      var x = Object.assign({}, w ? r : o), y = w ? o : r;
      var wat = Math.max(+o.wat || 0, +r.wat || 0), clr = Math.max(+o.clr || 0, +r.clr || 0);
      if (wat) x.wat = wat; if (clr) x.clr = clr;
      x.n = Math.max(+x.n || 0, +y.n || 0); if ((+x.ok || 0) > x.n) x.ok = x.n;
      return x;
    }
    [a.track, b.track].forEach(function (t) {
      if (!t || typeof t !== "object") return;
      Object.keys(t).forEach(function (id) {
        var r = t[id]; if (!r || typeof r !== "object") return;
        if (rst && (+r.at || 0) <= rst) return;
        T[id] = T[id] ? mr(T[id], r) : Object.assign({}, r);
      });
    });
    [a.mdel, b.mdel].forEach(function (m) { if (m && typeof m === "object") Object.keys(m).forEach(function (k) { var v = +m[k] || 0; if (v > rst && v > (D[k] || 0)) D[k] = v; }); });
    [a.marks, b.marks].forEach(function (m) { if (m && typeof m === "object") Object.keys(m).forEach(function (k) { var v = +m[k] || 1; if (v > (M[k] || 0)) M[k] = v; }); });
    Object.keys(M).forEach(function (k) { if (M[k] <= (D[k] || 0) || (rst && M[k] <= rst)) delete M[k]; });
    return { track: T, marks: M, mdel: D, rst: rst };
  }

  function local(k) { return { track: getJ(k + "-track", {}), marks: getJ(k + "-marks", {}), mdel: getJ(k + "-mdel", {}), rst: getJ(k + "-rst", 0) }; }
  // بيكتب بس اللي اتغيّر، وبيرجّع true لو حاجة اتغيّرت
  function write(k, m) {
    var ch = false;
    [["track", m.track], ["marks", m.marks], ["mdel", m.mdel], ["rst", m.rst]].forEach(function (p) {
      var s = JSON.stringify(p[1]), key = k + "-" + p[0];
      if (p[0] === "rst" && !p[1]) return;
      if (get(key) !== s) { set(key, s); if (p[0] !== "mdel") ch = true; }
    });
    return ch;
  }
  // مفاتيح المواد اللي ليها تقدّم على الجهاز ده
  function keys(extra) {
    var out = {};
    (extra || []).forEach(function (k) { if (k) out[k] = 1; });
    try { for (var i = 0; i < localStorage.length; i++) { var m = /^([a-z0-9]{2,24})-(track|marks)$/.exec(localStorage.key(i)); if (m) out[m[1]] = 1; } } catch (e) {}
    return Object.keys(out);
  }
  function fire(list) { try { window.dispatchEvent(new CustomEvent("mst-sync", { detail: { keys: list } })); } catch (e) {} }

  var pending = null;
  function ensure() {
    if (!ON) return Promise.reject(new Error("off"));
    var t = get("mst-tok"); if (t) return Promise.resolve(t);
    if (!get("mst-name")) return Promise.reject(new Error("noname"));
    if (pending) return pending;
    pending = post("/who", { dev: dev(), name: get("mst-name"), phone: get("mst-phone") || "", acct: acct() }).then(function (j) {
      pending = null;
      if (j.blocked) { set("mst-blocked", "1"); throw new Error("blocked"); }
      if (!j.tok) throw new Error("who");
      set("mst-tok", j.tok); set("mst-acct", j.acct); set("mst-who-sent", "1"); del("mst-blocked");
      return j.tok;
    }, function (e) { pending = null; throw e; });
    return pending;
  }

  var syncing = null;
  function sync(extra) {
    if (syncing) return syncing;
    var ks = keys(extra);
    syncing = ensure().then(function (tok) {
      var items = {}; ks.forEach(function (k) { items[k] = local(k); });
      return post("/sync", { tok: tok, items: items });
    }).then(function (j) {
      syncing = null;
      if (j.status === 401) { del("mst-tok"); throw new Error("tok"); }
      if (j.blocked) { set("mst-blocked", "1"); throw new Error("blocked"); }
      if (!j.items) throw new Error("sync");
      var changed = [];
      Object.keys(j.items).forEach(function (k) { if (write(k, mergeP(local(k), j.items[k]))) changed.push(k); });
      set("mst-sync-at", String(Date.now()));
      if (changed.length) fire(changed);
      return { changed: changed, keys: Object.keys(j.items) };
    }, function (e) { syncing = null; throw e; });
    return syncing;
  }

  function link() {
    return ensure().then(function (tok) { return post("/link", { tok: tok }); }).then(function (j) {
      if (j.status === 401) { del("mst-tok"); throw new Error("tok"); }
      if (!j.code) throw new Error(j.blocked ? "blocked" : "link");
      return j;
    });
  }
  function join(code) {
    return post("/join", { dev: dev(), code: String(code || "").replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }) }).then(function (j) {
      if (!j.tok) throw new Error(j.err === "many" ? "many" : j.blocked ? "blocked" : "code");
      set("mst-name", j.name); set("mst-phone", j.phone || ""); set("mst-acct", j.acct); set("mst-tok", j.tok); set("mst-who-sent", "1"); del("mst-blocked");
      return sync().then(function (r) { return r; }, function () { return { changed: [] }; });
    });
  }

  // نسخة احتياطية: كود واحد لكل المواد (بيتنسخ في واتساب أو النوتس)
  function backup(extra) {
    var all = {}, n = 0;
    keys(extra).forEach(function (k) { var l = local(k); if (Object.keys(l.track).length || Object.keys(l.marks).length) { all[k] = { track: l.track, marks: l.marks }; n++; } });
    return { n: n, code: "MST:" + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 3, t: Date.now(), all: all })))) };
  }
  // بيتجاهل أي حرف مش من الكود (واتساب والنوتس بيحطوا علامات اتجاه مخفية)، وبيقبل كمان كود مادة واحدة
  function parse(code) {
    code = String(code || "").trim(); if (!code) throw new Error("empty");
    var a = code.indexOf("{"), b = code.lastIndexOf("}"), json;
    if (a > -1 && b > a) json = code.slice(a, b + 1);
    else { var m = code.match(/([A-Za-z0-9]+):/); json = decodeURIComponent(escape(atob((m ? code.slice(m.index + m[0].length) : code).replace(/[^A-Za-z0-9+/=]/g, "")))); }
    var d = JSON.parse(json);
    if (d && d.all && typeof d.all === "object") return d.all;
    if (d && d.k && d.track) { var o = {}; o[d.k] = { track: d.track, marks: d.marks || {} }; return o; }
    throw new Error("shape");
  }
  function restore(code, replace) {
    var all = parse(code), n = 0, list = [], now = Date.now();
    Object.keys(all).forEach(function (k) {
      if (!/^[a-z0-9]{2,24}$/.test(k)) return;
      var inc = { track: all[k].track || {}, marks: all[k].marks || {} }, cur = local(k);
      // «استبدل»: مسح (rst) قبل اللي جاي بلحظة، واللي جاي (إجابات وعلامات) بوقت بعده، فالمزامنة ماترجّعش القديم
      var m = replace ? mergeP({ rst: now - 1 }, stamp(inc, now)) : mergeP(cur, inc);
      if (replace) { set(k + "-track", JSON.stringify(m.track)); set(k + "-marks", JSON.stringify(m.marks)); set(k + "-rst", JSON.stringify(m.rst)); set(k + "-mdel", "{}"); }
      else write(k, m);
      n += Object.keys(inc.track).length; list.push(k);
    });
    if (list.length) { fire(list); if (get("mst-tok")) sync().catch(function () {}); }
    return { n: n, keys: list };
  }
  // في «استبدل»: الإجابات اللي جاية لازم تبقى أحدث من وقت المسح، عشان المزامنة ماترجّعش القديم
  function stamp(p, now) {
    var t = {}, mk = {};
    Object.keys(p.track).forEach(function (id) { if (p.track[id] && typeof p.track[id] === "object") t[id] = Object.assign({}, p.track[id], { at: Math.max(+p.track[id].at || 0, now) }); });
    Object.keys(p.marks).forEach(function (k) { mk[k] = Math.max(+p.marks[k] || 0, now); });
    return { track: t, marks: mk };
  }
  window.MSTA = { on: ON, ensure: ensure, sync: sync, link: link, join: join, backup: backup, restore: restore, parse: parse, mergeP: mergeP, keys: keys,
    linked: function () { return !!get("mst-tok"); }, lastSync: function () { return +get("mst-sync-at") || 0; } };

  // جوّه المادة: مزامنة المادة دي لوحدها (بعد ما تفتح، وبعد الإجابات، ولما الصفحة تستخبى)
  if (!ON || !window.MST_K) return;
  var K = window.MST_K, timer = 0;
  function later(ms) { clearTimeout(timer); timer = setTimeout(function () { if (navigator.onLine !== false) sync([K]).catch(function () {}); }, ms); }
  later(1500);
  window.addEventListener("mst-ans", function () { later(15000); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-qmk],[data-mkb],[data-clr],#reset-yes,#x-apply")) later(8000); }, true);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") { if (timer) later(0); } else later(1000); });
  addEventListener("online", function () { later(1000); });
})();

