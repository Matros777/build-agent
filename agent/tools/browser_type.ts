import { defineTool } from "eve/tools";
import { z } from "zod";
import { runBrowser } from "../../lib/browser";

export default defineTool({
  description: "Type text into an input field on the current page using a CSS selector.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector of the input field, e.g. 'input[name=\"q\"]'"),
    text: z.string().describe("Text to type"),
  }),
  async execute({ selector, text }, ctx) {
    return runBrowser(ctx, "type", { selector, text });
  },
});