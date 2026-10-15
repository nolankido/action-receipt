import { env } from "cloudflare:workers";
import { handleExtraction, type AIConfig } from "../../../lib/extraction-service.ts";
export async function POST(request: Request) { return handleExtraction(request, env as unknown as AIConfig); }
