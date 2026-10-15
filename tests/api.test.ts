import test from "node:test";
import assert from "node:assert/strict";
import { handleExtraction, limitedText, type AIConfig } from "../lib/extraction-service.ts";
import { samples } from "../lib/samples.ts";
const config: AIConfig = { OPENAI_API_KEY: "test-only-not-a-real-key", ACTION_RECEIPT_AI_ENABLED: "1" };
let id = 0;
function request(body: unknown = { source: samples[0].source }, headers: Record<string, string> = {}) {
  return new Request("https://receipt.example/api/extract", { method: "POST", headers: { origin: "https://receipt.example", "content-type": "application/json", "oai-authenticated-user-id": `test-${++id}`, ...headers }, body: JSON.stringify(body) });
}
const goodFetch = (async () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(samples[0].result) }] }] })) as typeof fetch;
test("missing key is an honest unavailable error, never a sample fallback", async () => {
  const response = await handleExtraction(request(), {}, () => { throw new Error("must not call provider"); });
  assert.equal(response.status, 503); const data = await response.json() as { error: string; extraction?: unknown }; assert.equal(data.error, "not_configured"); assert.equal(data.extraction, undefined);
});
test("cross-origin and unauthenticated requests are rejected before provider access", async () => {
  assert.equal((await handleExtraction(request(undefined, { origin: "https://attacker.example" }), config, goodFetch)).status, 403);
  assert.equal((await handleExtraction(request(undefined, { "oai-authenticated-user-id": "" }), config, goodFetch)).status, 401);
});
test("invalid or oversized notice is rejected before inference", async () => {
  for (const source of ["short", "x".repeat(15001), 123]) assert.equal((await handleExtraction(request({ source }), config, goodFetch)).status, 400);
});
test("strict provider output is checked and private request settings are sent", async () => {
  let body: Record<string, any> = {};
  const fake = (async (_url: unknown, options: RequestInit) => { body = JSON.parse(String(options.body)); return goodFetch("https://unused.example"); }) as typeof fetch;
  const response = await handleExtraction(request(), config, fake);
  assert.equal(response.status, 200); const json = await response.json() as { extraction: { actions: unknown[] } }; assert.equal(json.extraction.actions.length, 4);
  assert.equal(body.store, false); assert.equal(body.text.format.strict, true); assert.equal(body.tools, undefined);
  assert.match(body.instructions, /Distinguish event dates/); assert.match(body.instructions, /untrusted document data/);
});
test("malformed, incomplete and refused outputs never become success", async () => {
  const variants = [
    { status: "incomplete", output: [] },
    { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "not json" }] }] },
    { status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "No" }] }] },
    { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ actions: [{ title: "Unsupported" }], notes: [] }) }] }] },
  ];
  for (const variant of variants) { const res = await handleExtraction(request(), config, (async () => Response.json(variant)) as typeof fetch); assert.ok(res.status >= 400); }
});
test("provider outage retains error status with no provider details or credentials", async () => {
  const res = await handleExtraction(request(), config, (async () => new Response("private provider failure", { status: 500 })) as typeof fetch);
  assert.equal(res.status, 502); const text = await res.text(); assert.ok(!text.includes("test-only")); assert.ok(!text.includes("private provider"));
});
test("per-user short-term limit rejects the fifth request in one minute", async () => {
  const headers = { "oai-authenticated-user-id": "rate-test" }; const now = 1000;
  for (let n = 0; n < 4; n++) assert.equal((await handleExtraction(request(undefined, headers), config, goodFetch, now)).status, 200);
  assert.equal((await handleExtraction(request(undefined, headers), config, goodFetch, now)).status, 429);
  assert.equal((await handleExtraction(request(undefined, headers), config, goodFetch, now + 60001)).status, 200);
});
test("streamed body is bounded by actual bytes, independent of content-length", async () => {
  await assert.rejects(() => limitedText(new Response("🎓".repeat(100)), 100), /too_large/);
});
