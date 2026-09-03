import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Fetch the content of an X (Twitter) post by URL. Returns the author, text, likes, and retweets.",
  inputSchema: z.object({
    url: z.string().describe("Full X/Twitter post URL, e.g. 'https://x.com/user/status/123456789'"),
  }),
  async execute({ url }) {
    try {
      // Convert x.com / twitter.com URL to vxtwitter API format
      const normalized = url.replace(/twitter\.com/, "x.com");
      const tweetIdMatch = normalized.match(/status\/(\d+)/);
      if (!tweetIdMatch) {
        return { success: false, error: "Could not extract tweet ID from URL" };
      }

      const tweetId = tweetIdMatch[1];
      const apiUrl = `https://api.fxtwitter.com/status/${tweetId}`;
      const res = await fetch(apiUrl, {
        headers: { "User-Agent": "BuildAgent/1.0" },
      });

      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const data = await res.json();
      const tweet = data?.tweet;

      if (!tweet) {
        return { success: false, error: "Tweet not found or unavailable" };
      }

      return {
        success: true,
        author: tweet.author?.name,
        handle: tweet.author?.screen_name,
        text: tweet.text,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        createdAt: tweet.created_at,
        url: tweet.url,
      };
    } catch (err: any) {
      return { success: false, error: `Failed to fetch tweet: ${err?.message || err}` };
    }
  },
});