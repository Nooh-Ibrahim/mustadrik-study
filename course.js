// صفحة المادة (m.html?s=<اسم الملف>): زرار «افتح المادة»، وملفات الطباعة، والملاعب بصورها، والمحاضرات والدروس، وطريقة الشرح.
// المعلومات من data/courses.json (بتطلّعه tools/course-data.mjs من ملفات المواد المبنية)، وملفات الطباعة وأحجامها
// من لستة السيرفر اللي الرئيسية بتحفظها (mst-subjects). المادة الخاصة (بكود) مالهاش معلومات، فبيظهر الفتح والطباعة بس.
(function () {
  "use strict";
  var EP = "https://mustadrak-stats.mustadrak.workers.dev", CONTENT = "mustadrak-study-content";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  if (location.hostname === "localhost" && get("mst-ep")) EP = get("mst-ep");
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // الإنجليزي جوّه سطر عربي بيتلف في bdi عشان الجملة ماتتعكسش
  function ar(s) {
    var re = /[A-Za-z][A-Za-z0-9'’.\/\-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’.\/\-]*)*/g, out = "", i = 0, m;
    s = String(s == null ? "" : s);
    while ((m = re.exec(s))) {
      var w = m[0].replace(/[.'’]+$/, ""); // النقطة برّه الـ bdi
      out += esc(s.slice(i, m.index)) + '<bdi class="ent" lang="en" dir="ltr">' + esc(w) + "</bdi>"; i = m.index + w.length;
    }
    return out + esc(s.slice(i));
  }
  function mb(b) { return b ? (b / 1048576).toFixed(1) + " MB" : ""; }
  var MON = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  function date(d) { var p = String(d || "").split("-"); return p.length === 3 ? +p[2] + " " + MON[+p[1] - 1] : ""; }
  function getJ(k) { try { return JSON.parse(get(k)); } catch (e) { return null; } }

  var base = (/[?&]s=([A-Za-z0-9]+_[A-Za-z0-9_]+)/.exec(location.search) || [])[1];
  if (!base) { location.replace("./"); return; }
  var subj = (getJ("mst-subjects") || []).filter(function (x) { return x.base === base; })[0] || null;
  var info = null;

  function lecName(c, n) { var L = (c && c.lectures || []).filter(function (l) { return l.n === n; })[0]; return L ? (L.short || L.t) : ""; }

  function draw() {
    var c = info && info.courses && info.courses[base];
    var name = (c && c.ar) || (subj && subj.name) || base.replace(/_/g, " ");
    var code = (c && c.code) || (subj && subj.code) || "";
    document.title = name + " · الملفات الدراسية";
    $("crumb-name").textContent = name;
    $("c-code").textContent = code; $("c-code").hidden = !code || (subj && subj.grp);
    $("c-name").textContent = name;
    $("c-en").textContent = (c && c.en) || ""; $("c-en").hidden = !(c && c.en);
    $("c-ver").innerHTML = c && c.ver ? "آخر تحديث: الإصدار " + c.ver.v + "، " + esc(date(c.ver.date)) : ""; $("c-ver").hidden = !(c && c.ver);
    $("c-open").href = "c.html?s=" + encodeURIComponent(base);
    var closed = subj && subj.state !== "open";
    $("c-open").hidden = !!closed; $("c-soon").hidden = !closed;

    // الأرقام
    var t = [];
    if (c) {
      var nl = c.lectures.filter(function (l) { return /^\d+$/.test(l.n); }).length;
      if (nl) t.push([nl, "محاضرة"]);
      t.push([c.counts.lessons, "درس"], [c.counts.q, "سؤال بحله"]);
      if (c.counts.labs) t.push([c.counts.labs, "ملعب تفاعلي"]); else if (c.counts.plots) t.push([c.counts.plots, "رسمة"]);
    }
    $("c-tiles").innerHTML = t.map(function (x) { return '<div class="stile"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>"; }).join("");
    $("c-tiles").hidden = !t.length;

    pdfs(c);
    labs(c);
    lectures(c);
    ways(c);
    saved();
  }

  // ---------- ملفات الطباعة ----------
  var DL = '<svg class="dl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function pdfs(c) {
    var out = [];
    if (subj && subj.pdf_size) out.push('<button type="button" class="pdfc full" data-pdf="' + esc(base) + '"><span class="pi">PDF</span><span class="pt2"><b data-pl>المادة كلها</b><small>كل المحاضرات في ملف واحد · <bdi dir="ltr">' + mb(subj.pdf_size) + "</bdi></small></span>" + DL + "</button>");
    (subj && subj.lec_pdfs || []).forEach(function (x) {
      var n = String(x.n).replace(/^L(?=\d)/i, ""), nm = lecName(c, n) || lecName(c, n.toLowerCase()) || x.t, L = c && c.lectures.filter(function (l) { return l.n === n || l.n === n.toLowerCase(); })[0];
      var sub = L && L.t && L.t !== nm ? L.t.replace(/^[^:]*:\s*/, "") : "";
      out.push('<button type="button" class="pdfc" data-pdf="' + esc(base + "_" + x.n) + '"><span class="pi">PDF</span><span class="pt2"><b data-pl>' + esc(nm) + "</b><small>" + (sub ? esc(sub) + " · " : "") + '<bdi dir="ltr">' + mb(x.size) + "</bdi></small></span>" + DL + "</button>");
    });
    $("c-pdfs").innerHTML = out.join("");
    $("pdf-sec").hidden = !out.length;
    $("c-pdf-top").hidden = !(subj && subj.pdf_size);
    if (subj && subj.pdf_size) $("c-pdf-top").setAttribute("data-pdf", base);
  }

  // ---------- الملاعب ----------
  function img(l, cls) {
    var p = "img/labs/" + base + "-" + l.id;
    return '<button type="button" class="shot" data-zoom="' + esc(l.id) + '" aria-label="كبّر صورة ' + esc(l.t) + '">' + (l.star ? '<span class="badge">مميّز</span>' : "") +
      '<img class="th-l" src="' + p + '-l.webp" alt="" loading="lazy" decoding="async"><img class="th-d" src="' + p + '-d.webp" alt="" loading="lazy" decoding="async"></button>';
  }
  function labCard(c, l) {
    var where = l.plot ? "" : [lecName(c, l.lec), l.lesson].filter(Boolean).join(" · ");
    return '<figure class="labc' + (l.star ? " star" : "") + '">' + (l.img ? img(l) : "") + '<figcaption class="lt"><h3>' + ar(l.t) + "</h3>" + (l.d ? "<p>" + ar(l.d) + "</p>" : "") + (where ? '<span class="where">' + ar(where) + "</span>" : "") + "</figcaption></figure>";
  }
  var ALL = [];
  function labs(c) {
    var L = c ? (c.labs.length ? c.labs : c.plots || []) : [];
    ALL = L; var isPlots = c && !c.labs.length;
    $("lab-sec").hidden = !L.length;
    if (!L.length) return;
    $("lab-h").textContent = isPlots ? "رسومات من المادة" : "ملاعب المادة";
    $("lab-lead").innerHTML = isPlots ? "المادة دي مفيهاش ملاعب لسه، بس فيها " + c.counts.plots + " رسمة حقيقية بالأرقام على المحاور. دي عيّنة منها:" :
      "الملعب حتة جوّه الدرس <b>بتجرّب فيها بإيدك</b>: تغيّر رقم أو تدوس زرار، وتشوف النتيجة بتتغيّر قدامك. فيه " + L.length + " ملعب في المادة، ودي صور حقيقية منها.";
    var star = L.filter(function (l) { return l.star; }), rest = L.filter(function (l) { return !l.star; });
    if (!star.length) { star = L.slice(0, 4); rest = L.slice(4); }
    $("labs-star").innerHTML = star.map(function (l) { return labCard(c, l); }).join("");
    $("labs-rest").innerHTML = rest.map(function (l) { return labCard(c, l); }).join("");
    $("lab-more").hidden = !rest.length;
    $("lab-more-n").textContent = rest.length;
  }
  // الصورة الكبيرة
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-zoom]"); if (!b) return;
    var l = ALL.filter(function (x) { return x.id === b.getAttribute("data-zoom"); })[0]; if (!l) return;
    var d = $("lbox"), p = "img/labs/" + base + "-" + l.id;
    d.querySelector("figure").innerHTML = '<img class="th-l" src="' + p + '-l.webp" alt=""><img class="th-d" src="' + p + '-d.webp" alt=""><figcaption><b>' + ar(l.t) + "</b>" + (l.d ? "<span>" + ar(l.d) + "</span>" : "") + "</figcaption>";
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  });
  $("lbox").addEventListener("click", function (e) { if (e.target === this || e.target.closest(".x")) this.close(); });

  // ---------- المحاضرات والدروس ----------
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function lectures(c) {
    $("lec-sec").hidden = !c;
    if (!c) return;
    var withLab = {}; c.labs.forEach(function (l) { withLab[l.lesson] = (withLab[l.lesson] || 0) + 1; });
    $("c-lecs").innerHTML = c.lectures.filter(function (l) { return l.lessons.length; }).map(function (l, i) {
      var num = /^\d+$/.test(l.n) ? l.n : l.n === "lab" ? "ع" : String(i + 1);
      var t = l.t.replace(/^[^:]*:\s*/, "");
      return '<details class="lec"><summary><span class="ln">' + esc(num) + '</span><span class="lh"><b>' + ar(l.short || l.t) + (t && t !== l.t ? "<br>" + ar(t) : "") + "</b>" + (l.en ? "<small>" + esc(l.en) + "</small>" : "") + '</span><span class="lc">' + l.lessons.length + " درس</span>" + CHEV + "</summary><ol>" +
        l.lessons.map(function (s) { return "<li>" + ar(s) + (withLab[s] ? ' <span class="lb">· ملعب</span>' : "") + "</li>"; }).join("") + "</ol></details>";
    }).join("");
  }

  // ---------- طريقة الشرح ----------
  var IC = {
    talk: '<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9.5h8M8 12.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    src: '<path d="M6 3.5h9l3 3v14H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 10h6M9 13.5h6M9 17h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    en: '<path d="M4 6h8M8 4v2M5.5 6c.6 3 2.6 5.4 5.5 6.5M10.5 6c-.6 3-2.8 5.6-6 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13 20l3.5-9 3.5 9M14.2 17h4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    lab: '<path d="M9 3.5h6M10 3.5v6l-5 9a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 18.5l-5-9v-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 14.5h9" stroke="currentColor" stroke-width="1.8"/>',
    bank: '<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 9l1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9.5h3M14 15.5h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    drill: '<path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function way(ic, t, p) { return '<div class="way"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[ic] + "</svg><div><b>" + t + "</b><p>" + p + "</p></div></div>"; }
  function ways(c) {
    $("way-sec").hidden = !c;
    if (!c) return;
    $("c-lede").innerHTML = c.lede ? ar(c.lede) : ""; $("c-lede").hidden = !c.lede;
    var labsTxt = c.counts.labs ? c.counts.labs + " ملعب تجرّب فيهم بإيدك، ورسومات حقيقية مرسومة بالأرقام." : "رسومات حقيقية بالأرقام على المحاور (" + c.counts.plots + " رسمة)، مش صور منقولة.";
    $("c-ways").innerHTML = [
      way("talk", "شرح من الصفر، خطوة خطوة", "كل درس بيبدأ بالمشكلة اللي بيحلها، وكل خطوة في الحل مكتوبة، والمهم بخط غامق، وجمل تساعدك تحفظ."),
      way("src", "كل معلومة بمصدرها", "رقم السلايد أو الصفحة جنب كل معلومة. اللي مش في ملفات الدكتور عليه «➕ إضافة مني»، والغلط في الملفات عليه «⚠» والصح جنبه."),
      way("en", "الإنجليزي زي الامتحان", "جمل السلايدات المهمة بالإنجليزي زي ما هي، وتحتها الترجمة، والمصطلحات بالإنجليزي زي ما هتيجي في الامتحان."),
      way("lab", c.counts.labs ? "ملاعب ورسومات" : "رسومات", labsTxt),
      way("bank", "بنك أسئلة بحلول كاملة", c.counts.q + " سؤال، منهم " + c.counts.mcq + " اختيار من متعدد، والباقي مسائل. كل سؤال بحله، وكل اختيار مكتوب ليه صح أو غلط."),
      way("drill", "تدريب وامتحان محاكاة", "«درّبني» آخر كل درس، واللي تغلط فيه يرجعلك تاني لحد ما يثبت. وقبل الامتحان: امتحان محاكاة بأسئلة عشوائية.")
    ].join("");
  }

  // المادة محفوظة على الجهاز؟
  function saved() {
    var el = $("c-saved"); if (!window.caches || !el) return;
    caches.open(CONTENT).then(function (cc) { return cc.match(EP + "/file/" + base + ".html"); }).then(function (r) {
      el.textContent = r ? "✓ محفوظة على جهازك، وبتفتح من غير نت" : "أول مرة تفتحها محتاج نت، وبعدها بتفتح من غير نت.";
      el.classList.toggle("on", !!r);
    }).catch(function () {});
  }

  info = getJ("mst-cinfo");
  draw();
  fetch("data/courses.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (j) {
    var t = JSON.stringify(j); if (t !== get("mst-cinfo")) { set("mst-cinfo", t); info = j; draw(); }
  }).catch(function () {});
  // لستة المواد (أحجام الطباعة وملف كل محاضرة)، لو الصفحة اتفتحت من لينك على طول من غير الرئيسية
  var tok = get("mst-tok");
  fetch(EP + "/subjects", { cache: "no-store", headers: tok ? { "X-Tok": tok } : {} }).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.list || !j.list.length) return;
    var s = JSON.stringify(j.list); if (s !== get("mst-subjects")) set("mst-subjects", s);
    set("mst-groups", JSON.stringify(j.groups || []));
    var n = j.list.filter(function (x) { return x.base === base; })[0] || null;
    if (JSON.stringify(n) !== JSON.stringify(subj)) { subj = n; draw(); }
  }).catch(function () {});
})();
