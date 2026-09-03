import { defineTool } from "eve/tools";
import { z } from "zod";
import { runBrowser } from "../../lib/browser";

export default defineTool({
  description: "Open a URL in a headless browser and return the page title, URL, and text content. Use this to browse the web and read pages.",
  inputSchema: z.object({
    url: z.string().describe("The full URL to open, e.g. 'https://example.com'"),
  }),
  async execute({ url }, ctx) {
    return runBrowser(ctx, "open", { url });
  },
});