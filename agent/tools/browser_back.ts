import { defineTool } from "eve/tools";
import { z } from "zod";
import { runBrowser } from "../../lib/browser";

export default defineTool({
  description: "Go back to the previous page in the headless browser and return the page state.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    return runBrowser(ctx, "back", {});
  },
});