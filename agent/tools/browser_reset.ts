import { defineTool } from "eve/tools";
import { z } from "zod";
import { resetBrowserServer, waitForBrowserServer } from "../../lib/cdp";

export default defineTool({
  description: "Reset the headless browser sandbox. Deletes and recreates it with a fresh Playwright install. Use this when the browser server is broken or not responding.",
  inputSchema: z.object({}),
  async execute() {
    try {
      await resetBrowserServer();
      // Wait for the fresh sandbox to provision (up to 5 min)
      const url = await waitForBrowserServer(300_000);
      return {
        success: true,
        message: "Browser sandbox was reset and is ready: " + url,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Browser reset failed: ${err?.message || err}`,
      };
    }
  },
});