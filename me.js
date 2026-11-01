// الصفحة الرئيسية: كارت الاسم، و«أهلاً يا …». («وقتي» اتنقل لصفحة «حسابك»: mytime.js)
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

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
  else if (/[?&]edit=1/.test(location.search)) { openWho(true); setTimeout(function () { $("who").scrollIntoView({ block: "center" }); $("who-name").focus(); }, 300); }

})();
