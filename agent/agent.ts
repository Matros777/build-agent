import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { defineAgent } from "eve";

const MODEL = process.env.MODEL || "dots-studio/dots-3-note-preview:free";
const CONTEXT_WINDOW = Number(process.env.CONTEXT_WINDOW) || 200000;

const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default defineAgent({
  model: openrouter(MODEL),
  modelContextWindowTokens: CONTEXT_WINDOW,
});
