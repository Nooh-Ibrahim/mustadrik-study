// تحميل ملفات الطباعة (PDF): أي زرار عليه data-pdf="<اسم الملف من غير .pdf>" في أي صفحة.
// الملف بيتجاب من السيرفر بالتصريح (acct.js)، وبيتحفظ على الجهاز، فبينزل تاني من غير نت.
// الكلام اللي بيتغيّر وهو بينزّل: العنصر اللي عليه data-pl جوّه الزرار (أو أول كلام فيه).
(function () {
  "use strict";
  var EP = "https://mustadrak-stats.mustadrak.workers.dev", CONTENT = "mustadrak-study-content";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  if (location.hostname === "localhost" && get("mst-ep")) EP = get("mst-ep");
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-pdf]"); if (!b || document.documentElement.classList.contains("gate")) return;
    // من غير اسم ورقم: يسجّل الأول في الصفحة الرئيسية
    if (!get("mst-name")) { location.href = "./#who"; return; }
    var A = window.MSTA, base = b.getAttribute("data-pdf"), url = EP + "/file/" + base + ".pdf", lab = b.querySelector("[data-pl]") || b.firstChild, old = lab.textContent;
    function done(blob) { lab.textContent = old; b.disabled = false; b.classList.add("got"); var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = base + ".pdf"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 60000); }
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
})();
