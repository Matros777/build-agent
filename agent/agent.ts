import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { defineAgent, defineDynamic } from "eve";
import { getClient } from "../lib/mongodb";
import { DEFAULT_MODEL } from "../lib/models";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL_CONTEXT_WINDOW = Number(process.env.CONTEXT_WINDOW) || 200000;

async function getSelectedModelId(): Promise<string> {
  try {
    const client = getClient();
    await client.connect();
    const db = client.db("build-agent");
    const config = db.collection("config");
    const doc = await config.findOne({ key: "selected_model" });
    return doc?.modelId || DEFAULT_MODEL.id;
  } catch {
    // Fallback if DB is unavailable — never crash the agent
    return DEFAULT_MODEL.id;
  }
}

export default defineAgent({
  model: defineDynamic({
    events: {
      "turn.started": async (_event) => {
        const modelId = await getSelectedModelId();
        return {
          model: openrouter(modelId),
          modelContextWindowTokens: MODEL_CONTEXT_WINDOW,
        };
      },
    },
  }),
});