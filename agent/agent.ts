import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { defineAgent, defineDynamic } from "eve";
import { getClient } from "../lib/mongodb";
import { DEFAULT_MODEL, getModelById } from "../lib/models";

// Провайдер OpenRouter (нужен API ключ)
const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Провайдер OpenCode Zen (free-модели БЕЗ ключа)
const zen = createOpenAICompatible({
  name: "zen",
  baseURL: process.env.ZEN_BASE_URL || "https://opencode.ai/zen/v1",
  apiKey: process.env.ZEN_API_KEY || "zen-free", // free-модели не требуют ключа
});

const MODEL_CONTEXT_WINDOW = Number(process.env.CONTEXT_WINDOW) || 200000;

// Кеш: БД читается один раз, дальше модель из памяти
let cachedModelId: string | null = null;
let cacheLoaded = false;

async function resolveModelId(): Promise<string> {
  // 1) env override главный (меняется в Vercel)
  if (process.env.MODEL) return process.env.MODEL;

  // 2) кеш из памяти
  if (cacheLoaded) return cachedModelId ?? DEFAULT_MODEL.id;

  // 3) лениво из MongoDB один раз
  try {
    const client = getClient();
    await client.connect();
    const db = client.db("build-agent");
    const config = db.collection("config");
    const doc = await config.findOne({ key: "selected_model" });
    cachedModelId = doc?.modelId || DEFAULT_MODEL.id;
  } catch (err) {
    console.error("[model] DB unavailable, using default:", err instanceof Error ? err.message : String(err));
    cachedModelId = DEFAULT_MODEL.id;
  }
  cacheLoaded = true;
  return cachedModelId ?? DEFAULT_MODEL.id;
}

export default defineAgent({
  model: defineDynamic({
    events: {
      // step.started разрешает возвращать provider object, см. доки eve
      "step.started": async () => {
        const modelId = await resolveModelId();
        const model = getModelById(modelId);

        if (model.provider === "zen") {
          return {
            model: zen(model.id),
            modelContextWindowTokens: MODEL_CONTEXT_WINDOW,
          };
        }

        return {
          model: openrouter(model.id),
          modelContextWindowTokens: MODEL_CONTEXT_WINDOW,
        };
      },
    },
  }),
});