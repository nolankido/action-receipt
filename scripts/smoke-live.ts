import { mkdir, writeFile } from "node:fs/promises";
import { handleExtraction } from "../lib/extraction-service.ts";
import { samples } from "../lib/samples.ts";
import { validateExtraction } from "../lib/receipt.ts";

if (!process.env.OPENAI_API_KEY) {
  process.stderr.write("Live smoke not run: configure a real server-side API key securely first. No results file was created.\n");
  process.exit(2);
}
const report: Record<string, unknown> = { runAt: new Date().toISOString(), source: "current checkout, newly authored synthetic notices", model: process.env.OPENAI_MODEL || "gpt-5-mini", interpretation: "Observed real-service responses, not independent correctness certification. Human review is required.", cases: [] };
const cases: Record<string, unknown>[] = [];
for (const sample of samples) {
  const request = new Request("http://localhost/api/extract", { method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ source: sample.source }) });
  const response = await handleExtraction(request, { OPENAI_API_KEY: process.env.OPENAI_API_KEY, OPENAI_MODEL: process.env.OPENAI_MODEL, ACTION_RECEIPT_AI_ENABLED: "1", ACTION_RECEIPT_ALLOW_LOCAL_AI: "1" });
  const data = await response.json() as { extraction?: unknown; model?: string; error?: string; message?: string };
  const observed = response.ok ? validateExtraction(sample.source, data.extraction) : null;
  cases.push({ id: sample.id, status: response.status, source: sample.source, expected_reference: sample.result, actual: data, observed, human_review: { status: "not_reviewed", missed_actions: [], wrong_actions: [], required_edits: [], notes: "" } });
  process.stdout.write(`${sample.id}: HTTP ${response.status}; ${observed ? observed.actions.length + " proposed actions; assess their meaning manually" : "failure preserved"}\n`);
}
report.cases = cases;
await mkdir("devpost", { recursive: true });
await writeFile("devpost/live-smoke.json", JSON.stringify(report, null, 2) + "\n");
process.stdout.write("Saved devpost/live-smoke.json. Human review is still pending; failures are retained.\n");
if (cases.some(c => c.status !== 200)) process.exitCode = 1;
