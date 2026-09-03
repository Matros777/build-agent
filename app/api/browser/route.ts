import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongodb";

async function getBrowserEnabled(): Promise<boolean> {
  try {
    const client = getClient();
    await client.connect();
    const db = client.db("build-agent");
    const config = db.collection("config");
    const doc = await config.findOne({ key: "browser_enabled" });
    return doc?.enabled ?? false;
  } catch {
    return false;
  }
}

export async function GET() {
  const enabled = await getBrowserEnabled();
  return NextResponse.json({ enabled });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const enabled: boolean = body?.enabled;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    const client = getClient();
    await client.connect();
    const db = client.db("build-agent");
    const config = db.collection("config");

    await config.updateOne(
      { key: "browser_enabled" },
      { $set: { enabled, updatedAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ success: true, enabled });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to save browser flag: ${err?.message || err}` },
      { status: 500 },
    );
  }
}