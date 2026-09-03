export type AgentModel = {
  id: string;        // model id for OpenRouter
  name: string;      // display name
  context: string;   // context window size label
  emoji: string;     // icon
  desc: string;      // short description
};

export const AGENT_MODELS: AgentModel[] = [
  { id: "nvidia/nemotron-3.5-lightning:free", name: "Nemotron 3.5 Lightning", context: "1000K", emoji: "🤖", desc: "Open mixture-of-experts (free)" },
  { id: "nvidia/nemotron-3.5-content-safety:free", name: "Nemotron 3.5 Content Safety", context: "128K", emoji: "🖼️", desc: "Compact 4B safety model (free)" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Nemotron 3 Ultra 550B", context: "1000K", emoji: "🤖", desc: "Open frontier reasoning MoE (free)" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "Nemotron 3 Nano Omni", context: "256K", emoji: "🖼️", desc: "30B-A3B multimodal reasoning (free)" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super 120B", context: "262K", emoji: "🤖", desc: "120B hybrid MoE (free)" },
  { id: "inclusionai/ling-3.0-flash-fin:free", name: "Ling 3.0 Flash Fin", context: "262K", emoji: "🤖", desc: "Finance-focused MoE (free)" },
  { id: "dots-studio/dots-3-note-preview:free", name: "Dots3 Note Preview", context: "512K", emoji: "🖼️", desc: "Open-weight MoE (free)" },
  { id: "liquid/lfm-2.5-2.6b:free", name: "LFM 2.5 2.6B", context: "65K", emoji: "🤖", desc: "Compact reasoning model (free)" },
  { id: "thinkingmachines/inkling-small:free", name: "Inkling Small", context: "1048K", emoji: "🖼️", desc: "Open-weight multimodal MoE (free)" },
  { id: "poolside/laguna-s-2.1:free", name: "Laguna S 2.1", context: "262K", emoji: "🤖", desc: "Coding agent model (free)" },
  { id: "thinkingmachines/inkling:free", name: "Inkling", context: "1048K", emoji: "🖼️", desc: "Open-weight multimodal MoE (free)" },
  { id: "poolside/laguna-xs-2.1:free", name: "Laguna XS 2.1", context: "262K", emoji: "🤖", desc: "33B-A3B coding model (free)" },
  { id: "cohere/north-mini-code:free", name: "North Mini Code", context: "256K", emoji: "🤖", desc: "Agentic coding model (free)" },
  { id: "z-ai/glm-5.2:free", name: "GLM 5.2", context: "256K", emoji: "🤖", desc: "Large-scale reasoning model (free)" },
  { id: "minimax/minimax-m3:free", name: "MiniMax-M3", context: "1048K", emoji: "🖼️", desc: "Multimodal foundation model (free)" },
  { id: "google/gemma-4-26b-a4b-it:free", name: "Gemma 4 26B A4B", context: "262K", emoji: "🖼️", desc: "Instruction-tuned MoE (free)" },
  { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B", context: "262K", emoji: "🖼️", desc: "30.7B dense multimodal (free)" },
  { id: "minimax/minimax-m2.7:free", name: "MiniMax-M2.7", context: "196K", emoji: "🤖", desc: "Next-gen LLM (free)" },
];

export const DEFAULT_MODEL = AGENT_MODELS[6] ?? AGENT_MODELS[0]; // dots-studio/dots-3-note-preview:free

export function getModelById(id: string): AgentModel {
  return AGENT_MODELS.find((m) => m.id === id) ?? DEFAULT_MODEL;
}