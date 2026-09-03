import { defineAgent } from "eve";

// Available models (OpenRouter free tier):
// ─────────────────────────────────────────
// nvidia/nemotron-3.5-lightning:free              (1000K ctx)
// nvidia/nemotron-3.5-content-safety:free         (128K ctx)
// nvidia/nemotron-3-ultra-550b-a55b:free          (1000K ctx)
// nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free (256K ctx)
// nvidia/nemotron-3-super-120b-a12b:free          (262K ctx)
// inclusionai/ling-3.0-flash-fin:free             (262K ctx)
// dots-studio/dots-3-note-preview:free            (512K ctx)
// liquid/lfm-2.5-2.6b:free                        (65K ctx)
// thinkingmachines/inkling-small:free              (1048K ctx)
// poolside/laguna-s-2.1:free                       (262K ctx)
// thinkingmachines/inkling:free                    (1048K ctx)
// poolside/laguna-xs-2.1:free                      (262K ctx)
// cohere/north-mini-code:free                      (256K ctx)
// z-ai/glm-5.2:free                                (256K ctx)
// minimax/minimax-m3:free                          (1048K ctx)
// google/gemma-4-26b-a4b-it:free                   (262K ctx)
// google/gemma-4-31b-it:free                       (262K ctx)
// minimax/minimax-m2.7:free                        (196K ctx)

export default defineAgent({
  model: "dots-studio/dots-3-note-preview:free",
});
