import { defineTool } from "eve/tools";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

const sql = neon(process.env.DATABASE_URL!);

export default defineTool({
  description: "Load conversation history from PostgreSQL database. Use this to remember previous discussions.",
  inputSchema: z.object({
    userId: z.string().describe("User identifier"),
    limit: z.number().optional().describe("Number of recent conversations to load (default: 5)"),
  }),
  async execute({ userId, limit = 5 }) {
    const result = await sql`
      SELECT id, messages, created_at
      FROM conversations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    if (result.length === 0) {
      return { found: false, conversations: [] };
    }

    return {
      found: true,
      conversations: result.map(row => ({
        id: row.id,
        messages: row.messages,
        createdAt: row.created_at,
      })),
    };
  },
});
