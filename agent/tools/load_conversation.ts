import { defineTool } from "eve/tools";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export default defineTool({
  description: "Load the user's conversation history from the database. Call this FIRST at the start of every session to remember previous discussions.",
  inputSchema: z.object({
    userId: z.string().describe("The user's identifier (e.g. 'boss'). If the user identifies themselves as БОСС, use 'boss'."),
  }),
  async execute({ userId }) {
    const sql = getSql();

    // Create table if not exists so we never fail on first ever call
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        messages JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const result = await sql`
      SELECT id, messages, created_at
      FROM conversations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    if (result.length === 0) {
      return {
        found: false,
        message: `No previous conversations found for user '${userId}'. This is their first visit.`,
        conversations: [],
      };
    }

    return {
      found: true,
      message: `Found ${result.length} previous conversation(s) for user '${userId}'.`,
      conversations: result.map(row => ({
        id: row.id,
        messages: row.messages,
        createdAt: row.created_at,
      })),
    };
  },
});