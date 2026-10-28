/* Zoom frame-time profiler for the cork board.
 *
 * Usage: node tools/verify/zoom-profile.mjs [runs=5] [--zone=2] [--cpu-throttle=1] [--software]
 *                                           [--method=trace|raf]
 *
 * Each run loads the page fresh, clicks the first [data-zone-stop="<zone>"]
 * paper with a real mouse press and release (zoom in), waits, presses Escape
 * (zoom out), and reports worst frame, p95 and frames over 20 ms for each
 * direction. The summary is the median across runs. This is a measuring tool,
 * not a test, so the exit code is 0 even when the numbers are bad.
 *
 * Frame times come from CDP Tracing (devtools.timeline plus the frame
 * category) by default: the gap between consecutive frames the compositor
 * actually presented. If a trace returns too few frames to be trustworthy,
 * the run falls back to a requestAnimationFrame delta sampler and says so.
 * Pass --method=raf to force the sampler.
 *
 * Chrome-launch, serve() and the CDP session are copied from cdp.mjs (which
 * does not export them). Node 24+, no dependencies.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, createReadStream, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/* SITE_ROOT points it at another copy, e.g. a tools/release/build.py output. */
const ROOT = process.env.SITE_ROOT ? resolve(process.env.SITE_ROOT) : resolve(fileURLToPath(new URL("../..", import.meta.url)));

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon",
};

/* ---- args ---------------------------------------------------------- */

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const a = argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : dflt;
};
const RUNS = Number(argv.find((x) => /^\d+$/.test(x)) ?? 5);
const ZONE = Number(flag("zone", 2));
const THROTTLE = Number(flag("cpu-throttle", 1));
const SOFTWARE = argv.includes("--software");
const FORCE_METHOD = flag("method", "");

/* The flight length is read from the source so this tool cannot drift from
   the site. */
const FLY_MS = Number(/var FLY_MS = (\d+)/.exec(readFileSync(join(ROOT, "js", "board.js"), "utf8"))?.[1]);
if (!FLY_MS) { console.error("could not read FLY_MS from js/board.js"); process.exit(0); }
const WINDOW_MS = FLY_MS + 300;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- server + Chrome + CDP (from cdp.mjs) --------------------------- */

function serve() {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      const url = new URL(req.url, "http://x");
      let p = normalize(join(ROOT, decodeURIComponent(url.pathname)));
      if (!p.startsWith(ROOT)) { res.writeHead(403).end("no"); return; }
      if (url.pathname.endsWith("/")) p = join(p, "index.html");
      res.setHeader("Cache-Control", "no-store");
      const type = MIME[extname(p).toLowerCase()];
      if (type) res.setHeader("Content-Type", type);
      const s = createReadStream(p);
      s.on("error", () => res.writeHead(404).end("404"));
      s.pipe(res);
    });
    srv.listen(0, "127.0.0.1", () => ok({ srv, port: srv.address().port }));
  });
}

async function launch(profile) {
  if (!CHROME) throw new Error("Chrome not found");
  const args = [
    "--headless=new", "--remote-debugging-port=0",
    `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
    "--hide-scrollbars",
    /* Without these a headless page drifts to visibilityState "hidden" after
       the first run, rAF stops, and every later number is empty. */
    "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
    "--disable-background-timer-throttling", "about:blank",
  ];
  if (SOFTWARE) args.splice(2, 0, "--disable-gpu");
  const proc = spawn(CHROME, args, { stdio: ["ignore", "ignore", "pipe"] });
  const port = await new Promise((ok, no) => {
    const t = setTimeout(() => no(new Error("chrome did not report a port")), 20000);
    let buf = "";
    proc.stderr.on("data", (d) => {
      buf += d;
      const m = buf.match(/ws:\/\/127\.0\.0\.1:(\d+)/);
      if (m) { clearTimeout(t); ok(+m[1]); }
    });
  });
  return { proc, port };
}

class Session {
  constructor(ws) { this.ws = ws; this.id = 0; this.waiting = new Map(); this.listeners = []; }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, no) => {
      this.waiting.set(id, { ok, no });
      setTimeout(() => { if (this.waiting.delete(id)) no(new Error(method + " timed out")); }, 30000);
    });
  }
  on(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter((f) => f !== fn); }; }
  handle(msg) {
    if (msg.id && this.waiting.has(msg.id)) {
      const { ok, no } = this.waiting.get(msg.id);
      this.waiting.delete(msg.id);
      msg.error ? no(new Error(msg.error.message)) : ok(msg.result);
      return;
    }
    for (const f of this.listeners) f(msg);
  }
  async eval(expr) {
    const r = await this.send("Runtime.evaluate", {
      expression: `(() => { ${expr} })()`, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "page threw");
    return r.result.value;
  }
  once(method) {
    return new Promise((ok) => {
      const off = this.on((m) => { if (m.method === method) { off(); ok(m.params); } });
    });
  }
}

async function connect(port) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const s = new Session(ws);
  await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
  ws.addEventListener("message", (e) => s.handle(JSON.parse(e.data)));
  await s.send("Page.enable");
  await s.send("Runtime.enable");
  return s;
}

/* ---- measuring ------------------------------------------------------ */

const stats = (ms) => {
  const a = [...ms].sort((x, y) => x - y);
  const p95 = a.length ? a[Math.min(a.length - 1, Math.ceil(0.95 * a.length) - 1)] : NaN;
  return { worst: a.length ? a[a.length - 1] : NaN, p95, over20: a.filter((x) => x > 20).length, n: a.length + 1 };
};
const median = (xs) => {
  const a = xs.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return NaN;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const gapsOf = (ts) => ts.slice(1).map((t, i) => t - ts[i]);

async function mouseClick(s, x, y) {
  await s.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await s.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
  await s.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
}

async function pressEscape(s) {
  const k = { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
  await s.send("Input.dispatchKeyEvent", { type: "keyDown", ...k });
  await s.send("Input.dispatchKeyEvent", { type: "keyUp", ...k });
}

/* The centre of the first matching paper, unless that spot is a link or other
   control (the board's own handler ignores those, and a mailto: must never be
   hit). In that case scan the paper for a point that is plain paper. */
async function clickPoint(s, zone) {
  return s.eval(`
    const el = document.querySelector('[data-zone-stop="${zone}"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const bad = "a[href], button, input, select, textarea, label, [tabindex]";
    const ok = (x, y) => {
      const t = document.elementFromPoint(x, y);
      return t && el.contains(t) && !t.closest(bad) && t.closest('[data-zone-stop]') === el;
    };
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (ok(cx, cy)) return { x: cx, y: cy };
    for (let fy = 0.1; fy < 1; fy += 0.1)
      for (let fx = 0.1; fx < 1; fx += 0.1) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (ok(x, y)) return { x, y };
      }
    return null;`);
}

/* Run `act` (which starts a flight) while recording, wait until WINDOW_MS
   (FLY_MS + 300) after it, and return the frame-to-frame gaps in ms.

   "trace": CDP Tracing with devtools.timeline and the frame category. The
   compositor's PipelineReporter async events carry one begin/end pair per
   frame with a state; the end timestamp of each PRESENTED frame is when it
   reached the screen, so gaps between those are the frame times a viewer
   sees. DrawFrame was tried first and rejected: it is not emitted for every
   compositor-driven frame, and on zoom-out it reported 3 to 18 frames for a
   flight that presented about 45.
   "raf": a requestAnimationFrame delta sampler injected before the action. */
async function measure(s, method, act) {
  if (method === "raf") {
    await s.eval(`
      window.__f = []; window.__run = true;
      const tick = (t) => { window.__f.push(t); if (window.__run) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); return 1`);
    await sleep(150);
    const t0 = await s.eval("return performance.now()");
    await act();
    await sleep(WINDOW_MS);
    const f = await s.eval("window.__run = false; return window.__f");
    return { gaps: gapsOf(f.filter((t) => t >= t0 - 20 && t <= t0 + WINDOW_MS)), frames: f.length };
  }
  const events = [];
  const off = s.on((m) => { if (m.method === "Tracing.dataCollected") events.push(...m.params.value); });
  await s.send("Tracing.start", {
    categories: "devtools.timeline,disabled-by-default-devtools.timeline.frame",
    transferMode: "ReportEvents",
  });
  await sleep(150);
  /* A TimeStamp event puts our own instant on the trace clock, so the window
     opens at the action itself instead of at a guessed clock offset. */
  await s.eval("console.timeStamp('zoom-profile-start'); return 1");
  await act();
  await sleep(WINDOW_MS);
  const done = s.once("Tracing.tracingComplete");
  await s.send("Tracing.end");
  await done;
  off();
  const mark = events.find((e) => e.name === "TimeStamp" && e.args?.data?.message === "zoom-profile-start");
  if (!mark) return { gaps: [], frames: 0 };
  const open = new Map(), frames = [];
  for (const e of events.filter((e) => e.name === "PipelineReporter").sort((a, b) => a.ts - b.ts)) {
    const key = e.id2?.local ?? e.id;
    if (e.ph === "b") open.set(key, e.args?.frame_reporter);
    else if (e.ph === "e" && open.has(key)) {
      const fr = open.get(key); open.delete(key);
      if (/PRESENTED/.test(fr?.state ?? "")) frames.push({ t: e.ts / 1000, host: fr.layer_tree_host_id });
    }
  }
  const lo = mark.ts / 1000, hi = lo + WINDOW_MS;
  const inWin = frames.filter((f) => f.t >= lo && f.t <= hi);
  /* More than one compositor can present (page, browser UI); the page is the
     one that presented the most frames while the board moved. */
  const count = {};
  for (const f of inWin) count[f.host] = (count[f.host] || 0) + 1;
  const host = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  const ts = inWin.filter((f) => String(f.host) === host).map((f) => f.t);
  return { gaps: gapsOf(ts), frames: ts.length };
}

/* ---- main ----------------------------------------------------------- */

async function main() {
  const { srv, port: httpPort } = await serve();
  const base = `http://127.0.0.1:${httpPort}`;
  const profile = await mkdtemp(join(tmpdir(), "zoom-profile-"));
  const { proc, port } = await launch(profile);
  const s = await connect(port);
  /* Welcome panel off and analytics silent before any page script runs. */
  await s.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { localStorage.setItem("ww-welcome-seen", "1"); localStorage.setItem("ww-analytics", "denied"); } catch (e) {}`,
  });

  const rows = [];
  const used = new Set();
  let methodUsed = FORCE_METHOD || "trace";
  try {
    for (let i = 1; i <= RUNS; i++) {
      await s.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
      await s.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
      await s.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
      await s.send("Emulation.setFocusEmulationEnabled", { enabled: true });
      await s.send("Page.bringToFront");
      const loaded = s.once("Page.loadEventFired");
      await s.send("Page.navigate", { url: `${base}/index.html?v=${process.pid}-${i}-${Date.now()}` });
      await loaded;
      await s.eval("return document.fonts.ready.then(() => 1)");
      await sleep(3000);
      const pt = await clickPoint(s, ZONE);
      if (!pt) throw new Error(`no safe click point on [data-zone-stop="${ZONE}"]`);

      const row = {};
      for (const dir of ["in", "out"]) {
        if (dir === "out") await sleep(2000);
        const act = () => (dir === "in" ? mouseClick(s, pt.x, pt.y) : pressEscape(s));
        let r = await measure(s, methodUsed, act);
        /* A trace that caught too few frames did not capture the flight.
           Switch to the rAF sampler and redo this direction from a known
           state. */
        if (methodUsed === "trace" && r.frames < Math.floor(FLY_MS / 40)) {
          console.log(`trace caught only ${r.frames} frames for zoom ${dir}; falling back to the rAF sampler`);
          methodUsed = "raf";
          await sleep(1500);
          if (dir === "in") { await pressEscape(s); await sleep(2500); }  /* now at whole board */
          else { await mouseClick(s, pt.x, pt.y); await sleep(2500); }    /* now zoomed in */
          r = await measure(s, methodUsed, act);
        }
        row[dir] = stats(r.gaps);
        used.add(methodUsed);
      }
      rows.push(row);
      const f = (x) => `worst ${x.worst.toFixed(1)} ms  p95 ${x.p95.toFixed(1)} ms  >20ms ${x.over20}  (${x.n} frames)`;
      console.log(`run ${i}: in  ${f(row.in)}`);
      console.log(`       out ${f(row.out)}`);
    }
  } finally {
    proc.kill(); srv.close();
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }

  const med = (dir, k) => median(rows.map((r) => r[dir][k]));
  console.log("");
  console.log(`zone ${ZONE}, FLY_MS ${FLY_MS}, cpu throttle ${THROTTLE}x, ${SOFTWARE ? "software (--disable-gpu)" : "GPU on"}, method ${[...used].map((m) => (m === "trace" ? "CDP Tracing (presented-frame gaps)" : "requestAnimationFrame deltas")).join(" then fell back to ")}`);
  console.log(`median over ${rows.length} runs:`);
  for (const dir of ["in", "out"]) {
    console.log(`  ${dir.padEnd(3)} worst ${med(dir, "worst").toFixed(1)} ms   p95 ${med(dir, "p95").toFixed(1)} ms   frames over 20 ms ${med(dir, "over20")}`);
  }
}

main().catch((e) => { console.error(e); }).finally(() => process.exit(0));
