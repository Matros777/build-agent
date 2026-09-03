import { defineTool } from "eve/tools";
import { z } from "zod";
import { runBrowser } from "../../lib/browser";

export default defineTool({
  description: "Click an element on the current page in the headless browser using a CSS selector.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector of the element to click, e.g. 'button.submit' or 'a[href=\"/about\"]'"),
    url: z.string().optional().describe("Optional: URL to navigate to before clicking"),
  }),
  async execute({ selector, url }, ctx) {
    if (url) {
      await runBrowser(ctx, "open", { url });
    }
    return runBrowser(ctx, "click", { selector });
  },
});