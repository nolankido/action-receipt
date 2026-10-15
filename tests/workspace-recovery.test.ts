import assert from "node:assert/strict";
import test from "node:test";
import { copyWorkspace, recoverWorkspace, shouldCheckpoint, type WorkspaceSnapshot } from "../lib/workspace-recovery.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, canApprove, canConfirmDate, editAction } from "../lib/receipt.ts";
import { recordSourceDecision, sourceReviewState, sourceReviewSummary } from "../lib/source-review.ts";
import { calendarText, checklistText, planExports, type ReceiptMeta } from "../lib/export.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";
import { clarificationCandidates } from "../lib/clarification.ts";
import { reviewScenario } from "../lib/samples.ts";

function setup(): WorkspaceSnapshot {
  const source = reviewScenario.source; const r = extractLocally(source);
  const actions = r.actions.map(a => ({ ...a, approved: true, dateConfirmed: canConfirmDate(a) }));
  const attention = r.attention.map((item, i) => recordSourceDecision(item, { kind: i === 0 ? "not_action" : i === 1 ? "clarify" : "linked", actionId: i === 2 ? actions[0].id : null, note: `Synthetic checked decision ${i + 1}` }, actions));
  return { source, title: "Reviewed practice notice", actions, attention, notes: r.notes, mode: "local", sampleId: null, restored: false, receiptId: "recovery-original", createdAt: new Date("2026-10-15T00:00:00Z") };
}
function fresh(): WorkspaceSnapshot {
  const source = "Submit the new application by January 2, 2033. OUTGOING_ONLY_MARKER."; const r = extractLocally(source);
  return { source, title: "Replacement notice", ...r, mode: "local", sampleId: null, restored: false, receiptId: "recovery-new", createdAt: new Date("2026-10-15T01:00:00Z") };
}
const meta = (s: WorkspaceSnapshot): ReceiptMeta => ({ mode: s.mode ?? "manual", title: s.title, createdAt: s.createdAt, receiptId: s.receiptId, notes: s.notes, attention: s.attention, restored: s.restored });
test("a recovery copy is detached from nested action, evidence, decision and timestamp mutations", () => {
  const original = setup(); const before = JSON.stringify(original); const copy = copyWorkspace(original);
  copy.actions[0].title = "Changed copy"; copy.actions[0].evidence[0].starts.push(99); copy.attention[0].decision!.note = "Changed note"; copy.notes.push("New note"); copy.createdAt.setUTCFullYear(2040);
  assert.equal(JSON.stringify(original), before); assert.ok(copy.createdAt instanceof Date);
});
test("source typing and an unreviewed first scan preserve the pre-edit review instead of replacing it", () => {
  const original = setup(); assert.equal(shouldCheckpoint(original, "source_edit"), true); assert.equal(shouldCheckpoint(original, "scan"), true);
  const draft = { ...fresh(), mode: null, actions: [], attention: [], notes: [] };
  assert.equal(shouldCheckpoint(draft, "source_edit"), false); assert.equal(shouldCheckpoint(draft, "scan"), false);
  assert.equal(shouldCheckpoint(draft, "replace"), true);
});
test("empty workspaces do not overwrite a useful copy, and flag-only reviews can be recovered", () => {
  const empty = { ...fresh(), source: "", title: "", actions: [], attention: [], notes: [], mode: null };
  for (const kind of ["replace", "scan", "source_edit"] as const) assert.equal(shouldCheckpoint(empty, kind), false);
  const s = setup(); assert.equal(shouldCheckpoint({ ...s, actions: [] }, "source_edit"), true);
});
test("recovery preserves committed content, omissions, provenance and stable IDs while clearing all review trust", () => {
  const old = setup(); old.actions[1] = { ...editAction(old.actions[1], { title: "Pay transport deposit after clarification", omitted: true }), approved: true, dateConfirmed: true };
  const before = JSON.stringify(old); const result = recoverWorkspace(fresh(), old); const s = result.workspace;
  assert.equal(s.source, old.source); assert.equal(s.title, old.title); assert.equal(s.receiptId, old.receiptId); assert.equal(s.createdAt.toISOString(), old.createdAt.toISOString());
  assert.deepEqual(s.actions.map(a => [a.id, a.title, a.condition, a.omitted, a.origin, a.dateOrigin]), old.actions.map(a => [a.id, a.title, a.condition, a.omitted, a.origin, a.dateOrigin]));
  assert.ok(s.actions.every(a => !a.approved && !a.dateConfirmed)); assert.deepEqual(s.notes, old.notes); assert.equal(JSON.stringify(old), before);
});
test("all recovered source choices need rechecking and clarification notes cannot masquerade as newly checked questions", () => {
  const s = recoverWorkspace(fresh(), setup()).workspace;
  assert.ok(s.attention.every(i => i.decision && !i.decision.confirmed && i.decision.actionSnapshot === null));
  assert.ok(s.attention.every(i => sourceReviewState(i, s.actions).code === "recheck"));
  assert.equal(sourceReviewSummary(s.attention, s.actions).addressed, 0);
  assert.ok(!clarificationCandidates(s.source, s.actions, s.attention).some(c => c.kind === "note"));
  const flag = s.attention[0]; const checked = recordSourceDecision(flag, { kind: "not_action", actionId: null, note: flag.decision!.note }, s.actions);
  assert.equal(sourceReviewState(checked, s.actions).addressed, true); assert.equal(flag.decision!.confirmed, false);
});
test("recovery recomputes evidence positions and unmatched action evidence stays unapprovable", () => {
  const old = setup(); old.actions[0].evidence[0].starts = [9999];
  const restored = recoverWorkspace(fresh(), old).workspace;
  assert.equal(restored.actions[0].evidence[0].starts[0], restored.source.indexOf(restored.actions[0].evidence[0].quote));
  const bad = copyWorkspace(old); bad.actions[0].evidence[0].quote = "A quotation absent from the notice";
  const unavailable = recoverWorkspace(fresh(), bad).workspace.actions[0]; assert.equal(unavailable.evidenceValid, false); assert.equal(canApprove(unavailable), false); assert.equal(calendarEligible({ ...unavailable, approved: true, dateConfirmed: true }), false);
});
test("recovered work stays out of both task exports until reviewed again, preserving calendar identity afterward", () => {
  const old = setup(); const original = calendarText(old.actions, meta(old)); const s = recoverWorkspace(fresh(), old).workspace;
  assert.equal(planExports(s.actions).checklist.length, 0); assert.equal(planExports(s.actions).calendar.length, 0);
  assert.ok(!checklistText(s.actions, meta(s)).includes("- [ ]")); assert.ok(!calendarText(s.actions, meta(s)).includes("BEGIN:VEVENT"));
  const checked = s.actions.map(a => ({ ...a, approved: true, dateConfirmed: canConfirmDate(a) }));
  const uids = (text: string) => text.split("\r\n").filter(line => line.startsWith("UID:"));
  assert.deepEqual(uids(calendarText(checked, meta(s))), uids(original));
});
test("restoring twice can recover outgoing work without accumulating warnings or restoring approvals", () => {
  let current = fresh(); let previous = setup(); const sizes = new Map([current, previous].map(s => [s.source, { notes: s.notes.length, actions: s.actions.length, issues: s.actions.map(a => a.issues.length) }]));
  for (let i = 0; i < 8; i++) {
    const result = recoverWorkspace(current, previous); current = result.workspace; previous = result.previous;
    const expected = sizes.get(current.source)!; assert.equal(current.notes.length, expected.notes); assert.equal(current.actions.length, expected.actions); assert.deepEqual(current.actions.map(a => a.issues.length), expected.issues);
    assert.ok(current.actions.every(a => !a.approved && !a.dateConfirmed)); assert.ok(current.attention.every(i => !i.decision?.confirmed));
  }
});
test("the outgoing recovery copy is excluded from review files and current Markdown/calendar exports", () => {
  const result = recoverWorkspace(fresh(), setup()); const s = result.workspace;
  assert.ok(result.previous.source.includes("OUTGOING_ONLY_MARKER"));
  const file = saveReviewFile({ source: s.source, actions: s.actions, meta: meta(s) });
  for (const text of [file, checklistText(s.actions, meta(s)), calendarText(s.actions, meta(s))]) assert.ok(!text.includes("OUTGOING_ONLY_MARKER"));
  assert.equal(JSON.parse(file).version, 2); assert.equal(JSON.parse(file).recoveryCopy, undefined);
  const loaded = openReviewFile(file); assert.equal(loaded.source, s.source); assert.ok(loaded.actions.every(a => !a.approved && !a.dateConfirmed));
});
test("imported provenance and source timed-cutoff safeguards survive recovery", () => {
  const source = "Submit the form by December 2, 2032 at 24:00 UTC-10:00."; const r = extractLocally(source);
  const loaded = openReviewFile(saveReviewFile({ source, actions: r.actions, meta: { ...meta(setup()), attention: r.attention, notes: r.notes } }));
  const old: WorkspaceSnapshot = { ...setup(), source, actions: loaded.actions, notes: loaded.meta.notes, attention: loaded.meta.attention!, mode: loaded.meta.mode, restored: true };
  const s = recoverWorkspace(fresh(), old).workspace; const a = s.actions[0];
  assert.equal(s.restored, true); assert.equal(a.origin, "imported"); assert.equal(a.dateOrigin, "review file"); assert.equal(a.sourceRequiresTime, true); assert.equal(a.requiresTime, true); assert.equal(canConfirmDate(a), false);
  assert.equal(editAction(a, { requiresTime: false }).requiresTime, true);
});
