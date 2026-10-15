import test from "node:test";
import assert from "node:assert/strict";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarText, checklistText } from "../lib/export.ts";
import { canApprove, canConfirmDate, editAction, manualAction, nextManualNumber } from "../lib/receipt.ts";
import { MAX_REVIEW_BYTES, openReviewFile, saveReviewFile } from "../lib/review-file.ts";

function review() {
  const source = "Submit your design by May 3, 2032. Pay the deposit by May 4, 2032 unless you have a waiver. The orientation deadline is May 6, 2032.";
  const result = extractLocally(source);
  const actions = result.actions.map((a, i) => ({ ...editAction(a, { title: i ? a.title : "Submit the final design", date: i ? a.date : "2032-05-02" }), approved: true, dateConfirmed: true, omitted: i === 1 }));
  const meta = { mode: "local" as const, title: "Design review", receiptId: "receipt-123", createdAt: new Date("2026-10-15T00:00:00.000Z"), notes: result.notes, attention: result.attention };
  return { source, actions, meta };
}
function file() { return JSON.parse(saveReviewFile(review())); }
test("review round trip preserves source, edits, omissions and context while resetting every approval", () => {
  const original = review(); const saved = saveReviewFile(original); const loaded = openReviewFile(saved);
  assert.equal(loaded.source, original.source); assert.equal(loaded.meta.title, original.meta.title); assert.equal(loaded.meta.receiptId, original.meta.receiptId);
  assert.equal(loaded.meta.createdAt.toISOString(), original.meta.createdAt.toISOString()); assert.equal(loaded.meta.restored, true);
  assert.equal(loaded.actions[0].title, "Submit the final design"); assert.equal(loaded.actions[0].date, "2032-05-02"); assert.equal(loaded.actions[1].omitted, true);
  assert.deepEqual(loaded.meta.notes, original.meta.notes); assert.equal(loaded.meta.attention?.[0].evidence.quote, original.meta.attention[0].evidence.quote);
  for (const action of loaded.actions) { assert.equal(action.origin, "imported"); assert.equal(action.approved, false); assert.equal(action.dateConfirmed, false); assert.equal(action.evidenceValid, true); assert.ok(action.evidence.every(e => e.starts.length > 0)); }
  const json = JSON.parse(saved); assert.equal(json.actions[0].approved, undefined); assert.equal(json.actions[0].dateConfirmed, undefined); assert.equal(json.actions[0].evidence[0].starts, undefined);
});
test("loaded work creates no tasks or events until reapproved and retains import labeling afterward", () => {
  const loaded = openReviewFile(saveReviewFile(review()));
  assert.equal(checklistText(loaded.actions, loaded.meta).includes("- [ ]"), false); assert.equal(calendarText(loaded.actions, loaded.meta).includes("BEGIN:VEVENT"), false);
  const approved = [{ ...loaded.actions[0], approved: true, dateConfirmed: true }];
  const calendar = calendarText(approved, loaded.meta).replace(/\r\n /g, "");
  for (const text of [calendar, checklistText(approved, loaded.meta)]) { assert.match(text, /Imported review file/); assert.match(text, /unverified/); }
  assert.match(calendar, /UID:receipt-123-r1-a1@actionreceipt.local/);
});
test("fabricated evidence, duplicate IDs and injected trust fields are rejected without mutating prior work", () => {
  const original = review(); const before = JSON.stringify(original);
  for (const modify of [(f: any) => { f.actions[0].evidence[0] = "Invented quotation"; }, (f: any) => { f.actions[1].id = f.actions[0].id; }, (f: any) => { f.actions[0].approved = true; }, (f: any) => { f.actions[0].dateConfirmed = true; }, (f: any) => { f.actions[0].evidence = [{ quote: f.actions[0].evidence[0], starts: [0] }]; }]) {
    const f = file(); modify(f); assert.throws(() => openReviewFile(JSON.stringify(f)), /current review has not been changed/);
  }
  assert.equal(JSON.stringify(original), before);
});
test("unsupported versions, unknown fields, invalid timestamps and hostile IDs fail with readable errors", () => {
  for (const modify of [(f: any) => { f.version = 2; }, (f: any) => { f.unexpected = "secret detail"; }, (f: any) => { f.createdAt = "+010000-01-01T00:00:00.000Z"; }, (f: any) => { f.receiptId = "id\r\nBEGIN:VEVENT"; }]) {
    const f = file(); modify(f); assert.throws(() => openReviewFile(JSON.stringify(f)), error => error instanceof Error && /current review has not been changed/.test(error.message) && !error.message.includes("secret detail"));
  }
  assert.throws(() => openReviewFile("not json"), /supported Action Receipt/);
});
test("the file limit measures UTF-8 bytes, and source/action count bounds remain enforced", () => {
  const oversized = "é".repeat(MAX_REVIEW_BYTES / 2 + 1); assert.ok(oversized.length < MAX_REVIEW_BYTES); assert.throws(() => openReviewFile(oversized), /1 MB/);
  for (const modify of [(f: any) => { f.source = "x".repeat(15001); }, (f: any) => { f.actions = Array.from({ length: 21 }, (_, i) => ({ ...f.actions[0], id: `item-${i}` })); }]) {
    const f = file(); modify(f); assert.throws(() => openReviewFile(JSON.stringify(f)), /supported Action Receipt/);
  }
});
test("incomplete edits survive recovery without making their dates eligible", () => {
  const original = review(); original.actions[0] = editAction(original.actions[0], { title: "", requiresTime: true, time: "1", utcOffset: "-1" });
  const loaded = openReviewFile(saveReviewFile(original)); assert.equal(loaded.actions[0].title, ""); assert.equal(canApprove(loaded.actions[0]), false); assert.equal(loaded.actions[0].time, "1"); assert.equal(loaded.actions[0].utcOffset, "-1"); assert.equal(canConfirmDate(loaded.actions[0]), false);
});
test("repeated save/open cycles keep warnings bounded and replace unsupported deadline wording with source", () => {
  const f = file(); f.actions[0].deadlineText = "An invented fee is due tomorrow";
  let current = openReviewFile(JSON.stringify(f)); const warningCount = current.actions[0].issues.length;
  assert.ok(!current.actions[0].deadlineText.includes("invented fee"));
  for (let n = 0; n < 8; n++) current = openReviewFile(saveReviewFile(current));
  assert.equal(current.actions[0].issues.length, warningCount); assert.equal(current.actions[0].approved, false);
  assert.doesNotThrow(() => openReviewFile("\uFEFF" + saveReviewFile(current)));
});
test("source cutoff guards are recomputed from matched evidence, not file booleans", () => {
  const source = "Upload your project budget by May 3, 2032 at 5 pm.";
  const result = extractLocally(source); const base = review();
  const f = JSON.parse(saveReviewFile({ source, actions: result.actions, meta: { ...base.meta, notes: result.notes, attention: result.attention } }));
  f.actions[0].requiresTime = false; f.actions[0].time = ""; f.actions[0].utcOffset = "";
  const a = openReviewFile(JSON.stringify(f)).actions[0]; assert.equal(a.sourceRequiresTime, true); assert.equal(a.requiresTime, true); assert.equal(canConfirmDate(a), false);
  f.actions[0].dateEvidence = []; f.actions[0].deadlineText = "";
  const stripped = openReviewFile(JSON.stringify(f)).actions[0]; assert.equal(stripped.sourceRequiresTime, true); assert.equal(canConfirmDate(stripped), false);
});
test("restoring a condition-only clock preserves its scope while unfamiliar timed quotations stay guarded", () => {
  const source = "If your shift ends at 5 pm, submit your report by May 3, 2032.";
  const result = extractLocally(source); const base = review();
  const loaded = openReviewFile(saveReviewFile({ source, actions: result.actions, meta: { ...base.meta, notes: result.notes, attention: result.attention } }));
  assert.equal(loaded.actions[0].requiresTime, false); assert.equal(canConfirmDate(loaded.actions[0]), true);
  const manual = manualAction(source, "Check the shift", "your shift ends at 5 pm", "", 1);
  const f = JSON.parse(saveReviewFile({ ...base, source, actions: [manual], meta: { ...base.meta, attention: [] } }));
  Object.assign(f.actions[0], { date: "2032-05-03", requiresTime: false, dateEvidence: [], deadlineText: "" });
  const restored = openReviewFile(JSON.stringify(f)).actions[0]; assert.equal(restored.sourceRequiresTime, true); assert.equal(canConfirmDate(restored), false);
});
test("imported dates and wording differences are not attributed to the current reviewer", () => {
  const f = file(); f.actions[0].originalTime = "12:00";
  const loaded = openReviewFile(JSON.stringify(f)); assert.equal(loaded.actions[0].dateOrigin, "review file");
  const approved = [{ ...loaded.actions[0], approved: true, dateConfirmed: true }];
  for (const output of [checklistText(approved, loaded.meta), calendarText(approved, loaded.meta).replace(/\r\n /g, "")]) {
    assert.match(output, /Date provenance: review file/); assert.match(output, /Prior action metadata/); assert.doesNotMatch(output, /edited by user|user supplied/);
  }
  const edited = editAction(loaded.actions[0], { date: "2032-05-01" }); assert.equal(edited.dateOrigin, "user supplied");
});
test("new manual actions cannot collide with loaded action IDs", () => {
  const r = review(); const a = manualAction(r.source, "Submit", "Submit your design by May 3, 2032.", "", 1);
  const b = { ...a, id: "manual-3" }; const id = nextManualNumber([a, b]); assert.equal(id, 2); assert.equal(nextManualNumber([]), 1);
});
test("disabling an optional cutoff clears inactive time fields and revokes date confirmation", () => {
  const a = review().actions[0]; const timed = { ...editAction(a, { requiresTime: true, time: "17:00", utcOffset: "-10:00" }), approved: true, dateConfirmed: true };
  const day = editAction(timed, { requiresTime: false }); assert.equal(day.requiresTime, false); assert.equal(day.time, ""); assert.equal(day.utcOffset, ""); assert.equal(day.approved, false); assert.equal(day.dateConfirmed, false);
});
