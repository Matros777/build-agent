import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Search the web and return a list of top results (title, link, snippet). Use this to find recent information, news, or answer current questions.",
  inputSchema: z.object({
    query: z.string().describe("Search query, e.g. 'AI agents news'"),
    maxResults: z.number().optional().describe("Max results to return (default: 5, max: 10)"),
  }),
  async execute({ query, maxResults = 5 }) {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BuildAgent/1.0)",
          "Accept": "text/html",
        },
      });

      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const html = await res.text();

      // Parse DuckDuckGo html results
      const results: { title: string; link: string; snippet: string }[] = [];
      const regex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(html)) !== null && results.length < maxResults) {
        results.push({
          title: match[2].replace(/<[^>]+>/g, "").trim(),
          link: match[1].replace(/.*uddg=([^&]+).*/, "$1"),
          snippet: match[3].replace(/<[^>]+>/g, "").trim(),
        });
      }

      if (results.length === 0) {
        return { success: true, query, results: [], message: "No results found" };
      }

      return { success: true, query, results };
    } catch (err: any) {
      return { success: false, error: `Search failed: ${err?.message || err}` };
    }
  },
});