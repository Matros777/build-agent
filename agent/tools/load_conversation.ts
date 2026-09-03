import { defineTool } from "eve/tools";
import { getClient } from "../../lib/mongodb";
import { z } from "zod";

// Converts BSON dates/objects to plain JSON-safe values
function toJSONSafe(value: any): any {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJSONSafe);
  if (typeof value === "object") {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "_id" || k === "$oid" || k === "$date") continue; // drop ObjectId etc.
      result[k] = toJSONSafe(v);
    }
    return result;
  }
  return value;
}

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

    const messages = Array.isArray(doc.messages) ? doc.messages : [];

    return {
      found: true,
      message: `Found previous conversation for user '${userId}' with ${messages.length} messages.`,
      conversations: toJSONSafe(messages),
      updatedAt: toJSONSafe(doc.updatedAt),
    };
  },
});