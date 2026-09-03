import { Sandbox } from "@vercel/sandbox";

const SANDBOX_NAME = "browser-server";
const SERVER_PORT = 8080;
let cachedUrl: string | null = null;

// Lazy server: listens immediately; imports playwright on demand and caches
// the result. /ping reports ready once the package + chromium exist.
const SERVER_SCRIPT = `
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
let pw = null; // { chromium } | null
let pwError = null;
const HEADERS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
async function ensurePw() {
  if (pw) return pw;
  if (pwError === "installing") return null;
  pwError = "installing";
  try {
    const mod = await import("playwright");
    pw = { chromium: mod.chromium };
    pwError = null;
  } catch (e) {
    pwError = "error:" + String((e && e.message) || e).slice(0, 140);
  }
  return pw;
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const action = url.pathname.slice(1) || "status";
    if (action === "ping" || action === "status") {
      await ensurePw();
      res.writeHead(200, HEADERS);
      res.end(JSON.stringify({ ok: true, ready: !!pw, status: pw ? "ready" : (pwError || "installing"), ts: Date.now() }));
      return;
    }
    if (action === "log") {
      let log = "";
      try { log = await readFile("/tmp/browser-server.log", "utf8"); } catch {}
      res.writeHead(200, HEADERS);
      res.end(JSON.stringify({ log: String(log).slice(-4000) }));
      return;
    }
    await ensurePw();
    if (!pw) {
      res.writeHead(200, HEADERS);
      res.end(JSON.stringify({ success: false, error: "Playwright not ready: " + (pwError || "installing") }));
      return;
    }
    const browser = await pw.chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
    try {
      const page = await browser.newPage();
      let result = {};
      if (action === "open") {
        const target = url.searchParams.get("url") || "about:blank";
        await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(1200);
        result = await snap(page);
      } else if (action === "click") {
        await page.click(url.searchParams.get("selector") || "body");
        await page.waitForTimeout(800);
        result = await snap(page);
      } else if (action === "type") {
        await page.click(url.searchParams.get("selector") || "body");
        await page.keyboard.type(url.searchParams.get("text") || "");
        await page.waitForTimeout(300);
        result = await snap(page);
      } else if (action === "back") {
        await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
        await page.waitForTimeout(800);
        result = await snap(page);
      } else if (action === "snapshot") {
        result = await snap(page);
      } else {
        res.writeHead(400, HEADERS);
        res.end(JSON.stringify({ success: false, error: "Unknown action: " + action }));
        return;
      }
      res.writeHead(200, HEADERS);
      res.end(JSON.stringify({ success: true, ...result }));
    } finally {
      await browser.close();
    }
  } catch (err) {
    res.writeHead(500, HEADERS);
    res.end(JSON.stringify({ success: false, error: String((err && err.message) || err) }));
  }
});
async function snap(page) {
  const title = await page.title();
  const url = page.url();
  const text = (await page.locator("body").innerText().catch(() => "")).slice(0, 8000);
  return { title, url, text };
}
server.listen(PORT, () => console.log("[browser-server] listening :" + PORT));
`;

const SETUP = `
cd /workspace
npm init -y >/dev/null 2>&1
(npm install playwright >/tmp/npm.log 2>&1 &)
(npx playwright install chromium >/tmp/pw-install.log 2>&1 &)
cat > /workspace/browser-server.mjs << 'SRVEOF'
${SERVER_SCRIPT}
SRVEOF
nohup node /workspace/browser-server.mjs > /tmp/browser-server.log 2>&1 &
echo "SETUP_STARTED"
`;

const RESUME = `
nohup node /workspace/browser-server.mjs > /tmp/browser-server.log 2>&1 &
`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getBrowserServerUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl;

  const sandbox = await Sandbox.getOrCreate({
    name: SANDBOX_NAME,
    ports: [SERVER_PORT],
    timeout: 30 * 60 * 1000,
    persistent: true,
    onCreate: async (sbx) => {
      await sbx.runCommand({ cmd: "bash", args: ["-lc", SETUP], detached: true });
    },
    onResume: async (sbx) => {
      await sbx.runCommand({ cmd: "bash", args: ["-lc", RESUME], detached: true });
    },
  });

  cachedUrl = sandbox.domain(SERVER_PORT);
  return cachedUrl;
}

export async function waitForBrowserServer(timeoutMs = 300_000): Promise<string> {
  try {
    return await pingUntilReady(timeoutMs);
  } catch (err) {
    // Auto-repair: the existing sandbox is broken/misconfigured.
    // Delete it and bootstrap a fresh one.
    await resetBrowserServer();
    cachedUrl = null;
    return await pingUntilReady(timeoutMs);
  }
}

async function pingUntilReady(timeoutMs: number): Promise<string> {
  const base = await getBrowserServerUrl();
  const deadline = Date.now() + timeoutMs;
  let lastError = "sandbox still initializing";

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/ping`, { signal: AbortSignal.timeout(10000) });
      const ct = res.headers.get("content-type") || "";
      const body = await res.text();
      if (res.ok && ct.includes("application/json")) {
        const data = JSON.parse(body);
        if (data?.ready) return base;
        lastError = `status: ${data?.status || "unknown"}`;
      } else {
        lastError = `HTTP ${res.status}: ${body.slice(0, 120)}`;
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
    await sleep(5000);
  }

  let logTail = "";
  try {
    const logRes = await fetch(`${base}/log`, { signal: AbortSignal.timeout(10000) });
    const lj = await logRes.json();
    logTail = "\nserver log: " + (lj?.log || "").slice(-1500);
  } catch { /* ignore */ }

  throw new Error(`Browser server not ready after ${timeoutMs}ms: ${lastError}${logTail}`);
}

// Delete and recreate the browser sandbox from scratch.
export async function resetBrowserServer(): Promise<void> {
  try {
    const sandbox = await Sandbox.get({ name: SANDBOX_NAME, resume: false });
    if (sandbox) {
      await sandbox.delete();
    }
  } catch { /* sandbox may not exist — fine */ }
  cachedUrl = null;
}

export async function browserRequest(
  action: string,
  params: Record<string, string | undefined> = {},
): Promise<any> {
  const base = await waitForBrowserServer();
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) query.set(k, v);
  }
  const qs = query.toString();

  let lastError: string | undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(`${base}/${action}${qs ? `?${qs}` : ""}`, {
        signal: AbortSignal.timeout(90000),
      });
      const ct = res.headers.get("content-type") || "";
      const body = await res.text();
      if (ct.includes("application/json")) {
        return JSON.parse(body);
      }
      lastError = `HTTP ${res.status}: ${body.slice(0, 160)}`;
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
    await sleep(4000);
  }

  return { success: false, error: `CDP server request failed: ${lastError}` };
}