import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Fetch the latest cryptocurrency news headlines from CoinTelegraph RSS. Returns title, link, and summary.",
  inputSchema: z.object({
    maxResults: z.number().optional().describe("Max news items to return (default: 5, max: 10)"),
  }),
  async execute({ maxResults = 5 }) {
    try {
      const res = await fetch("https://cointelegraph.com/rss", {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BuildAgent/1.0)",
        },
      });

      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const xml = await res.text();

      // Parse RSS items
      const items: { title: string; link: string; description: string }[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let itemMatch: RegExpExecArray | null;

      while ((itemMatch = itemRegex.exec(xml)) !== null && items.length < maxResults) {
        const item = itemMatch[1];
        const getTag = (tag: string) => {
          const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
          return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
        };
        items.push({
          title: getTag("title"),
          link: getTag("link"),
          description: getTag("description").replace(/<[^>]+>/g, "").slice(0, 200),
        });
      }

      if (items.length === 0) {
        return { success: true, news: [], message: "No news found" };
      }

      return { success: true, news: items };
    } catch (err: any) {
      return { success: false, error: `Failed to fetch news: ${err?.message || err}` };
    }
  },
});