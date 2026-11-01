// المشترك بين صفحات الموقع (الرئيسية، وصفحة المادة، وحسابك، ودليل الرموز):
// زرار الوضع الفاتح والغامق (hub-theme)، والـ Service Worker، و«أهلاً» في الشريط اللي فوق.
(function () {
  "use strict";
  var root = document.documentElement, btn = document.getElementById("theme");
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }
  // الزرار أيقونة (شمس أو قمر) والكلام للقارئ الصوتي
  function label() {
    if (!btn) return;
    var d = isDark();
    btn.setAttribute("aria-label", d ? "الوضع الفاتح" : "الوضع الغامق");
    btn.title = btn.getAttribute("aria-label");
    btn.innerHTML = d
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>';
  }
  if (btn) btn.addEventListener("click", function () {
    var t = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("hub-theme", t); } catch (e) {}
    label();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", label);
  label();
  // «حسابك» في الشريط: الاسم الأول لو متسجّل
  var me = document.getElementById("nav-me");
  if (me && get("mst-name")) me.querySelector("span").textContent = String(get("mst-name")).trim().split(/\s+/)[0];
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function (e) { console.warn("sw:", e); });
})();
