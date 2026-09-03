import { defineTool } from "eve/tools";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

const sql = neon(process.env.DATABASE_URL!);

export default defineTool({
  description: "Save conversation history to PostgreSQL database. Use this to remember what was discussed.",
  inputSchema: z.object({
    userId: z.string().describe("User identifier"),
    messages: z.string().describe("JSON string of conversation messages"),
  }),
  async execute({ userId, messages }) {
    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        messages JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Save conversation
    const result = await sql`
      INSERT INTO conversations (user_id, messages)
      VALUES (${userId}, ${messages}::jsonb)
      RETURNING id, created_at
    `;

    return { 
      success: true, 
      id: result[0].id, 
      createdAt: result[0].created_at 
    };
  },
});
