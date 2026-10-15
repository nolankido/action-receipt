import assert from "node:assert/strict";
import test from "node:test";
import { cutoffFitsCalendar, mentionsTime, parseClock } from "../lib/times.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, canConfirmDate, editAction } from "../lib/receipt.ts";
import { calendarText, checklistText, planExports, reviewedDateText, type ReceiptMeta } from "../lib/export.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";
import { clarificationCandidates } from "../lib/clarification.ts";

const meta: ReceiptMeta = { mode: "local", title: "Synthetic cutoff notice", createdAt: new Date("2026-10-15T00:00:00Z"), receiptId: "cutoff", notes: [] };
const notice = (clock: string) => `Submit the form by December 2, 2032 at ${clock} UTC-10:00.`;
test("explicit HH:MM times normalize without treating offsets as additional clocks", () => {
  for (const value of ["00:00", "05:00", "12:00", "17:00", "23:59"]) assert.equal(parseClock(`${value} UTC-10:00 (GMT-10:00)`), value);
  assert.equal(parseClock("5 pm UTC-10:00"), "17:00"); assert.equal(parseClock("12 am UTC+00:00"), "00:00"); assert.equal(parseClock("noon UTC+00:00"), "12:00");
  assert.equal(parseClock("UTC-10:00"), null); assert.equal(mentionsTime("UTC-10:00 (GMT+14:00)"), false);
});
test("malformed clocks remain timed and cannot silently become all-day calendar entries", () => {
  for (const clock of ["24:00", "29:00", "17:78", "17:7", "17:000", "123:456", "0 pm", "13:00 pm"]) {
    const a = extractLocally(notice(clock)).actions[0];
    assert.equal(a.sourceRequiresTime, true, clock); assert.equal(a.requiresTime, true, clock); assert.equal(a.time, "", clock);
    assert.equal(canConfirmDate(a), false, clock); assert.equal(calendarEligible({ ...a, approved: true, dateConfirmed: true }), false, clock);
    assert.ok(!calendarText([{ ...a, approved: true, dateConfirmed: true }], meta).includes("BEGIN:VEVENT"), clock);
  }
});
test("seconds, fractional precision and bare single-digit clocks are never shortened or guessed", () => {
  for (const clock of ["17:00:30", "17:00:00", "17:00.5", "5:00:30 pm", "5:00", "midnight"]) {
    assert.equal(parseClock(clock), null, clock);
    const a = extractLocally(notice(clock)).actions[0]; assert.equal(a.time, "", clock); assert.equal(a.requiresTime, true, clock); assert.equal(canConfirmDate(a), false, clock);
  }
});
test("different 24-hour clocks and mixed clock families stay unresolved even when values coincide", () => {
  for (const clock of ["17:00 or 18:00", "5 pm or 17:00", "noon or 12:00", "17:00 or midnight"]) {
    assert.equal(parseClock(clock), null); const a = extractLocally(notice(clock)).actions[0]; assert.equal(a.time, ""); assert.equal(a.requiresTime, true);
  }
  assert.equal(parseClock("17:00 (17:00) UTC-10:00"), "17:00");
});
test("a fresh 24-hour cutoff still needs separate confirmation and approval and exports the exact UTC instant", () => {
  const source = notice("17:00"); const a = extractLocally(source).actions[0]; const before = JSON.stringify(a);
  assert.equal(a.time, "17:00"); assert.equal(a.utcOffset, "-10:00"); assert.equal(canConfirmDate(a), true); assert.equal(calendarEligible(a), false);
  assert.equal(clarificationCandidates(source, [a], []).length, 0);
  const ready = { ...a, approved: true, dateConfirmed: true }; const text = calendarText([ready], meta).replace(/\r\n /g, "");
  assert.match(text, /DTSTART:20321203T030000Z/); assert.ok(!text.includes("DTSTART;VALUE=DATE")); assert.match(text, /17:00 UTC-10:00/);
  assert.equal(JSON.stringify(a), before); assert.equal(planExports([ready]).calendar.length, 1);
});
test("a 24-hour clock without a zone stays checklist-only and asks only for the missing offset", () => {
  const source = "Upload your budget by December 2, 2032 at 17:00."; const a = extractLocally(source).actions[0];
  assert.equal(a.time, "17:00"); assert.equal(a.utcOffset, ""); assert.equal(canConfirmDate(a), false);
  const [question] = clarificationCandidates(source, [a], []); assert.match(question.question, /UTC offset/); assert.ok(!question.question.includes("cutoff time"));
  assert.equal(planExports([{ ...a, approved: true }]).checklist.length, 1); assert.equal(planExports([{ ...a, approved: true }]).calendar.length, 0);
});
test("condition and later-clause clocks, including malformed clocks, do not become deadline cutoffs", () => {
  for (const clock of ["17:00", "24:00"]) {
    for (const source of [`If you attended the ${clock} UTC-10:00 briefing, submit your form by December 2, 2032.`, `Submit your form by December 2, 2032; the office opens at ${clock} UTC-10:00.`]) {
      const a = extractLocally(source).actions[0]; assert.equal(a.date, "2032-12-02"); assert.equal(a.time, ""); assert.equal(a.requiresTime, false);
    }
  }
  const a = extractLocally("Register for the 17:00 UTC-10:00 briefing by December 2, 2032.").actions[0];
  assert.equal(a.time, ""); assert.ok(a.issues.some(i => /outside a recognized deadline clause/.test(i)));
});
test("saved malformed-clock actions retain an independently recomputed cutoff guard after metadata removal", () => {
  for (const clock of ["24:00", "17:78", "17:7"]) {
    const source = notice(clock); const a = extractLocally(source).actions[0]; const file = JSON.parse(saveReviewFile({ source, actions: [a], meta }));
    Object.assign(file.actions[0], { requiresTime: false, time: "", utcOffset: "", dateEvidence: [], deadlineText: "" });
    const restored = openReviewFile(JSON.stringify(file)).actions[0]; assert.equal(restored.sourceRequiresTime, true); assert.equal(restored.requiresTime, true);
    assert.equal(editAction(restored, { requiresTime: false }).requiresTime, true); assert.equal(canConfirmDate(restored), false);
  }
});
test("manual clarification restores a malformed cutoff's eligibility without erasing original source or warnings", () => {
  const a = extractLocally(notice("24:00")).actions[0]; const edited = editAction(a, { time: "17:00", utcOffset: "-10:00" });
  assert.equal(edited.approved, false); assert.equal(edited.dateConfirmed, false); assert.equal(edited.dateOrigin, "user supplied");
  const ready = { ...edited, approved: true, dateConfirmed: true }; assert.equal(calendarEligible(ready), true);
  for (const text of [checklistText([ready], meta), calendarText([ready], meta).replace(/\r\n /g, "")]) { assert.match(text, /24:00/); assert.match(text, /conflicting or unsupported/); assert.match(text, /user supplied/); }
});
test("UTC conversion cannot emit an expanded year into a four-digit iCalendar date-time", () => {
  assert.equal(cutoffFitsCalendar("9999-12-31", "23:00", "-14:00"), false);
  assert.equal(cutoffFitsCalendar("9999-12-31", "09:00", "-14:00"), true);
  assert.equal(cutoffFitsCalendar("1000-01-01", "00:00", "+14:00"), true);
  const a = extractLocally("Submit your report by 9999-12-31 at 23:00 UTC-14:00.").actions[0]; const ready = { ...a, approved: true, dateConfirmed: true };
  assert.equal(canConfirmDate(a), false); assert.equal(planExports([ready]).calendar.length, 0); assert.match(planExports([ready]).notInCalendar[0].reason, /supported calendar range/);
  assert.match(reviewedDateText(ready), /Unresolved/); assert.ok(!calendarText([ready], meta).includes("+010000"));
});
test("an out-of-range cutoff produces a useful clarification rather than a blank list of missing fields", () => {
  const source = "Submit your report by 9999-12-31 at 23:00 UTC-14:00."; const a = extractLocally(source).actions[0]; const [question] = clarificationCandidates(source, [a], []);
  assert.match(question.question, /calendar date, cutoff time and UTC offset/); assert.match(question.question, /supported calendar range/); assert.ok(!question.question.includes("confirm the  and"));
});
test("editing a reviewed 24-hour cutoff revokes trust and restored values require fresh checks", () => {
  const source = notice("17:00"); const a = { ...extractLocally(source).actions[0], approved: true, dateConfirmed: true };
  const edited = editAction(a, { time: "18:00" }); assert.equal(edited.approved, false); assert.equal(edited.dateConfirmed, false); assert.equal(calendarEligible(edited), false);
  const restored = openReviewFile(saveReviewFile({ source, actions: [a], meta })).actions[0];
  assert.equal(restored.time, "17:00"); assert.equal(restored.approved, false); assert.equal(restored.dateConfirmed, false); assert.equal(calendarEligible(restored), false);
});
