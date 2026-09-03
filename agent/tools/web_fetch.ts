import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Fetch the content of a web page by URL and return its text. Use this to read news articles, documentation, or any web page.",
  inputSchema: z.object({
    url: z.string().describe("Full URL to fetch, e.g. 'https://example.com/page'"),
    maxLength: z.number().optional().describe("Max characters to return (default: 5000)"),
  }),
  async execute({ url, maxLength = 5000 }) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BuildAgent/1.0)",
          "Accept": "text/html,text/plain,application/json",
        },
      });

      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const contentType = res.headers.get("content-type") || "";
      let body = await res.text();

      // JSON response -> pretty print
      if (contentType.includes("application/json")) {
        try {
          body = JSON.stringify(JSON.parse(body), null, 2);
        } catch { /* keep raw */ }
      }

      // HTML -> strip tags
      if (contentType.includes("text/html")) {
        body = body
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      if (body.length > maxLength) {
        body = body.slice(0, maxLength) + "\n...[truncated]";
      }

      return { success: true, url, content: body };
    } catch (err: any) {
      return { success: false, error: `Fetch failed: ${err?.message || err}` };
    }
  },
});