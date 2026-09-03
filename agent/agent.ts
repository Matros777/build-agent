import { defineAgent } from "eve";

export default defineAgent({
  model: "dots-studio/dots-3-note-preview:free",
  modelContextWindowTokens: 200000,
});
