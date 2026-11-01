// بيطلّع بيانات صفحات المواد (data/courses.json) من ملفات المواد المبنية في F:\دراسة، وصور الملاعب (img/labs/).
//   node tools/course-data.mjs            ← البيانات بس
//   node tools/course-data.mjs --shots    ← والصور كمان (فاتح وغامق، webp)
// بيفتح كل ملف مادة بكروم من غير واجهة (tools/cdp.mjs) ويقرا منه: المحاضرات والدروس والملاعب وعدد الأسئلة.
// الكلام المكتوب بإيد لكل ملعب (الاسم والوصف) في tools/labs-text.mjs، واللي مالوش كلام بياخد عنوانه من الملف.
// شغّلها بعد أي رفع لمادة فيه دروس أو ملاعب جديدة (بتقرا build/<المادة>/config.json و changelog.json بس، مابتعدّلش فيهم).
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { open } from "./cdp.mjs";
import TEXT from "./labs-text.mjs";
const HUB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BUILD = "F:/آخر/Claude/study/build";
const SHOTS = process.argv.includes("--shots");
const COURSES = ["physics", "cs", "calc", "linalg", "elec", "english"];
const B = await open();

// بيتنفّذ جوّه ملف المادة
const READ = `(function(){
  var T=function(e){return e?e.textContent.replace(/\\s+/g," ").trim():""};
  var secs=[].slice.call(document.querySelectorAll("section.lesson[data-key]"));
  var labs=[];
  secs.forEach(function(s){
    [].slice.call(s.querySelectorAll("[data-lab], .pg[id]")).forEach(function(el){
      var hs=[].slice.call(s.querySelectorAll("h2,h3,h4,h5")).filter(function(h){return h.compareDocumentPosition(el)&4});
      var lid=el.getAttribute("data-lab")||el.id, n=labs.filter(function(x){return x.raw===lid}).length;
      labs.push({raw:lid,id:lid+(n?n+1:""),key:s.dataset.key,lec:s.dataset.lec,lesson:s.dataset.title,head:T(hs[hs.length-1]).slice(0,140),txt:T(el).slice(0,260)});
    });
  });
  var C=window.COURSE||{}, L=C.lectures||{}, Q=window.QS||[];
  return {lede:T(document.querySelector(".lede")), h1:T(document.querySelector(".titles h1")), en:T(document.querySelector(".h1en")),
    lectures:Object.keys(L).map(function(k){return {n:k,t:L[k].title,short:L[k].short,en:L[k].en,lessons:secs.filter(function(s){return s.dataset.lec===k}).map(function(s){return s.dataset.title})}}),
    lessons:secs.length, q:Q.length, mcq:Q.filter(function(q){return q.o}).length, plots:document.querySelectorAll("[data-plot]").length, labs:labs};
})()`;

const out = { gen: new Date().toISOString().slice(0, 10), courses: {} };
const shotsDir = path.join(HUB, "img", "labs"); if (SHOTS) fs.mkdirSync(shotsDir, { recursive: true });
for (const c of COURSES) {
  const cfg = JSON.parse(fs.readFileSync(`${BUILD}/${c}/config.json`, "utf8"));
  let cl = []; try { cl = JSON.parse(fs.readFileSync(`${BUILD}/${c}/changelog.json`, "utf8")); } catch {}
  const file = cfg.htmlOut;
  await B.go(file);
  const d = await B.ev(READ);
  const tx = TEXT[cfg.base] || {};
  if (process.env.DUMP) fs.appendFileSync(process.env.DUMP, d.labs.map((l) => cfg.base + " | " + l.id + " | " + l.lesson + " | " + l.head + " || " + l.txt).join("\n") + "\n");
  const labs = d.labs.map((l) => ({ id: l.id, raw: l.raw, lec: l.lec, key: l.key, lesson: l.lesson, t: (tx[l.id] || [])[0] || l.head.replace(/^➕\s*/, "").replace(/^جرّب بإيدك:\s*/, "") || l.lesson, d: (tx[l.id] || [])[1] || "", star: !!(tx[l.id] || [])[2] }));
  // التفاضل مفيهوش ملاعب: بنعرض رسومات منه بدلها (tx._plots)
  const extra = (tx._plots || []).map((p) => ({ id: "plot-" + p[0], key: p[0], t: p[1], d: p[2], plot: true }));
  // كل ملعب بيتفتح (عشان اسمه ووصفه من الملعب نفسه)، والصورة بتتاخد مع --shots بس
  for (const l of labs.concat(extra)) {
    const sel = l.plot ? `[data-key="${l.key}"] [data-plot]` : `section[data-key="${l.key}"] [data-lab="${l.raw}"], section[data-key="${l.key}"] .pg#${l.raw}`;
    for (const th of SHOTS ? ["light", "dark"] : ["light"]) {
      const r = await B.ev(`(async function(){
        document.documentElement.setAttribute("data-theme","${th}");
        var a=document.createElement("a"); a.setAttribute("data-go","${l.key}"); a.href="#"; document.body.appendChild(a); a.click(); a.remove();
        await new Promise(function(r){setTimeout(r,900)});
        var el=[].slice.call(document.querySelectorAll(${JSON.stringify(sel)})).filter(function(x){return x.getBoundingClientRect().height>0})[0];
        if(!el) return null; el.scrollIntoView({block:"start"});
        await new Promise(function(r){setTimeout(r,1400)});
        // القص على أكبر رسمة جوّه الملعب (البندول، الدايرة...) مش على الأزرار اللي فوقها
        var b=el.getBoundingClientRect(), top=b.top, bot=Math.min(b.bottom, b.top+640);
        var vis=[].slice.call(el.querySelectorAll("svg,canvas")).map(function(v){return [v,v.getBoundingClientRect()]}).filter(function(p){return p[1].width>120&&p[1].height>90}).sort(function(p,q){return q[1].width*q[1].height-p[1].width*p[1].height})[0];
        if(vis&&vis[1].bottom>bot){var v=vis[1]; bot=Math.min(b.bottom,v.bottom+24); top=Math.max(b.top,Math.min(v.top-60,bot-640));}
        // عنوان الملعب ووصفه: .labh (المحرّك: <b> العنوان و <span> الوصف)، أو أول عنوان وأول فقرة
        var T=function(e){return e?e.textContent.replace(/\\s+/g," ").trim():""}, hh=el.querySelector(".labh>b,h2,h3,h4,h5"), pp=el.querySelector(".labh>span")||(hh&&hh.nextElementSibling&&hh.nextElementSibling.tagName==="P"?hh.nextElementSibling:null);
        return {x:b.left+scrollX,y:top+scrollY,w:b.width,h:bot-top,t:T(hh).slice(0,90),s:T(pp).slice(0,160)};
      })()`);
      if (!r) { console.log("✗ صورة", cfg.base, l.id); continue; }
      if (th === "light" && !l.plot) { if (r.t && !(tx[l.id] || [])[0]) l.t = r.t.replace(/^(ملعب|➕|🧪)\s*:?\s*/u, ""); if (r.s && !(tx[l.id] || [])[1]) l.d = r.s; }
      if (!SHOTS) continue;
      await B.shot(r, path.join(shotsDir, `${cfg.base}-${l.id}-${th[0]}.webp`));
    }
  }
  for (const l of labs.concat(extra)) l.img = fs.existsSync(path.join(shotsDir, `${cfg.base}-${l.id}-l.webp`));
  out.courses[cfg.base] = {
    code: cfg.code, key: cfg.key, ar: d.h1, en: d.en, lede: d.lede, ver: cl[0] ? { v: cl[0].v, date: cl[0].date } : null,
    counts: { lessons: d.lessons, q: d.q, mcq: d.mcq, labs: labs.length, plots: d.plots },
    lectures: d.lectures, labs, plots: extra,
  };
  console.log("✓", cfg.base, "دروس", d.lessons, "أسئلة", d.q, "ملاعب", labs.length);
}
fs.writeFileSync(path.join(HUB, "data", "courses.json"), JSON.stringify(out));
console.log("→ data/courses.json", Math.round(fs.statSync(path.join(HUB, "data", "courses.json")).size / 1024) + " KB");
B.close();
