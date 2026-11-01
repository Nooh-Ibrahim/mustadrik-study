// ختم الدفعة (Class of AI) بحلقة التقدّم: icons/seal.svg
//   node tools/seal.mjs <الترم الحالي> <عدد الامتحانات اللي خلصت>     مثلاً: node tools/seal.mjs 1 0
// الحلقة 8 شرط (4 سنين × ترمين)، وبين كل ترم واللي بعده نقطة = امتحان الترم.
// الترتيب من فوق مع عقارب الساعة: شرطة الترم 1، فراغ، نقطة امتحان الترم 1، فراغ، شرطة الترم 2، ...
// الشرطة مليانة (دهبي) لحد الترم الحالي، والنقطة مليانة لما امتحانها يخلص. الكلام نفسه منقول زي ما هو من الختم الأصلي.
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const HUB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = "F:/آخر/Claude/شرح_الموقع/ختم_الدفعة_AI.svg";
const TERM = +(process.argv[2] || 1), EXAMS = +(process.argv[3] || 0);
const GOLD = "#D0AE62", DIM = "#3E4A68", R = 93.5, W = 7, GAP = 6.5; // GAP بالدرجات بين الشرطة والنقطة
let s = fs.readFileSync(SRC, "utf8");
// شيل الحلقة القديمة (8 أقواس عرضها 7)
s = s.replace(/<path d="M[\d.,]+ A93\.5[^"]*" fill="none" stroke="#[0-9A-F]{6}" stroke-width="7"\/>/g, "");
// قلّل الأرقام العشرية (الحجم)
s = s.replace(/-?\d+\.\d{3,}/g, (n) => String(+(+n).toFixed(2)));
const pt = (a) => { const t = (a - 90) * Math.PI / 180; return [(100 + R * Math.cos(t)).toFixed(2), (100 + R * Math.sin(t)).toFixed(2)]; };
let ring = "";
for (let k = 0; k < 8; k++) {
  const a0 = k * 45 + GAP, a1 = (k + 1) * 45 - GAP, [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  ring += `<path d="M${x0},${y0} A${R},${R} 0 0,1 ${x1},${y1}" fill="none" stroke="${k < TERM ? GOLD : DIM}" stroke-width="${W}"/>`;
  const [dx, dy] = pt((k + 1) * 45);
  // الامتحان الجاي (امتحان الترم الحالي): نقطة بحلقة دهبي
  const next = k === EXAMS && k < TERM;
  ring += `<circle cx="${dx}" cy="${dy}" r="3.6" fill="${k < EXAMS ? GOLD : DIM}"${next ? ` stroke="${GOLD}" stroke-width="1.3"` : ""}/>`;
}
s = s.replace(/(<circle cx="100" cy="100" r="100" fill="#0F1D3A"\/>)/, `$1<g><title>الترم ${TERM} من 8، وامتحانات خلصت: ${EXAMS}</title>${ring}</g>`);
s = s.replace("<svg ", '<svg role="img" aria-label="ختم دفعة 2030: كلية الذكاء الاصطناعي، جامعة الدلتا" ');
fs.writeFileSync(path.join(HUB, "icons", "seal.svg"), s);
console.log("icons/seal.svg", Math.round(s.length / 1024) + " KB", "الترم", TERM, "الامتحانات", EXAMS);
