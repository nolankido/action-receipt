import { env } from "cloudflare:workers";
import { configured, type AIConfig } from "../../../lib/extraction-service.ts";
export async function GET() { return Response.json({ liveAI: configured(env as unknown as AIConfig) }, { headers: { "Cache-Control": "no-store" } }); }
