// كود مادة خاصة (طلب نوح 2026-11-28، بند 31): الخانة اتنقلت من الصفحة الرئيسية لصفحة «حسابك» (#g-box).
// بيتحمّل في الصفحتين: اللينك ممكن يبقى فيه الكود (./?code=...)، فبيتحفظ (mst-gcode) ويتبعت أول ما يبقى فيه اسم وتصريح.
// بعد ما الكود يفتح مادة: لستة المواد بتتجاب تاني (mst-subjects)، وحدث «mst-subjects» بيخلّي الرئيسية ترسم الكروت من جديد.
(function () {
  "use strict";
  var EP = "https://mustadrak-stats.mustadrak.workers.dev";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  if (location.hostname === "localhost" && get("mst-ep")) EP = get("mst-ep");
  var $ = function (id) { return document.getElementById(id); };
  var A = window.MSTA;

  var qc = (/[?&]code=([A-Za-z0-9-]{4,24})/.exec(location.search) || [])[1];
  if (qc) { set("mst-gcode", qc); try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {} }

  function pullSubjects() {
    var tok = get("mst-tok");
    return fetch(EP + "/subjects", { cache: "no-store", headers: tok ? { "X-Tok": tok } : {} }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.list || !j.list.length) return;
      set("mst-subjects", JSON.stringify(j.list)); set("mst-groups", JSON.stringify(j.groups || []));
      try { window.dispatchEvent(new CustomEvent("mst-subjects")); } catch (e) {}
    }).catch(function () {});
  }
  function say(m, t, ok) { if (!m) return; m.className = "fine" + (ok ? " okm" : ""); m.textContent = t; }
  function redeem(code, m) {
    if (!A || !A.on) { say(m, "الكود يعمل على الموقع الأصلي فقط (nooh-ibrahim.github.io)."); return Promise.resolve(); }
    return A.ensure().then(function (tok) {
      return fetch(EP + "/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tok: tok, code: code }) })
        .then(function (r) { return r.json().catch(function () { return {}; }); });
    }).then(function (j) {
      if (j.ok) { del("mst-gcode"); say(m, "✓ فُتحت: " + j.name + ". ستجدها في الصفحة الرئيسية.", true); return pullSubjects(); }
      if (j.err === "code") del("mst-gcode");
      say(m, j.err === "many" ? "محاولات خاطئة كثيرة. انتظر ساعة ثم حاول مرة أخرى." : j.err === "code" ? "هذا الكود غير صحيح. تأكد منه ممن أرسله إليك." : j.blocked ? "الوصول مغلق لرقمك. تواصل معنا." : "حدثت مشكلة. حاول مرة أخرى.");
    }, function (e) {
      if (e && e.message === "noname") { set("mst-gcode", code); say(m, "الكود يحتاج حسابًا. سجّل أولًا، وسيُرسل الكود تلقائيًا."); if (window.MSTWho) window.MSTWho.open(); else location.href = "./#who"; }
      else say(m, "الكود يحتاج اتصالًا بالإنترنت.");
    });
  }
  function pending() { var c = get("mst-gcode"); if (c && get("mst-name")) redeem(c, $("g-msg") || $("home-msg")); }
  pending();
  addEventListener("mst-sync", pending); // بعد ما يكتب اسمه ورقمه (me.js)

  var box = $("g-box");
  if (!box) return;
  box.addEventListener("submit", function (e) {
    e.preventDefault(); var m = $("g-msg"), v = $("g-code").value.trim();
    if (v.length < 4) return say(m, "اكتب الكود كاملًا.");
    say(m, "لحظة…"); redeem(v, m);
  });
})();
