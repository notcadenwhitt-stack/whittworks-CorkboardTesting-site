/* Headless-Chrome verification harness for the cork board.
 *
 * WHY THIS EXISTS. The in-app Browser pane returns black screenshots and times
 * out on input whenever its panel is hidden, while page JS keeps executing —
 * which reads as a site bug and is not one. And the shell sandbox cannot reach
 * *.github.io at all (instant exit 000) while github.com works, so staging can
 * never be checked with curl. Everything visual therefore goes through real
 * Chrome over CDP, which is what this file automates.
 *
 * Node 24+ only: it uses the built-in global WebSocket, so there are no
 * dependencies to install and nothing to keep up to date.
 *
 * Usage:
 *   node tools/verify/cdp.mjs stops        eight camera stops, both motion modes
 *   node tools/verify/cdp.mjs hint         scroll-hint size, contrast, fade timing
 *   node tools/verify/cdp.mjs toggle       motion control behavior
 *   node tools/verify/cdp.mjs modes        the six render modes + tripwires
 *   node tools/verify/cdp.mjs shot <n>     screenshot at stop n
 *
 * Point it elsewhere with BASE=https://... (staging), otherwise it serves the
 * working tree itself on a random free port.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const OUT = join(ROOT, "tools", "verify", "out");

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

/* A dev server with NO cache headers, so a ?v= bump is never needed mid-run
   and a stale file can never be what you measured. Path traversal is blocked
   because this serves the real working tree. */
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

async function launch() {
  if (!CHROME) throw new Error("Chrome not found");
  const profile = join(OUT, "profile");
  await mkdir(profile, { recursive: true });
  const proc = spawn(CHROME, [
    "--headless=new", "--remote-debugging-port=0",
    `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
    "--disable-gpu", "--hide-scrollbars", "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  /* Chrome prints the chosen port on stderr; asking for 0 and reading it back
     is what keeps parallel runs from colliding on a fixed port. A stale server
     holding a port is a documented way to end up measuring the wrong build. */
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
  constructor(ws) { this.ws = ws; this.id = 0; this.waiting = new Map(); this.console = []; }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, no) => {
      this.waiting.set(id, { ok, no });
      setTimeout(() => { if (this.waiting.delete(id)) no(new Error(method + " timed out")); }, 30000);
    });
  }
  handle(msg) {
    if (msg.id && this.waiting.has(msg.id)) {
      const { ok, no } = this.waiting.get(msg.id);
      this.waiting.delete(msg.id);
      msg.error ? no(new Error(msg.error.message)) : ok(msg.result);
      return;
    }
    if (msg.method === "Runtime.consoleAPICalled" && /error|warning/.test(msg.params.type))
      this.console.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(" ")}`);
    if (msg.method === "Log.entryAdded" && /error|warning/.test(msg.params.entry.level))
      this.console.push(`${msg.params.entry.level}: ${msg.params.entry.text}`);
  }
  /* Returns the VALUE, and throws on a page-side exception instead of quietly
     resolving to undefined — a silent undefined here once "proved" a camera
     dead that was working fine. */
  async eval(expr) {
    const r = await this.send("Runtime.evaluate", {
      expression: `(() => { ${expr} })()`, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "page threw");
    return r.result.value;
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
  await s.send("Log.enable");
  return s;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function viewport(s, w, h) {
  await s.send("Emulation.setDeviceMetricsOverride", {
    width: w, height: h, deviceScaleFactor: 1, mobile: false,
  });
}

/* mobile:false and then ASSERT innerWidth. Asking CDP for 390 with mobile:true
   silently returns 594 via viewport-meta shrink-to-fit, which invalidates every
   narrow measurement taken after it. */
async function assertWidth(s, want) {
  const got = await s.eval("return innerWidth");
  if (got !== want) throw new Error(`viewport is ${got}, asked for ${want}`);
}

async function motion(s, mode) {
  await s.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: mode }],
  });
}

async function goto(s, url) {
  s.console.length = 0;
  await s.send("Page.navigate", { url });
  await new Promise((ok) => {
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.method === "Page.loadEventFired") { s.ws.removeEventListener("message", h); ok(); }
    };
    s.ws.addEventListener("message", h);
  });
  await s.eval("return document.fonts.ready.then(() => 1)");
  await sleep(600);
}

/* scrollTo plus a sampler, never wheel dispatch: headless wheel events are
   unreliable here — scrollY sometimes never moves, and one such probe once
   reported the camera dead when it was fine. */
async function atFraction(s, f) {
  await s.eval(`window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ${f}); return 1`);
  await sleep(260);
  return s.eval("return { y: scrollY, t: getComputedStyle(document.getElementById('board')).transform }");
}

async function shot(s, name) {
  await mkdir(OUT, { recursive: true });
  const r = await s.send("Page.captureScreenshot", { format: "png" });
  await writeFile(join(OUT, name + ".png"), Buffer.from(r.data, "base64"));
  return join(OUT, name + ".png");
}

export async function run(fn) {
  const { srv, port: httpPort } = await serve();
  const base = process.env.BASE || `http://127.0.0.1:${httpPort}`;
  const { proc, port } = await launch();
  const s = await connect(port);
  try { return await fn({ s, base, viewport, assertWidth, motion, goto, atFraction, shot, sleep }); }
  finally { proc.kill(); srv.close(); }
}

/* ---- checks -------------------------------------------------------- */

const CHECKS = {
  /* The whole diagnosis in one command: under no-preference the camera must
     produce DIFFERENT transforms between two stops; under reduce it must
     produce the SAME transform across the flat part of a segment. */
  async stops({ s, base, viewport, motion, goto, atFraction }) {
    await viewport(s, 1440, 900);
    for (const mode of ["no-preference", "reduce"]) {
      await motion(s, mode);
      await goto(s, base + "/index.html");
      const seen = [];
      for (let i = 0; i <= 14; i++) seen.push((await atFraction(s, i / 14)).t);
      const distinct = new Set(seen).size;
      console.log(`${mode}: ${distinct} distinct transforms across 15 samples ` +
        `(${mode === "reduce" ? "expect ~8, one per stop" : "expect ~15, continuous"})`);
      if (s.console.length) console.log("  console:", s.console);
    }
  },

  async hint({ s, base, viewport, motion, goto, atFraction }) {
    await viewport(s, 1440, 900);
    await motion(s, "no-preference");
    await goto(s, base + "/index.html");
    const style = await s.eval(`
      const h = document.querySelector('.scroll-hint');
      if (!h) return { missing: true };
      const c = getComputedStyle(h);
      return { size: c.fontSize, color: c.color, bg: c.backgroundColor,
               aria: h.getAttribute('aria-hidden'), text: h.textContent.trim() };`);
    console.log("hint:", JSON.stringify(style));
    /* Measure the WRAPPER. `.faded` lives on .board-chrome, and a child's
       computed opacity is always 1 regardless of what its parent's group
       opacity does to it on screen — reading .scroll-hint here reports "never
       fades" for a cluster that fades correctly. */
    for (const f of [0, 0.05, 0.1, 0.14, 0.2, 0.3]) {
      await atFraction(s, f);
      const o = await s.eval("return getComputedStyle(document.querySelector('.board-chrome')).opacity");
      console.log(`  fraction ${f}: chrome opacity ${o}`);
    }
  },

  async toggle({ s, base, viewport, motion, goto, atFraction }) {
    await viewport(s, 1440, 900);
    for (const mode of ["reduce", "no-preference"]) {
      await motion(s, mode);
      await goto(s, base + "/index.html");
      const before = await s.eval(`
        const b = document.querySelector('.motion-toggle');
        if (!b) return { missing: true };
        return { pressed: b.getAttribute('aria-pressed'), name: b.textContent.trim(),
                 tag: b.tagName, focusable: b.tabIndex >= 0 };`);
      console.log(`${mode} toggle:`, JSON.stringify(before));
      if (before.missing) continue;
      const a = (await atFraction(s, 0.07)).t;
      await s.eval("document.querySelector('.motion-toggle').click(); return 1");
      await sleep(200);
      const b = (await atFraction(s, 0.07)).t;
      console.log(`  transform changed on toggle: ${a !== b}`);
      const after = await s.eval("return document.querySelector('.motion-toggle').getAttribute('aria-pressed')");
      console.log(`  aria-pressed ${before.pressed} -> ${after}`);
    }
  },

  async modes({ s, base, viewport, assertWidth, motion, goto }) {
    await motion(s, "no-preference");
    const out = {};
    await viewport(s, 1440, 900); await assertWidth(s, 1440);
    await goto(s, base + "/index.html");
    out.board = await s.eval("return document.body.innerText.length");
    out.boardLive = await s.eval("return document.documentElement.classList.contains('board-live')");
    await viewport(s, 390, 844); await assertWidth(s, 390);
    await goto(s, base + "/index.html");
    out.editorial = await s.eval("return document.body.innerText.length");
    await s.eval("const p = document.querySelector('.board-peek'); if (p) p.click(); return 1");
    await sleep(400);
    out.reading = await s.eval("return document.body.innerText.length");
    await s.send("Emulation.setScriptExecutionDisabled", { value: true });
    await viewport(s, 1440, 900);
    await goto(s, base + "/index.html");
    out.noJsWide = await s.eval("return document.body.innerText.length").catch(() => "n/a");
    await viewport(s, 390, 844);
    await goto(s, base + "/index.html");
    out.noJsNarrow = await s.eval("return document.body.innerText.length").catch(() => "n/a");
    await s.send("Emulation.setScriptExecutionDisabled", { value: false });
    console.log("tripwires:", JSON.stringify(out, null, 2));
    if (s.console.length) console.log("console:", s.console);
  },

  async shot({ s, base, viewport, motion, goto, atFraction, shot }, n = "0") {
    await viewport(s, 1440, 900);
    await motion(s, "no-preference");
    await goto(s, base + "/index.html");
    await atFraction(s, Number(n) / 7);
    console.log(await shot(s, "stop-" + n));
  },
};

const [, , name, ...rest] = process.argv;
if (name) {
  if (!CHECKS[name]) { console.error("unknown check:", name, "\ntry:", Object.keys(CHECKS).join(", ")); process.exit(1); }
  run((ctx) => CHECKS[name](ctx, ...rest)).catch((e) => { console.error(e); process.exit(1); });
}
