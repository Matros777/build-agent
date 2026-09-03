import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongodb";
import { AGENT_MODELS, DEFAULT_MODEL, type AgentModel } from "@/lib/models";

async function getStoredModel(): Promise<string> {
  try {
    const client = getClient();
    await client.connect();
    const db = client.db("build-agent");
    const config = db.collection("config");
    const doc = await config.findOne({ key: "selected_model" });
    return doc?.modelId || DEFAULT_MODEL.id;
  } catch {
    return DEFAULT_MODEL.id;
  }
}

export async function GET() {
  const modelId = await getStoredModel();
  const current = AGENT_MODELS.find((m) => m.id === modelId) ?? DEFAULT_MODEL;
  return NextResponse.json({
    current,
    models: AGENT_MODELS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const modelId: string = body?.modelId;

    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 });
    }

    const model: AgentModel | undefined = AGENT_MODELS.find((m) => m.id === modelId);
    if (!model) {
      return NextResponse.json({ error: `Unknown model: ${modelId}` }, { status: 400 });
    }

    const client = getClient();
    await client.connect();
    const db = client.db("build-agent");
    const config = db.collection("config");

    await config.updateOne(
      { key: "selected_model" },
      { $set: { modelId, updatedAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ success: true, model });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to save model: ${err?.message || err}` },
      { status: 500 },
    );
  }
}