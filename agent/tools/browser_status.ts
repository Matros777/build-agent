import { defineTool } from "eve/tools";
import { z } from "zod";
import { getBrowserServerUrl, waitForBrowserServer } from "../../lib/cdp";

export default defineTool({
  description: "Check the headless browser server status. Returns whether it's ready, the sandbox URL, and the server log tail. Use this before/between browser actions to diagnose problems.",
  inputSchema: z.object({
    wait: z.boolean().optional().describe("If true, wait up to 30s for the server to become ready (default: false)."),
  }),
  async execute({ wait = false }) {
    try {
      const base = await getBrowserServerUrl();
      let ready = false;
      let log = "";

      if (wait) {
        try {
          await waitForBrowserServer(30_000);
          ready = true;
        } catch {
          ready = false;
        }
      } else {
        try {
          const ping = await fetch(`${base}/ping`, { signal: AbortSignal.timeout(10000) });
          const data = await ping.json();
          ready = !!data?.ready;
        } catch { /* not ready */ }
      }

      try {
        const logRes = await fetch(`${base}/log`, { signal: AbortSignal.timeout(10000) });
        const lj = await logRes.json();
        log = (lj?.log || "").slice(-2000);
      } catch { /* no log */ }

      return {
        success: true,
        ready,
        url: base,
        log: log.slice(0, 2000),
      };
    } catch (err: any) {
      return {
        success: false,
        ready: false,
        error: `Cannot reach browser server: ${err?.message || err}`,
      };
    }
  },
});