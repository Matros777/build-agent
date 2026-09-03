import { defineTool } from "eve/tools";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export default defineTool({
  description: "Save conversation history to PostgreSQL database.",
  inputSchema: z.object({
    userId: z.string().describe("User identifier"),
    messages: z.string().describe("JSON string of conversation messages"),
  }),
  async execute({ userId, messages }) {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        messages JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const result = await sql`
      INSERT INTO conversations (user_id, messages)
      VALUES (${userId}, ${messages}::jsonb)
      RETURNING id, created_at
    `;

    return {
      success: true,
      id: result[0].id,
      createdAt: result[0].created_at,
    };
  },
});
