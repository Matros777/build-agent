import { defineTool } from "eve/tools";
import { z } from "zod";
import { runBrowser } from "../../lib/browser";

export default defineTool({
  description: "Read the current page in the headless browser. Returns title, URL, and visible text content.",
  inputSchema: z.object({
    url: z.string().optional().describe("Optional: URL to open first, then read"),
  }),
  async execute({ url }, ctx) {
    if (url) {
      return runBrowser(ctx, "open", { url });
    }
    return runBrowser(ctx, "snapshot", {});
  },
});