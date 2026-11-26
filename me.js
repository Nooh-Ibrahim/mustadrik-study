// الصفحة الرئيسية: كارت التسجيل (بيظهر عند الطلب بس: زرار «سجّل»، أو محاضرة مقفولة، أو ‎#who)، و«أهلاً يا …».
// («وقتي» في صفحة «حسابك»: mytime.js)
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  // المكان اللي الطالب كان رايحه قبل التسجيل (محاضرة مقفولة): بيتفتح بعد ما يسجّل
  function next(keep) { var n = null; try { n = sessionStorage.getItem("mst-next"); if (!keep) sessionStorage.removeItem("mst-next"); } catch (e) {} return n && /^c\.html\?s=[A-Za-z0-9_]+(#[A-Za-z0-9_=&%.-]*)?$/.test(n) ? n : null; }

  function first(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }
  function hello() {
    var n = get("mst-name");
    $("hello").hidden = !n;
    if (n) $("hello-name").textContent = first(n);
    if ($("reg")) $("reg").hidden = !!n;
  }
  // mode: "edit" تعديل اسم موجود، "lock" جاي من محاضرة مقفولة، ومن غيره تسجيل عادي
  function openWho(mode) {
    var edit = mode === "edit", why = $("who-why");
    $("who").hidden = false;
    $("who-h").textContent = edit ? "عدّل اسمك أو رقمك" : "سجّل في 10 ثوانٍ";
    why.hidden = edit;
    why.textContent = mode === "lock" ? "هذه المحاضرة تحتاج حسابًا. سجّل مرة واحدة: تُفتح كل المحاضرات، ويُحفظ تقدّمك على كل أجهزتك."
      : "مرة واحدة فقط: تُفتح كل المحاضرات في كل المواد، ويُحفظ تقدّمك على كل أجهزتك.";
    $("join-q").hidden = edit; if (edit) $("join").hidden = true;
    $("who-form").querySelector("button[type=submit]").textContent = edit ? "حفظ" : "سجّل";
    $("who-later").textContent = edit ? "إلغاء" : "ليس الآن";
    if (edit) { $("who-name").value = get("mst-name") || ""; $("who-phone").value = get("mst-phone") || ""; }
    $("who").scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(function () { try { $("who-name").focus({ preventScroll: true }); } catch (e) {} }, 450);
  }
  function closeWho() {
    $("who").hidden = true;
    if (location.hash === "#who" || /[?&]edit=1/.test(location.search)) try { history.replaceState(null, "", location.pathname); } catch (e) {}
  }
  function saveWho(e) {
    e.preventDefault();
    var name = $("who-name").value.replace(/\s+/g, " ").trim();
    var phone = $("who-phone").value.replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
    var err = $("who-err");
    if (name.split(" ").length < 2) { err.textContent = "اكتب اسمك ثنائيًا على الأقل."; err.hidden = false; return; }
    if (!/^01[0125]\d{8}$/.test(phone)) { err.textContent = "رقم الواتساب يجب أن يكون 11 رقمًا ويبدأ بـ 01."; err.hidden = false; return; }
    err.hidden = true;
    if (window.MST) window.MST.setWho(name, phone); else { set("mst-name", name); set("mst-phone", phone); set("mst-who-sent", "0"); }
    set("mst-first", "1");
    closeWho(); hello();
    var n = next();
    // التصريح والمزامنة (acct.js): أول ما يسجّل، تقدّمه بيتحفظ على حسابه. ولو كان رايح محاضرة: نفتحها (c.html بياخد التصريح بنفسه)
    if (n) { location.href = n; return; }
    if (window.MSTA) window.MSTA.ensure().then(function () { return window.MSTA.sync(); }).then(function () { window.dispatchEvent(new CustomEvent("mst-sync")); }).catch(function () {});
    window.dispatchEvent(new CustomEvent("mst-who"));
  }
  $("who-form").addEventListener("submit", saveWho);
  $("who-later").addEventListener("click", function () { next(); closeWho(); });
  if ($("reg-go")) $("reg-go").addEventListener("click", function () { openWho(); });
  function fromHash() {
    if (location.hash !== "#who") return;
    if (get("mst-name")) { try { history.replaceState(null, "", location.pathname); } catch (e) {} return; }
    openWho(next(true) ? "lock" : "");
  }
  window.addEventListener("hashchange", fromHash);
  window.MSTHello = hello;
  window.MSTWho = { open: openWho, close: closeWho };
  hello();
  if (/[?&]edit=1/.test(location.search) && get("mst-name")) openWho("edit");
  else fromHash();
})();
