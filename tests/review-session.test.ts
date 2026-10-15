import assert from "node:assert/strict";
import test from "node:test";
import { checkpointReview, reviewContentStamp, reviewSessionState } from "../lib/review-session.ts";
import { recoverWorkspace, type WorkspaceSnapshot } from "../lib/workspace-recovery.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { demoScenario } from "../lib/demo-scenario.ts";
import { recordSourceDecision } from "../lib/source-review.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";

function practice(): WorkspaceSnapshot {
  return { source: demoScenario.source, title: demoScenario.title, ...extractLocally(demoScenario.source), mode: "local", sampleId: null, restored: false, receiptId: "practice", createdAt: new Date("2026-10-15T00:00:00Z") };
}
function changed(): WorkspaceSnapshot { const s = practice(); return { ...s, actions: s.actions.map(a => ({ ...a, approved: true })) }; }
test("fresh practice and receipt identity updates do not produce spurious unsaved warnings", () => {
  const s = practice(); const baseline = reviewContentStamp(s);
  assert.equal(reviewSessionState(s, baseline, null).warnBeforeLeaving, false);
  assert.equal(reviewSessionState({ ...s, receiptId: "new-receipt", createdAt: new Date() } as WorkspaceSnapshot, baseline, null).warnBeforeLeaving, false);
  const reordered = { ...s, actions: s.actions.map(a => Object.fromEntries(Object.entries(a).reverse()) as typeof a) };
  assert.equal(reviewContentStamp(reordered), baseline);
});
test("source, title, action checks, date checks and source decisions independently count as changes", () => {
  const s = practice(); const baseline = reviewContentStamp(s);
  const variants = [
    { ...s, source: s.source + "\nA new condition." }, { ...s, title: "Renamed notice" }, changed(),
    { ...s, actions: s.actions.map(a => ({ ...a, dateConfirmed: true })) },
    { ...s, actions: s.actions.map(a => ({ ...a, omitted: true })) },
    { ...s, attention: s.attention.map(i => recordSourceDecision(i, { kind: "clarify", note: "Ask which deadline applies.", actionId: null }, s.actions)) },
  ];
  for (const v of variants) assert.equal(reviewSessionState(v, baseline, null).current, true);
  assert.equal(reviewSessionState(s, baseline, null).current, false);
});
test("a requested current download does not mark a separate recovery copy as saved", () => {
  const s = changed(); const baseline = reviewContentStamp(practice());
  const copy = checkpointReview(s, baseline, null, "replace", "Before another notice")!;
  assert.equal(copy.unsaved, true);
  assert.deepEqual(reviewSessionState(s, reviewContentStamp(s), copy), { current: false, previous: true, warnBeforeLeaving: true });
  assert.equal(reviewSessionState(s, reviewContentStamp(s), null).warnBeforeLeaving, false);
});
test("clean examples and downloaded work do not overwrite an existing unsaved copy", () => {
  const original = changed(); const baseline = reviewContentStamp(practice());
  const copy = checkpointReview(original, baseline, null, "replace", "Unsaved original")!;
  const clean = practice();
  assert.equal(checkpointReview(clean, reviewContentStamp(clean), copy, "replace", "Fresh example"), copy);
  original.actions[0].title = "Later mutation";
  assert.notEqual(copy.workspace.actions[0].title, original.actions[0].title);
});
test("continuous draft typing and its first scan preserve the unsaved pre-edit copy", () => {
  const s = changed(); const baseline = reviewContentStamp(practice());
  const copy = checkpointReview(s, baseline, null, "source_edit", "Before typing")!;
  const draft = { ...s, source: "A new notice that has not been scanned.", actions: [], attention: [], mode: null };
  assert.equal(checkpointReview(draft, baseline, copy, "source_edit", "More typing"), copy);
  assert.equal(checkpointReview(draft, baseline, copy, "scan", "First scan"), copy);
  const empty = { ...draft, source: "", title: "", notes: [] };
  assert.deepEqual(reviewSessionState(empty, baseline, copy), { current: false, previous: true, warnBeforeLeaving: true });
});
test("restoring an unsaved review retains the warning and clears trust without changing its content", () => {
  const s = changed(); const baseline = reviewContentStamp(practice());
  const copy = checkpointReview(s, baseline, null, "replace", "Unsaved original")!;
  const restored = recoverWorkspace(practice(), copy.workspace).workspace;
  const restoredBaseline = copy.unsaved ? "" : reviewContentStamp(restored);
  assert.equal(reviewSessionState(restored, restoredBaseline, null).current, true);
  assert.equal(restored.source, s.source); assert.ok(restored.actions.every(a => !a.approved && !a.dateConfirmed));
});
test("download markers and recovery metadata never enter review files or restore approval", () => {
  const s = changed(); const before = JSON.stringify(s);
  const stamp = reviewContentStamp(s);
  const text = saveReviewFile({ source: s.source, actions: s.actions, meta: { title: s.title, mode: "local", receiptId: s.receiptId, createdAt: s.createdAt, notes: s.notes, attention: s.attention } });
  const loaded = openReviewFile(text);
  assert.equal(JSON.stringify(s), before); assert.equal(reviewContentStamp(s), stamp);
  assert.ok(!text.includes('"unsaved"') && !text.includes('"saveBaseline"'));
  assert.ok(loaded.actions.every(a => !a.approved && !a.dateConfirmed));
});
