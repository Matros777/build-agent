import { defineTool } from "eve/tools";
import { getClient } from "../../lib/mongodb";
import { z } from "zod";

export default defineTool({
  description: "Load the user's conversation history from MongoDB. Call this FIRST at the start of every session to remember previous discussions.",
  inputSchema: z.object({
    userId: z.string().describe("The user's identifier (e.g. 'boss'). If the user is the owner, use 'boss'."),
  }),
  async execute({ userId }) {
    const client = getClient();
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
  },
});