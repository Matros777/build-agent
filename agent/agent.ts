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

// Решаем модель один раз при старте сессии и кешируем.
// Модуль-уровневый кеш + fallback на env/DEFAULT — БД НЕ блокирует агента.
let cachedModelId: string | null = null;
let cacheLoaded = false;

async function resolveModelId(): Promise<string> {
  // 1) env override имеет высший приоритет (меняется в Vercel)
  if (process.env.MODEL) return process.env.MODEL;

  // 2) кеш из памяти
  if (cacheLoaded) return cachedModelId ?? DEFAULT_MODEL.id;

  // 3) лениво читаем из MongoDB один раз
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
      "session.started": async () => {
        const modelId = await resolveModelId();
        return {
          model: openrouter(modelId),
          modelContextWindowTokens: MODEL_CONTEXT_WINDOW,
        };
      },
    },
  }),
});