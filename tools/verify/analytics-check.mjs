/* Node 24, no dependencies. All PostHog traffic is fulfilled locally. */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/* SITE_ROOT points the harness at a built copy (tools/release/build.py)
   instead of the working tree. */
const ROOT = process.env.SITE_ROOT ? resolve(process.env.SITE_ROOT) : resolve(fileURLToPath(new URL("../..", import.meta.url)));
const OUT = "/tmp/ww-analytics-check-" + process.pid;

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
  return new Promise((ok, no) => {
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
    srv.on("error", no);
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
    if (this.onEvent) this.onEvent(msg);
    if (msg.method === "Runtime.consoleAPICalled" && /error|warning/.test(msg.params.type))
      this.console.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(" ")}`);
    if (msg.method === "Log.entryAdded" && /error|warning/.test(msg.params.entry.level))
      this.console.push(`${msg.params.entry.level}: ${msg.params.entry.text}`);
  }
  /* Returns the VALUE, and throws on a page-side exception instead of quietly
     resolving to undefined ; a silent undefined here once "proved" a camera
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

async function main() {
  const { srv, port: httpPort } = await serve();
  const { proc, port } = await launch();
  const s = await connect(port);
  const requests = [];
  let seed;
  let failures = 0;
  const base = `http://127.0.0.1:${httpPort}`;
  s.onEvent = (msg) => {
    if (msg.method !== "Fetch.requestPaused") return;
    const { requestId, request } = msg.params;
    requests.push({ url: request.url, body: request.postData || "", method: request.method });
    s.send("Fetch.fulfillRequest", {
      requestId, responseCode: 200,
      responseHeaders: [
        { name: "Content-Type", value: "application/json" },
        { name: "Access-Control-Allow-Origin", value: base },
        { name: "Access-Control-Allow-Credentials", value: "true" },
        { name: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
        { name: "Access-Control-Allow-Headers", value: "content-type" },
      ], body: Buffer.from('{"status":1}').toString("base64"),
    }).catch((e) => { console.error(e.message); failures++; });
  };
  function events() {
    return requests.filter((r) => r.method === "POST").flatMap((r) => {
      try { return JSON.parse(r.body).batch || []; } catch { return []; }
    });
  }
  function check(name, pass, detail = "") {
    console.log(`${pass ? "PASS" : "FAIL"} ${name}${pass || !detail ? "" : ": " + detail}`);
    if (!pass) failures++;
  }
  async function load(width, choice, testKey = true) {
    await s.send("Page.navigate", { url: "about:blank" });
    await sleep(250);
    if (seed) await s.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: seed });
    const result = await s.send("Page.addScriptToEvaluateOnNewDocument", { source: `
      ${testKey ? 'window.__WW_PH_TEST_KEY = "phc_test";' : ""}
      try {
        localStorage.clear(); sessionStorage.clear();
        ${choice ? `localStorage.setItem("ww-analytics", ${JSON.stringify(choice)});` : ""}
      } catch (e) {}
    ` });
    seed = result.identifier;
    requests.length = 0;
    await s.send("Emulation.setDeviceMetricsOverride", {
      width, height: width === 390 ? 844 : 900, deviceScaleFactor: 1, mobile: false,
    });
    await s.send("Page.navigate", { url: base + "/index.html?private=never-send" });
    await sleep(1000);
    if (await s.eval("return innerWidth") !== width) throw new Error("Wrong viewport");
  }
  try {
    await s.send("Fetch.enable", { patterns: [{ urlPattern: "*posthog.com*" }] });
    for (const width of [390, 1440]) {
      for (const choice of [null, "denied"]) {
        await load(width, choice);
        await sleep(8000);
        check(`${width} ${choice || "no consent"}: zero PostHog requests`, requests.length === 0);
        if (width === 1440 && !choice) {
          const focus = await s.eval(`
            document.querySelector('.welcome-close').click();
            window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * (6 / 7));
            return new Promise(function (resolve) { setTimeout(function () {
              document.getElementById('board-form').requestSubmit();
              resolve(document.activeElement.id);
            }, 500); });
          `);
          check("board empty submit focuses Name", focus === "cf-name", focus);
        }
      }
    }
    await load(1440, null);
    await s.eval('document.querySelector(\'[data-consent="granted"]\').click();');
    await sleep(1000);
    check("grant sends pageview", events().some((e) => e.event === "$pageview"));
    await s.eval(`
      document.querySelector('.welcome-close').click();
      document.querySelector('[data-zone-stop]').click();
    `);
    await sleep(5500);
    check("board click sends zone_click", events().some((e) => e.event === "zone_click"));
    check("URLs omit query strings", events().every((e) => !e.properties.$current_url.includes("?")));
    await s.send("Page.navigate", { url: base + "/privacy.html" });
    await sleep(1500);
    check("pagehide sends pageleave", events().some((e) => e.event === "$pageleave"));
    check("pagehide sends web vitals", events().some((e) => e.event === "$web_vitals" &&
      typeof e.properties.$web_vitals_FCP_value === "number"));

    await load(1440, "granted");
    await sleep(500);
    check("stored grant sends pageview", events().some((e) => e.event === "$pageview"));
    await s.eval('document.querySelector(\'[data-consent="denied"]\').click();');
    const gone = await s.eval(`try {
      return !localStorage.getItem("ww-ph-id") && !sessionStorage.getItem("ww-ph-session");
    } catch (e) { return false; }`);
    const count = requests.length;
    await s.eval(`
      document.querySelector('[data-zone-stop]').click();
      window.dispatchEvent(new CustomEvent('ww-form', {detail:{form:'test',ok:true}}));
    `);
    await sleep(8000);
    await s.send("Page.navigate", { url: base + "/privacy.html" });
    await sleep(1000);
    check("deny removes identity and session", gone);
    check("deny stops all further requests", requests.length === count);
    /* The shipped key is real now, so the old "empty key stays inert" case
       is gone. Fetch interception above still keeps every request local. */
  } finally {
    s.ws.close();
    proc.kill();
    srv.close();
    await import("node:fs/promises").then(({ rm }) => rm(OUT, { recursive: true, force: true })).catch(() => {});
  }
  if (failures) process.exitCode = 1;
}
main().catch((error) => { console.error("FAIL", error); process.exitCode = 1; });
