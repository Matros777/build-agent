let browserReady = false;

async function ensureBrowser(sandbox: any) {
  if (browserReady) return;
  // Install playwright once per sandbox session (cached in template)
  const check = await sandbox.run({
    command: "node -e \"require('playwright');console.log('PW_OK')\"",
    timeoutMs: 20000,
  });
  if ((check.stdout || "").includes("PW_OK")) {
    browserReady = true;
    return;
  }
  const install = await sandbox.run({
    command: "npm install playwright >/dev/null 2>&1 && npx playwright install chromium >/dev/null 2>&1 && echo INSTALLED",
    timeoutMs: 300000,
  });
  browserReady = (install.stdout || "").includes("INSTALLED");
  if (!browserReady) {
    throw new Error("Failed to install headless browser in sandbox: " + (install.stderr || install.stdout || "").slice(0, 300));
  }
}

function buildScript(action: string, args: Record<string, string | undefined>) {
  return `
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  try {
    const action = ${JSON.stringify(action)};
    if (action === "open") {
      await page.goto(${JSON.stringify(args.url || "about:blank")}, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1200);
    } else if (action === "click") {
      await page.click(${JSON.stringify(args.selector || "body")});
      await page.waitForTimeout(800);
    } else if (action === "type") {
      await page.click(${JSON.stringify(args.selector || "body")});
      await page.keyboard.type(${JSON.stringify(args.text || "")});
      await page.waitForTimeout(300);
    } else if (action === "back") {
      await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(800);
    }
    const title = await page.title();
    const url = page.url();
    const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 6000);
    console.log("RESULT_JSON:" + JSON.stringify({ title, url, text: bodyText }));
  } catch (e) {
    console.log("RESULT_ERROR:" + String((e as Error).message || e));
  } finally {
    await browser.close();
  }
})();
`;
}

export async function runBrowser(
  ctx: { getSandbox: () => Promise<any> },
  action: string,
  args: Record<string, string | undefined> = {},
) {
  const sandbox = await ctx.getSandbox();
  await ensureBrowser(sandbox);
  const script = buildScript(action, args);
  await sandbox.writeTextFile({ path: "/tmp/browser.cjs", content: script });
  const result = await sandbox.run({
    command: "node /tmp/browser.cjs",
    timeoutMs: 90000,
  });

  const stdout = result.stdout || "";
  const jsonMatch = stdout.match(/RESULT_JSON:(.+)$/m);
  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[1]);
    return { success: true, ...data };
  }
  const errMatch = stdout.match(/RESULT_ERROR:(.+)$/m);
  return {
    success: false,
    error: errMatch ? errMatch[1].trim() : "Unknown browser error:\n" + stdout.slice(0, 500),
  };
}