import assert from "node:assert/strict";
import test from "node:test";
import { MAX_NOTICE_LENGTH, MIN_NOTICE_LENGTH, manualAction, noticeInputState } from "../lib/receipt.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";
import { recoverWorkspace, type WorkspaceSnapshot } from "../lib/workspace-recovery.ts";
import { demoScenario } from "../lib/demo-scenario.ts";

const meta = { title: "Input boundary check", mode: "manual" as const, receiptId: "input-boundary", createdAt: new Date("2026-10-15T00:00:00Z"), notes: [] };

test("notice limits use the whole input and require enough non-whitespace context", () => {
  assert.equal(noticeInputState(" \n\t").kind, "empty");
  assert.equal(noticeInputState(" ".repeat(50) + "x".repeat(MIN_NOTICE_LENGTH - 1)).kind, "short");
  assert.equal(noticeInputState("x".repeat(MIN_NOTICE_LENGTH)).ready, true);
  assert.equal(noticeInputState("x".repeat(MAX_NOTICE_LENGTH)).ready, true);
  const over = noticeInputState("x".repeat(MAX_NOTICE_LENGTH) + " ");
  assert.equal(over.kind, "long"); assert.equal(over.ready, false); assert.match(over.message, /1 character over/);
});

test("an over-limit notice cannot produce a partial scan, manual action or saved review", () => {
  const tail = "Pay the separate deposit by November 9, 2032.";
  const source = "Register for the workshop by November 5, 2032.\n" + "Context. ".repeat(1700) + tail;
  assert.ok(source.length > MAX_NOTICE_LENGTH);
  assert.throws(() => extractLocally(source), /full text is still here/);
  assert.throws(() => manualAction(source, "Pay the separate deposit", tail, "", 1), /full text is still here/);
  assert.throws(() => saveReviewFile({ source, actions: [], meta }), /could not be saved/);
  assert.ok(source.endsWith(tail));
});

test("the exact maximum-length source and its late instruction survive a review-file round trip", () => {
  const quote = "Submit the final consent form by November 9, 2032.";
  const source = "x".repeat(MAX_NOTICE_LENGTH - quote.length - 2) + "\n\n" + quote;
  const action = manualAction(source, "Submit the final consent form", quote, "", 1);
  const loaded = openReviewFile(saveReviewFile({ source, actions: [action], meta }));
  assert.equal(loaded.source, source);
  assert.deepEqual(loaded.actions[0].evidence[0].starts, [source.length - quote.length]);
  assert.equal(loaded.actions[0].approved, false); assert.equal(loaded.actions[0].dateConfirmed, false);
});

test("an oversized draft remains intact when the previous review is recovered", () => {
  const r = extractLocally(demoScenario.source);
  const original: WorkspaceSnapshot = { source: demoScenario.source, title: demoScenario.title, ...r, actions: r.actions.map(a => ({ ...a, approved: true })), mode: "local", sampleId: null, restored: false, receiptId: "previous-input", createdAt: meta.createdAt };
  const source = "Unscanned draft.\r\n" + "🎓".repeat(8000) + "\nFINAL CONDITION MUST REMAIN";
  const draft: WorkspaceSnapshot = { ...original, source, actions: [], attention: [], notes: [], mode: null };
  const recovered = recoverWorkspace(draft, original);
  assert.equal(recovered.previous.source, source);
  assert.equal(recovered.workspace.source, original.source);
  assert.ok(recovered.workspace.actions.every(a => !a.approved && !a.dateConfirmed));
  const back = recoverWorkspace(recovered.workspace, recovered.previous).workspace;
  assert.equal(back.source, source); assert.equal(noticeInputState(back.source).kind, "long");
});

test("after deliberately shortening a draft, normal extraction still requires all approvals", () => {
  const over = demoScenario.source + " ".repeat(MAX_NOTICE_LENGTH);
  assert.equal(noticeInputState(over).ready, false);
  const shortened = demoScenario.source;
  assert.equal(noticeInputState(shortened).ready, true);
  const r = extractLocally(shortened);
  assert.equal(r.actions.length, 3); assert.equal(r.attention.length, 2);
  assert.ok(r.actions.every(a => !a.approved && !a.dateConfirmed));
});
