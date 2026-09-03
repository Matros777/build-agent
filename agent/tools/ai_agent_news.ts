import { defineTool } from "eve/tools";
import { z } from "zod";

const DEFAULT_QUERIES = [
  "AI agents",
  "x402 protocol",
  "AI crypto agents",
  "autonomous AI agents",
];

export default defineTool({
  description: "Get the latest news about AI agents, the X402 protocol, AI crypto, and autonomous agents. Sources: Google News + Hacker News/Algolia. No API key needed.",
  inputSchema: z.object({
    query: z.string().optional().describe("Optional custom search query. If omitted, searches default topics (AI agents, X402, AI crypto)."),
    maxResults: z.number().optional().describe("Max results to return (default: 8, max: 15)"),
  }),
  async execute({ query, maxResults = 8 }) {
    try {
      const queries = query ? [query] : DEFAULT_QUERIES;
      const items: { title: string; link: string; source: string; publishedAt: string; snippet: string }[] = [];

      // 1) Google News RSS for each query
      for (const q of queries) {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; BuildAgent/1.0)" },
        });
        if (res.ok) {
          const xml = await res.text();
          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let match: RegExpExecArray | null;
          while ((match = itemRegex.exec(xml)) !== null && items.length < maxResults) {
            const item = match[1];
            const getTag = (tag: string) => {
              const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
              return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
            };
            items.push({
              title: getTag("title"),
              link: getTag("link"),
              source: getTag("source"),
              publishedAt: getTag("pubDate"),
              snippet: getTag("description").replace(/<[^>]+>/g, "").slice(0, 200),
            });
          }
        }
        await new Promise((r) => setTimeout(r, 300)); // rate-limit politeness
      }

      // 2) Hacker News (Algolia) for AI agent topics
      const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent("AI agent")}&tags=story&hitsPerPage=5`;
      const hnRes = await fetch(hnUrl, { headers: { "User-Agent": "BuildAgent/1.0" } });
      if (hnRes.ok) {
        const hn = await hnRes.json();
        for (const hit of hn?.hits || []) {
          if (items.length >= maxResults) break;
          items.push({
            title: hit.title || (hit.story_title || ""),
            link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: "Hacker News",
            publishedAt: hit.created_at,
            snippet: hit.points ? `▲ ${hit.points} points, ${hit.num_comments || 0} comments` : "",
          });
        }
      }

      if (items.length === 0) {
        return { success: true, news: [], message: "No news found" };
      }

      return {
        success: true,
        searched: queries,
        total: items.length,
        news: items.slice(0, maxResults),
      };
    } catch (err: any) {
      return { success: false, error: `Failed to fetch AI/news: ${err?.message || err}` };
    }
  },
});