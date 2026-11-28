// خلفية الموقع (طلب نوح 2026-11-26): مسارات شريحة طالعة من شعار مُستدرِك (الميم اللي فوق)، والإلكترونات ماشية فيها.
// بتترسم ورا المحتوى بالظبط (SVG واحد على طول الصفحة)، وبتتبني من أول لما العرض أو طول الصفحة يتغيّر.
// اللي مفعّل «تقليل الحركة» على جهازه: المسارات بس من غير إلكترونات.
// صفحات المواد نفسها (المحرّك) مالهاش دعوة بالملف ده.
(function () {
  "use strict";
  if (!document.body || !window.SVGElement || document.documentElement.classList.contains("print")) return; // نسخة الـ PDF من guide.html: من غير خلفية
  var NS = "http://www.w3.org/2000/svg", doc = document.documentElement;
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "fxbg"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  document.body.classList.add("fx");
  document.body.insertBefore(svg, document.body.firstChild);

  // نفس الرسمة كل مرة (مش عشوائية مع كل فتحة)
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var DIRS = [[-1, 0], [-0.7071, 0.7071], [0, 1]]; // غرب، وجنوب غرب، وجنوب (الشعار فوق على اليمين)

  var lastW = 0, lastH = 0;
  function build() {
    svg.style.display = "none"; // عشان طول الرسمة القديمة مايدخلش في طول الصفحة
    var W = doc.clientWidth, H = Math.max(doc.scrollHeight, innerHeight);
    svg.style.display = "";
    // (سؤال نوح 2026-11-28) الرسمة كانت بتترسم من الأول على قد طول الصفحة كل ما تقصر أو تطول، فلما قسم يتقفل
    // كانت الخطوط بتقل، ولما يتفتح بتزيد. دلوقتي: بتكبر بس لو الصفحة طولت، ومابتصغرش (نفس العرض = نفس الرسمة).
    // الجزء اللي تحت آخر الصفحة بيتقص بس (overflow:hidden في site.css)، عشان الصفحة ماتطولش بسبب الرسمة.
    if (W === lastW && H < lastH + 40) { svg.setAttribute("height", H); svg.setAttribute("viewBox", "0 0 " + W + " " + H); return; }
    lastW = W; lastH = H;
    svg.setAttribute("width", W); svg.setAttribute("height", H); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var chip = document.querySelector(".topnav .brand .chip, .chip");
    var r = chip ? chip.getBoundingClientRect() : { left: W - 56, top: 12, width: 44, height: 44 };
    var cx = r.left + r.width / 2 + scrollX, cy = r.top + r.height / 2 + scrollY, half = r.width * 0.47, gap = r.width * 0.125;
    var R = rng(20301), traces = [];
    // الأرجل اللي على الشمال واللي تحت في الشريحة
    var starts = [];
    [-1.5, -0.5, 0.5, 1.5].forEach(function (k) {
      starts.push({ x: cx - half, y: cy + k * gap * 2, d: 0 });
      starts.push({ x: cx + k * gap * 2, y: cy + half, d: 2 });
    });
    var maxLen = (W + H) * 0.9, budget = 26;
    function walk(x, y, d, len, depth) {
      var pts = [[x, y]], total = 0, first = true;
      while (total < len) {
        var seg = first ? 14 + R() * 26 : 50 + R() * 170;
        first = false;
        var nx = x + DIRS[d][0] * seg, ny = y + DIRS[d][1] * seg;
        pts.push([nx, ny]); total += seg; x = nx; y = ny;
        if (x < -20 || y > H + 20) break;
        // فرع جديد أحياناً، عشان المسارات توصل لكل الصفحة
        if (depth < 3 && budget > 0 && R() < 0.22) { budget--; walk(x, y, Math.min(2, d + 1), len * (0.45 + R() * 0.4), depth + 1); }
        // لفّة 45 درجة
        var t = R(); d = t < 0.4 ? Math.max(0, d - 1) : t < 0.8 ? Math.min(2, d + 1) : d;
      }
      traces.push({ pts: pts, len: total });
    }
    starts.forEach(function (s, i) { walk(s.x, s.y, s.d, maxLen * (0.35 + R() * 0.65), 0); });

    var lines = "", dots = "", vias = "";
    traces.forEach(function (t, i) {
      var d = "M" + t.pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L");
      lines += '<path id="fx' + i + '" d="' + d + '"/>';
      var e = t.pts[t.pts.length - 1];
      vias += '<circle cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="3.2"/>';
      if (still) return;
      var dur = Math.max(4, t.len / 85), wait = dur * (0.35 + R() * 0.9), all = (dur + wait).toFixed(2), k = (dur / (dur + wait)).toFixed(3);
      var begin = (-R() * (dur + wait)).toFixed(2) + "s"; // كل إلكترون في مكان مختلف من أول ما الصفحة تفتح
      var anim = '<animateMotion dur="' + all + 's" begin="' + begin + '" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;' + k + ';1" calcMode="linear"><mpath href="#fx' + i + '"/></animateMotion>' +
        '<animate attributeName="opacity" dur="' + all + 's" begin="' + begin + '" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;0.04;' + (k * 0.92).toFixed(3) + ";" + k + ';1"/>';
      dots += '<g class="e"><circle r="8" class="halo"/><circle r="3"/>' + anim + "</g>";
    });
    svg.innerHTML = '<g class="ln">' + lines + '</g><g class="via">' + vias + "</g>" + dots;
  }
  var tm;
  function later() { clearTimeout(tm); tm = setTimeout(build, 250); }
  build();
  addEventListener("resize", later);
  addEventListener("load", later);
  if (window.ResizeObserver) new ResizeObserver(later).observe(document.body);
})();
