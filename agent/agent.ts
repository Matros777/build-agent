import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { defineAgent, defineTool } from "eve";
import { put } from "@vercel/blob";
import { z } from "zod";

const MODEL = process.env.MODEL || "dots-studio/dots-3-note-preview:free";
const CONTEXT_WINDOW = Number(process.env.CONTEXT_WINDOW) || 200000;

const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Tool: save file to Vercel Blob Storage
const saveToBlob = defineTool({
  description: "Save a file to Vercel Blob Storage. Returns the public URL.",
  inputSchema: z.object({
    path: z.string().describe("File path, e.g. 'articles/hello.txt'"),
    content: z.string().describe("File content"),
    contentType: z.string().optional().describe("MIME type, e.g. 'text/plain'"),
  }),
  async execute({ path, content, contentType }) {
    const { url } = await put(path, content, {
      access: "public",
      contentType: contentType || "text/plain",
    });
    return { url };
  },
});

export default defineAgent({
  model: openrouter(MODEL),
  modelContextWindowTokens: CONTEXT_WINDOW,
  tools: [saveToBlob],
});
