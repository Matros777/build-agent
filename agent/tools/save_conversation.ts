import { defineTool } from "eve/tools";
import { getClient } from "../../lib/mongodb";
import { z } from "zod";

export default defineTool({
  description: "Save the conversation history to MongoDB. Call this at the end of a session so the user's conversations are remembered.",
  inputSchema: z.object({
    userId: z.string().describe("The user's identifier (e.g. 'boss')."),
    messages: z.array(z.object({
      role: z.string().describe("Role: 'user' or 'assistant'"),
      content: z.string().describe("Message content"),
    })).describe("Array of conversation messages"),
  }),
  async execute({ userId, messages }) {
    const client = getClient();
    await client.connect();
    const db = client.db("build-agent");
    const conversations = db.collection("conversations");

    await conversations.updateOne(
      { userId },
      {
        $set: {
          userId,
          messages,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return {
      success: true,
      message: `Saved conversation history for user '${userId}' (${messages.length} messages).`,
    };
  },
});