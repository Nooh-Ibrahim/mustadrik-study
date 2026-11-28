// صفحة «حسابك»: كارت «حسابك على أكتر من جهاز» (المزامنة، والربط بكود، والنسخة الاحتياطية).
// اتنقل من الصفحة الرئيسية (فابل 2، 2026-11-16) عشان الرئيسية تبقى خفيفة.
(function () {
  "use strict";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var $ = function (id) { return document.getElementById(id); };
  var A = window.MSTA; if (!A || !$("acc")) return;
  var SK = ["bas114", "cis1ch1", "calc1w1", "linalg1w1", "bas116", "gen002", "cs50x"];
  function list() { try { var l = JSON.parse(get("mst-subjects")); if (l && l.length) return l; } catch (e) {} return SK.map(function (k) { return { skey: k, name: k }; }); }
  function ago(t) {
    if (!t) return "لم تتم بعد";
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return "الآن"; if (m < 60) return "منذ " + m + " دقيقة";
    var h = Math.round(m / 60); if (h < 24) return "منذ " + h + " ساعة";
    return "منذ " + Math.round(h / 24) + " يوم";
  }
  function status() {
    var el = $("acc-st"); if (!el) return;
    if (get("mst-blocked") === "1") { el.innerHTML = "الوصول إلى الملفات مغلق لرقمك. تواصل معنا على واتساب."; el.className = "acc-st bad"; return; }
    el.className = "acc-st" + (A.linked() ? " on" : "");
    el.textContent = A.linked() ? "✓ يُحفظ تقدّمك في كل المواد على حسابك. آخر مزامنة: " + ago(A.lastSync()) : "تقدّمك على هذا الجهاز فقط حتى الآن، وستتم المزامنة عند توفر الإنترنت.";
  }
  function doSync(btn) {
    var m = $("acc-msg"); if (btn) btn.disabled = true; m.textContent = "جارٍ المزامنة…";
    A.sync(list().map(function (s) { return s.skey; })).then(function (r) {
      m.textContent = r.changed.length ? "✓ تمت المزامنة، ووصلك تقدّم جديد في " + r.changed.length + (r.changed.length === 1 ? " مادة." : " مواد.") : "✓ تمت المزامنة، وكل شيء متطابق.";
    }, function (e) { m.textContent = e.message === "blocked" ? "الوصول مغلق لرقمك." : "لا يوجد إنترنت الآن، وستتم المزامنة تلقائيًا لاحقًا."; })
      .then(function () { if (btn) btn.disabled = false; status(); try { window.dispatchEvent(new CustomEvent("mst-time")); } catch (e) {} });
  }
  var cd = 0;
  function showCode(btn) {
    var box = $("acc-code"), m = $("acc-msg"); btn.disabled = true; m.textContent = "";
    A.link().then(function (j) {
      var end = Date.now() + j.exp * 1000;
      box.hidden = false;
      box.innerHTML = '<p>على الجهاز الآخر: افتح الموقع، واضغط <b>«سجّل»</b>، ثم <b>«لديّ حساب على جهاز آخر»</b>، واكتب هذا الكود:</p><p class="bigcode" dir="ltr">' + j.code.slice(0, 3) + " " + j.code.slice(3) + '</p><p class="fine" id="acc-left"></p>';
      clearInterval(cd);
      cd = setInterval(function () {
        var s = Math.round((end - Date.now()) / 1000);
        if (s <= 0) { clearInterval(cd); box.innerHTML = "<p>انتهت صلاحية الكود. اضغط «اربط جهازًا آخر» مرة أخرى إن احتجت.</p>"; btn.disabled = false; return; }
        $("acc-left").textContent = "الكود صالح لمدة " + Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2) + " دقيقة، ولمرة واحدة فقط.";
      }, 1000);
    }, function (e) { btn.disabled = false; m.textContent = e.message === "blocked" ? "الوصول مغلق لرقمك." : "تحتاج إلى الإنترنت لإنشاء كود."; });
  }
  function backupOut() {
    var b = A.backup(list().map(function (s) { return s.skey; })), box = $("bk-box");
    box.innerHTML = '<p>لديك تقدّم في <b>' + b.n + '</b> مادة. انسخ الكود وأرسله لنفسك (على واتساب أو في الملاحظات).</p><textarea class="xcode" readonly dir="ltr" rows="4" id="bk-code"></textarea><div class="row"><button type="button" class="btn" id="bk-copy">انسخ الكود</button></div><p class="fine" id="bk-msg" aria-live="polite"></p>';
    $("bk-code").value = b.code;
  }
  function backupIn() {
    $("bk-box").innerHTML = '<p>الصق الكود (كود كل المواد من هنا، أو كود مادة واحدة من «انقل تقدّمي» داخل المادة):</p><textarea class="xcode" dir="ltr" rows="4" id="bk-paste" placeholder="MST:..."></textarea>' +
      '<div class="chips"><label class="chip"><input type="radio" name="bk-mode" value="merge" checked> ادمج (يُؤخذ الأحدث لكل سؤال)</label><label class="chip"><input type="radio" name="bk-mode" value="replace"> استبدل تقدّمي في المواد التي في الكود</label></div><div class="row"><button type="button" class="btn" id="bk-apply">استرجع</button></div><p class="fine" id="bk-msg" aria-live="polite"></p>';
  }
  function backupApply() {
    var m = $("bk-msg"), rep = (document.querySelector('input[name="bk-mode"]:checked') || {}).value === "replace";
    try {
      var r = A.restore($("bk-paste").value, rep), names = {};
      list().forEach(function (s) { names[s.skey] = s.name; });
      m.className = "fine okm";
      m.textContent = "✓ استُرجع " + r.n + " سؤال في: " + r.keys.map(function (k) { return names[k] || k; }).join("، ") + ".";
    } catch (e) { m.className = "fine bad"; m.textContent = "الكود غير صحيح. تأكد أنك نسخته كاملًا (من أول حرف إلى آخر حرف)."; }
  }
  function copy() {
    var ta = $("bk-code"), m = $("bk-msg"); ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
    function ok() { m.className = "fine okm"; m.textContent = "نُسخ ✓"; }
    function manual() { var d = false; try { d = document.execCommand("copy"); } catch (e) {} if (d) ok(); else m.textContent = "النسخ التلقائي لا يعمل هنا. الكود محدَّد، فاضغط عليه مطوّلًا واختر «نسخ»."; }
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, manual); else manual(); } catch (e) { manual(); }
  }

  $("acc-sync").addEventListener("click", function () { doSync(this); });
  $("acc-link").addEventListener("click", function () { showCode(this); });
  $("bk-out").addEventListener("click", backupOut);
  $("bk-in").addEventListener("click", backupIn);
  document.addEventListener("click", function (e) {
    if (e.target.closest("#bk-copy")) copy();
    if (e.target.closest("#bk-apply")) backupApply();
  });
  window.addEventListener("mst-sync", status);
  status(); setInterval(status, 30000);
  if (location.hash === "#acc") setTimeout(function () { $("acc").scrollIntoView({ block: "center" }); }, 400);
})();
