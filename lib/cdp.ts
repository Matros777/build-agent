import { Sandbox } from "@vercel/sandbox";

const SANDBOX_NAME = "browser-server";
const SERVER_PORT = 8080;
let cachedUrl: string | null = null;

const SERVER_SCRIPT = `
import { createServer } from "node:http";
import { chromium } from "playwright";
const PORT = Number(process.env.PORT || 8080);
const HEADERS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const action = url.pathname.slice(1) || "status";
    if (action === "ping" || action === "status") {
      res.writeHead(200, HEADERS);
      res.end(JSON.stringify({ ok: true, status: "ready", ts: Date.now() }));
      return;
    }
    const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
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
server.listen(PORT, () => console.log("[browser-server] ready on :" + PORT));
`;

const BOOTSTRAP = `
npm init -y >/dev/null 2>&1
npm install playwright >/dev/null 2>&1
npx playwright install chromium >/dev/null 2>&1 || true
cat > /workspace/browser-server.mjs << 'SRVEOF'
${SERVER_SCRIPT}
SRVEOF
(node /workspace/browser-server.mjs --port ${SERVER_PORT} > /tmp/browser-server.log 2>&1 &) || true
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
      await sbx.runCommand({ cmd: "bash", args: ["-lc", BOOTSTRAP], detached: true });
    },
    onResume: async (sbx) => {
      await sbx.runCommand({
        cmd: "bash",
        args: ["-lc", `(node /workspace/browser-server.mjs --port ${SERVER_PORT} > /tmp/browser-server.log 2>&1 &) || true`],
        detached: true,
      });
    },
  });

  cachedUrl = sandbox.domain(SERVER_PORT);
  return cachedUrl;
}

// Wait until the browser server answers /ping with JSON, or timeout.
export async function waitForBrowserServer(timeoutMs = 180_000): Promise<string> {
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
        if (data?.ok) return base;
      }
      lastError = `HTTP ${res.status}: ${body.slice(0, 120)}`;
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
    await sleep(5000);
  }

  throw new Error(`Browser server not ready after ${timeoutMs}ms: ${lastError}`);
}

export async function browserRequest(
  action: string,
  params: Record<string, string | undefined> = {},
): Promise<any> {
  // First call may need to wait for provision + chromium install.
  const base = await waitForBrowserServer();
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) query.set(k, v);
  }
  const qs = query.toString();

  // Retry a few times (provisioning can take a while).
  let lastError: string | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
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