import assert from "node:assert/strict";
import test from "node:test";
import { explicitOffset, parseClock } from "../lib/times.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, canConfirmDate, editAction } from "../lib/receipt.ts";
import { calendarText, checklistText, type ReceiptMeta } from "../lib/export.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";
import { clarificationCandidates } from "../lib/clarification.ts";

const meta: ReceiptMeta = { mode: "local", title: "Offset boundary fixture", receiptId: "offset-integrity", createdAt: new Date("2026-10-15T00:00:00Z"), notes: [] };
const sourceFor = (offset: string) => `Pay the deposit by November 8, 2032 at 17:00 ${offset}.`;
test("unsupported offset precision and suffixes cannot become a valid-looking prefix", () => {
  for (const offset of ["UTC-10:00:30", "UTC-10:00:00", "UTC-10:00.5", "UTC-10:00,5", "UTC+02:00Z", "UTC+02:00extra", "UTC+01:000", "UTC−10:00"]) {
    assert.equal(explicitOffset(`17:00 ${offset}.`), null, offset);
    const a = extractLocally(sourceFor(offset)).actions[0];
    assert.equal(a.utcOffset, "", offset); assert.equal(a.requiresTime, true);
    assert.equal(canConfirmDate(a), false); assert.equal(calendarEligible({ ...a, approved: true, dateConfirmed: true }), false);
    assert.ok(!calendarText([{ ...a, approved: true, dateConfirmed: true }], meta).includes("BEGIN:VEVENT"));
  }
});
test("a valid offset cannot hide a second malformed or incomplete zone mention", () => {
  for (const extra of ["GMT+09", "GMT+9:00", "GMT+09:00:00", "GMT", "UTC+15:00"]) {
    const text = `17:00 UTC-10:00 and ${extra}.`;
    assert.equal(explicitOffset(text), null, extra);
    assert.equal(extractLocally(sourceFor(`UTC-10:00 and ${extra}`)).actions[0].utcOffset, "");
  }
});
test("complete equal offsets tolerate sentence punctuation and retain the actual cutoff", () => {
  for (const text of ["17:00 UTC-10:00.", "17:00 (GMT-10:00)", '17:00 "UTC-10:00"', "17:00 UTC -10:00, GMT-10:00", "17:00 UTC-10:00..."]) {
    assert.equal(explicitOffset(text), "-10:00", text); assert.equal(parseClock(text), "17:00", text);
  }
  assert.equal(explicitOffset("17:00 UTC-10:00 or GMT-09:00"), null);
});
test("unsupported offsets ask for clarification and a deliberate correction keeps the original wording", () => {
  const source = sourceFor("UTC-10:00:30"); const a = extractLocally(source).actions[0];
  assert.equal(a.time, "17:00");
  const [question] = clarificationCandidates(source, [a], []);
  assert.match(question.question, /UTC offset/); assert.ok(!question.question.includes("cutoff time"));
  const corrected = editAction(a, { utcOffset: "-10:00" });
  assert.equal(corrected.approved, false); assert.equal(corrected.dateConfirmed, false);
  const checked = { ...corrected, approved: true, dateConfirmed: true };
  assert.match(calendarText([checked], meta), /DTSTART:20321109T030000Z/);
  for (const text of [checklistText([checked], meta), calendarText([checked], meta).replace(/\r\n /g, "")]) {
    assert.match(text, /UTC-10:00:30/); assert.match(text, /user supplied/);
  }
  const loaded = openReviewFile(saveReviewFile({ source, actions: [checked], meta })).actions[0];
  assert.equal(loaded.approved, false); assert.equal(loaded.dateConfirmed, false); assert.equal(loaded.requiresTime, true);
});
