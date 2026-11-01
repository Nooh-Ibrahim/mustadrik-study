// كروم من غير واجهة + سيرفر محلي لملفات المواد (F:\دراسة)، لأدوات course-data و key-shots.
// open() بترجّع: go(ملف المادة) و ev(كود جوّه الصفحة) و shot(مكان، ملف) و close().
import fs from "fs"; import path from "path"; import { spawn } from "child_process";
const BUILD = "F:/آخر/Claude/study/build";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = "F:/دراسة"; // بعض المواد مابترسمش ملاعبها من file://، فبتتفتح من سيرفر (build/serve.mjs)
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function open({ port = 9334, sport = 8791, width = 420 } = {}) {
  const srv = spawn(process.execPath, [BUILD + "/serve.mjs", String(sport), ROOT], { stdio: "ignore" });
  const prof = path.join(process.env.TEMP || "/tmp", "mustadrak-cdp-" + port);
  const ch = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--user-data-dir=" + prof, "--remote-debugging-port=" + port, "about:blank"], { stdio: "ignore" });
  let tabs; for (let i = 0; i < 60 && !tabs; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(250); } }
  const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const pend = {};
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 2, mobile: false });
  return {
    ev,
    // file: مسار ملف المادة المبني (config.json → htmlOut)
    async go(file) {
      await send("Page.navigate", { url: `http://localhost:${sport}/` + path.relative(ROOT, file).split(path.sep).map(encodeURIComponent).join("/") });
      await sleep(3500);
      await ev(`(function(){var w=document.getElementById("welcome");if(w)w.hidden=true;})()`);
    },
    async shot(r, out, pad = 6) {
      const s = await send("Page.captureScreenshot", { format: "webp", quality: 70, captureBeyondViewport: true, clip: { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + 2 * pad, height: r.h + 2 * pad, scale: 1 } });
      fs.writeFileSync(out, Buffer.from(s.result.data, "base64"));
    },
    close() { ws.close(); ch.kill(); srv.kill(); }
  };
}
