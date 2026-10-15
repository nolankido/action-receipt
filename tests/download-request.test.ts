import test from "node:test";
import assert from "node:assert/strict";
import { requestDownload, planDownloadFeedback, type DownloadOutput } from "../lib/download-request.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { checklistText } from "../lib/export.ts";
import { demoScenario } from "../lib/demo-scenario.ts";

test("a request forwards exact serialized content once without claiming or changing review trust", () => {
  const review = extractLocally(demoScenario.source); const actions = review.actions.map(a => ({ ...a, approved: true }));
  const before = JSON.stringify(actions);
  const meta = { mode: "local" as const, title: demoScenario.title, receiptId: "download-test", createdAt: new Date("2026-10-15T00:00:00Z"), notes: review.notes, attention: review.attention };
  const output: DownloadOutput = { format: "checklist", text: checklistText(actions, meta), count: actions.length };
  const calls: DownloadOutput[] = [];
  const request = requestDownload(output, value => { calls.push(value); value.text = "mutated callback argument"; });
  assert.equal(calls.length, 1); assert.equal(request.status, "requested");
  if (request.status !== "requested") return;
  assert.deepEqual(request.output, output); assert.match(planDownloadFeedback(request, output).message, /cannot verify the save/);
  assert.equal(JSON.stringify(actions), before);
});

test("download exceptions and empty selections produce local feedback without a false request result", () => {
  const output: DownloadOutput = { format: "questions", text: "Checked question", count: 1 };
  const failed = requestDownload(output, () => { throw new Error("The browser blocked this operation."); });
  assert.equal(failed.status, "error"); assert.match(planDownloadFeedback(failed, output).message, /browser blocked/);
  for (const bad of [{ ...output, count: 0 }, { ...output, text: "" }]) {
    let called = false; const result = requestDownload(bad, () => { called = true; });
    assert.equal(called, false); assert.equal(result.status, "error");
  }
});

test("changing format, exact content or selected count marks a previous request as covering a different preview", () => {
  const output: DownloadOutput = { format: "questions", text: "Question one", count: 1 };
  const request = requestDownload(output, () => {});
  assert.equal(planDownloadFeedback(request, output).stale, false);
  for (const patch of [{ format: "checklist" as const }, { text: "Question edited" }, { count: 2 }]) assert.equal(planDownloadFeedback(request, { ...output, ...patch }).stale, true);
  assert.equal(planDownloadFeedback(request, { ...output }).stale, false);
});
