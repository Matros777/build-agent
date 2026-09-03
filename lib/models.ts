export type AgentModel = {
  id: string;        // model id for the provider
  name: string;      // display name
  context: string;   // context window size label
  provider: "zen" | "openrouter";
  desc: string;      // short description
};

// OpenCode Zen — бесплатные модели (без API ключа)
const ZEN_MODELS: AgentModel[] = [
  { id: "big-pickle", name: "Big Pickle (Zen)", context: "—", provider: "zen", desc: "Free stealth model" },
  { id: "mimo-v2.5-free", name: "MiMo-V2.5 Free (Zen)", context: "—", provider: "zen", desc: "Free model (limited time)" },
  { id: "ling-3.0-flash-fin-free", name: "Ling 3.0 Flash Fin (Zen)", context: "—", provider: "zen", desc: "Free finance model (limited time)" },
  { id: "nemotron-3-ultra-free", name: "Nemotron 3 Ultra Free (Zen)", context: "—", provider: "zen", desc: "NVIDIA free endpoint" },
  { id: "nemotron-3.5-lightning-free", name: "Nemotron 3.5 Lightning (Zen)", context: "—", provider: "zen", desc: "NVIDIA free endpoint" },
  { id: "muse-spark-1.3-contributor-free", name: "Muse Spark 1.3 (Zen)", context: "—", provider: "zen", desc: "Meta contributor free" },
  { id: "muse-spark-1.2-contributor-free", name: "Muse Spark 1.2 (Zen)", context: "—", provider: "zen", desc: "Meta contributor free" },
];

// OpenRouter — бесплатные модели
const OPENROUTER_MODELS: AgentModel[] = [
  { id: "nvidia/nemotron-3.5-lightning:free", name: "Nemotron 3.5 Lightning", context: "1000K", provider: "openrouter", desc: "Open mixture-of-experts (free)" },
  { id: "nvidia/nemotron-3.5-content-safety:free", name: "Nemotron 3.5 Content Safety", context: "128K", provider: "openrouter", desc: "Compact 4B safety model (free)" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Nemotron 3 Ultra 550B", context: "1000K", provider: "openrouter", desc: "Open frontier reasoning MoE (free)" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "Nemotron 3 Nano Omni", context: "256K", provider: "openrouter", desc: "30B-A3B multimodal reasoning (free)" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super 120B", context: "262K", provider: "openrouter", desc: "120B hybrid MoE (free)" },
  { id: "inclusionai/ling-3.0-flash-fin:free", name: "Ling 3.0 Flash Fin", context: "262K", provider: "openrouter", desc: "Finance-focused MoE (free)" },
  { id: "dots-studio/dots-3-note-preview:free", name: "Dots3 Note Preview", context: "512K", provider: "openrouter", desc: "Open-weight MoE (free)" },
  { id: "liquid/lfm-2.5-2.6b:free", name: "LFM 2.5 2.6B", context: "65K", provider: "openrouter", desc: "Compact reasoning model (free)" },
  { id: "thinkingmachines/inkling-small:free", name: "Inkling Small", context: "1048K", provider: "openrouter", desc: "Open-weight multimodal MoE (free)" },
  { id: "poolside/laguna-s-2.1:free", name: "Laguna S 2.1", context: "262K", provider: "openrouter", desc: "Coding agent model (free)" },
  { id: "thinkingmachines/inkling:free", name: "Inkling", context: "1048K", provider: "openrouter", desc: "Open-weight multimodal MoE (free)" },
  { id: "poolside/laguna-xs-2.1:free", name: "Laguna XS 2.1", context: "262K", provider: "openrouter", desc: "33B-A3B coding model (free)" },
  { id: "cohere/north-mini-code:free", name: "North Mini Code", context: "256K", provider: "openrouter", desc: "Agentic coding model (free)" },
  { id: "z-ai/glm-5.2:free", name: "GLM 5.2", context: "256K", provider: "openrouter", desc: "Large-scale reasoning model (free)" },
  { id: "minimax/minimax-m3:free", name: "MiniMax-M3", context: "1048K", provider: "openrouter", desc: "Multimodal foundation model (free)" },
  { id: "google/gemma-4-26b-a4b-it:free", name: "Gemma 4 26B A4B", context: "262K", provider: "openrouter", desc: "Instruction-tuned MoE (free)" },
  { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B", context: "262K", provider: "openrouter", desc: "30.7B dense multimodal (free)" },
  { id: "minimax/minimax-m2.7:free", name: "MiniMax-M2.7", context: "196K", provider: "openrouter", desc: "Next-gen LLM (free)" },
];

export const AGENT_MODELS: AgentModel[] = [...ZEN_MODELS, ...OPENROUTER_MODELS];

export const DEFAULT_MODEL = AGENT_MODELS.find(
  (m) => m.id === "dots-studio/dots-3-note-preview:free",
) ?? AGENT_MODELS[0];

export function getModelById(id: string): AgentModel {
  return AGENT_MODELS.find((m) => m.id === id) ?? DEFAULT_MODEL;
}