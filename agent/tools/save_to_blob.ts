import { defineTool } from "eve/tools";
import { put } from "@vercel/blob";
import { z } from "zod";

export default defineTool({
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
