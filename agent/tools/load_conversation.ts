import { defineTool } from "eve/tools";
import { MongoClient } from "mongodb";
import { z } from "zod";

function getClient() {
  const uri = process.env.DATABASE_URL_MONGODB_URI;
  if (!uri) throw new Error("DATABASE_URL_MONGODB_URI is not set");
  return new MongoClient(uri);
}

export default defineTool({
  description: "Load the user's conversation history from MongoDB. Call this FIRST at the start of every session to remember previous discussions.",
  inputSchema: z.object({
    userId: z.string().describe("The user's identifier (e.g. 'boss'). If the user is the owner, use 'boss'."),
  }),
  async execute({ userId }) {
    const client = getClient();
    try {
      await client.connect();
      const db = client.db("build-agent");
      const conversations = db.collection("conversations");

      const doc = await conversations.findOne({ userId });

      if (!doc) {
        return {
          found: false,
          message: `No previous conversations found for user '${userId}'. This is their first visit.`,
          conversations: [],
        };
      }

      return {
        found: true,
        message: `Found previous conversation for user '${userId}' with ${doc.messages.length} messages.`,
        conversations: doc.messages,
        updatedAt: doc.updatedAt,
      };
    } finally {
      await client.close();
    }
  },
});