// صور «دليل الرموز» (key.html): كل رمز بشكله الحقيقي من ملف مادة مبني، فاتح وغامق → img/key/<الاسم>-l.webp و -d.webp
//   node tools/key-shots.mjs
// شغّلها لو شكل حاجة في المحرّك اتغيّر (core/). الأسماء هنا هي اللي key.html بيستخدمها.
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { open } from "./cdp.mjs";
const HUB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BUILD = "F:/آخر/Claude/study/build";
const OUT = path.join(HUB, "img", "key"); fs.mkdirSync(OUT, { recursive: true });
const file = (c) => JSON.parse(fs.readFileSync(`${BUILD}/${c}/config.json`, "utf8")).htmlOut;
// c المادة، sel العنصر، tab تاب (b البنك، s المحاكاة، p تقدّمي، m المهم)، sib = العنصر واللي بعده، click = زرار قبل الصورة
const ITEMS = [
  { id: "tools", c: "physics", sel: ".mast-top .tools", maxh: 200 },
  { id: "tabs", c: "physics", sel: "#bar", maxh: 200 },
  { id: "legend", c: "physics", sel: ".legend", maxh: 200 },
  { id: "eqcnt", c: "physics", sel: ".eq.cnt", sib: true },
  { id: "big", c: "physics", sel: ".big[data-mk]", maxh: 260 },
  { id: "mn", c: "physics", sel: ".mn", maxh: 300 },
  { id: "trap", c: "physics", sel: ".trap", maxh: 300 },
  { id: "ex", c: "physics", sel: ".ex", maxh: 300 },
  { id: "method", c: "linalg", sel: ".method", maxh: 520 },
  { id: "cmap", c: "linalg", sel: ".cmap", maxh: 520 },
  { id: "qt", c: "cs", sel: ".qt", maxh: 260 },
  { id: "lfoot", c: "physics", sel: "[data-drill-topic]", up: 1, maxh: 220 },
  { id: "qc", c: "physics", tab: "b", sel: ".qc:has([data-conf])", maxh: 640 },
  { id: "sim", c: "physics", tab: "s", sel: "#panel-s", maxh: 520 },
  { id: "prog", c: "physics", tab: "p", sel: "#panel-p", maxh: 560 },
  { id: "marks", c: "physics", tab: "m", sel: "#panel-m", maxh: 420 },
  { id: "note", c: "physics", click: "#note-open", sel: "#mst-note form", maxh: 560, after: "var m=document.getElementById(\"mst-note\"); if(m) m.remove();" }
];
const B = await open({ port: 9335, sport: 8792 });
let cur = "";
for (const it of ITEMS) {
  if (cur !== it.c) { await B.go(file(it.c)); cur = it.c; }
  for (const th of ["light", "dark"]) {
    const r = await B.ev(`(async function(){
      var w=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
      document.documentElement.setAttribute("data-theme","${th}");
      var ov=document.querySelector("#ov [data-close]"); if(ov&&!document.getElementById("ov").hidden) ov.click();
      ${it.tab ? `document.getElementById("tab-${it.tab}").click(); await w(700);` : `document.getElementById("tab-l").click(); await w(200);`}
      var vis=function(x){return x.getBoundingClientRect().height>0};
      var el=[].slice.call(document.querySelectorAll(${JSON.stringify(it.sel)})).filter(vis)[0];
      if(!el && !${!!it.tab}){
        var any=document.querySelector(${JSON.stringify(it.sel)}), s=any&&any.closest("section[data-key]");
        if(s){var a=document.createElement("a");a.setAttribute("data-go",s.dataset.key);a.href="#";document.body.appendChild(a);a.click();a.remove();await w(900);}
        el=[].slice.call(document.querySelectorAll(${JSON.stringify(it.sel)})).filter(vis)[0];
      }
      ${it.click ? `document.querySelector(${JSON.stringify(it.click)}).click(); await w(700); el=document.querySelector(${JSON.stringify(it.sel)});` : ""}
      if(!el) return null;
      ${it.up ? "el=el.parentElement;" : ""}
      el.scrollIntoView({block:"center"}); await w(600);
      var b=el.getBoundingClientRect(), x0=b.left, x1=b.right, y0=b.top, y1=b.bottom;
      ${it.sib ? "var n=el.nextElementSibling.getBoundingClientRect(); x0=Math.min(x0,n.left); x1=Math.max(x1,n.right); y1=n.bottom;" : ""}
      return {x:x0+scrollX,y:y0+scrollY,w:x1-x0,h:Math.min(y1-y0,${it.maxh || 400})};
    })()`);
    if (!r) { console.log("✗", it.id); continue; }
    await B.shot(r, path.join(OUT, `${it.id}-${th[0]}.webp`), 8);
    if (it.after) await B.ev(it.after);
  }
  console.log("✓", it.id);
}
B.close();
