import { MongoClient } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

let cachedClient: MongoClient | null = null;

export function getClient(): MongoClient {
  if (cachedClient) return cachedClient;

  const uri = process.env.DATABASE_URL_MONGODB_URI;
  if (!uri) throw new Error("DATABASE_URL_MONGODB_URI is not set");

  const client = new MongoClient(uri, { appName: "build-agent" });

  // Критично для serverless: корректное управление соединениями при suspend/resume
  attachDatabasePool(client);

  cachedClient = client;
  return client;
}