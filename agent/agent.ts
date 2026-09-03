import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { defineAgent } from "eve";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default defineAgent({
  model: openrouter("dots-studio/dots-3-note-preview:free"),
  modelContextWindowTokens: 200000,
});
