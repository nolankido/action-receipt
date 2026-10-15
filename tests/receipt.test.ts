import test from "node:test";
import assert from "node:assert/strict";
import { samples } from "../lib/samples.ts";
import { calendarEligible, canApprove, canConfirmDate, editAction, explicitDates, locateEvidence, manualAction, resultIsCurrent, validDate, validOffset, validateExtraction } from "../lib/receipt.ts";
import { calendarText, checklistText, foldLine, type ReceiptMeta } from "../lib/export.ts";

const first = () => validateExtraction(samples[0].source, samples[0].result).actions;
const meta: ReceiptMeta = { mode: "sample", title: "Workshop", createdAt: new Date("2026-10-15T01:00:00Z"), receiptId: "test-receipt", notes: [] };
test("samples have matchable action and date quotations, but start unapproved", () => {
  for (const sample of samples) {
    const result = validateExtraction(sample.source, sample.result);
    assert.ok(result.actions.length);
    for (const a of result.actions) {
      assert.equal(a.evidenceValid, true, a.title);
      assert.ok(a.dateEvidence.every(e => e.starts.length > 0), a.title);
      assert.equal(a.approved, false); assert.equal(a.dateConfirmed, false); assert.equal(calendarEligible(a), false);
    }
  }
});
test("registration, payment and attendance retain their separate dates", () => {
  const actions = first(); assert.deepEqual(actions.map(a => a.date), ["2026-11-05", "2026-11-07", "2026-11-10", ""]);
  assert.match(actions[3].condition, /Only if/);
});
test("relative deadlines and conflicts are unresolved regardless of invented model date", () => {
  const sample = structuredClone(samples[0]); sample.result.actions[3].deadline.date = "2026-11-13";
  assert.equal(validateExtraction(sample.source, sample.result).actions[3].date, "");
  const conflict = validateExtraction(samples[2].source, samples[2].result).actions[0];
  assert.equal(conflict.date, ""); assert.equal(conflict.dateEvidence.length, 2);
});
test("fabricated action quotations block approval", () => {
  const result = structuredClone(samples[0].result); result.actions[0].evidence = ["This sentence never appeared."];
  const a = validateExtraction(samples[0].source, result).actions[0];
  assert.equal(a.evidenceValid, false); assert.equal(canApprove(a), false);
});
test("date not supported by its own quoted passage is not proposed", () => {
  const result = structuredClone(samples[0].result); result.actions[0].deadline.date = "2026-11-10";
  assert.equal(validateExtraction(samples[0].source, result).actions[0].date, "");
});
test("missing or fabricated date evidence needs a user date, while action evidence remains usable", () => {
  for (const evidence of [[], ["Invented date November 5, 2026"]]) {
    const result = structuredClone(samples[0].result); result.actions[0].deadline.evidence = evidence;
    const a = validateExtraction(samples[0].source, result).actions[0];
    assert.equal(a.date, ""); assert.equal(canApprove(a), true);
  }
});
test("exact matching preserves punctuation, finds repeats, and does not fabricate positions", () => {
  assert.deepEqual(locateEvidence("Pay today. Pay today.", "Pay today.").starts, [0, 11]);
  assert.deepEqual(locateEvidence("Pay today.", "Pay today!").starts, []);
});
test("calendar dates reject invalid days and unsupported incomplete formats", () => {
  assert.equal(validDate("2026-02-29"), false); assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-04-31"), false); assert.equal(validDate("2026-13-01"), false);
  assert.equal(validDate("11/5/26"), false);
  assert.deepEqual(explicitDates("November 5 and 11/05/2026"), []);
  assert.deepEqual(explicitDates("5 November 2026 and November 7, 2026"), ["2026-11-07", "2026-11-05"]);
});
test("stale responses cannot replace edited or newer source", () => {
  assert.equal(resultIsCurrent(1, 2, "old", "new"), false);
  assert.equal(resultIsCurrent(1, 1, "old", "new"), false);
  assert.equal(resultIsCurrent(2, 2, "same", "same"), true);
});
test("edits revoke approval and date edits also revoke date confirmation", () => {
  const a = { ...first()[0], approved: true, dateConfirmed: true };
  assert.equal(editAction(a, { title: "Edited action" }).approved, false);
  assert.equal(editAction(a, { title: "Edited action" }).dateConfirmed, true);
  const changed = editAction(a, { date: "2026-11-06" });
  assert.equal(changed.dateConfirmed, false); assert.equal(changed.approved, false); assert.equal(changed.dateOrigin, "user supplied");
});
test("explicit date confirmation is distinct from approval", () => {
  const a = first()[0]; assert.equal(calendarEligible({ ...a, approved: true }), false);
  assert.equal(calendarEligible({ ...a, dateConfirmed: true }), false);
  assert.equal(calendarEligible({ ...a, approved: true, dateConfirmed: true }), true);
});
test("user resolution unblocks a conflicting date while preserving original evidence and warnings", () => {
  const a = validateExtraction(samples[2].source, samples[2].result).actions[0];
  const resolved = { ...editAction(a, { date: "2026-12-08" }), approved: true, dateConfirmed: true };
  assert.equal(calendarEligible(resolved), true); assert.ok(resolved.issues.some(i => /conflict/.test(i)));
  const text = checklistText([resolved], meta); assert.match(text, /user supplied/); assert.match(text, /December 11/); assert.match(text, /Original review flag/);
});
test("timed deadlines need time and offset; offset range is checked", () => {
  const a = validateExtraction(samples[1].source, samples[1].result).actions[1];
  assert.equal(a.requiresTime, true); assert.equal(canConfirmDate(a), false);
  assert.equal(canConfirmDate({ ...a, utcOffset: "-10:00" }), true);
  for (const bad of ["-15:00", "+14:01", "+01:60", "-00:00", "Pacific/Honolulu", "EST"]) assert.equal(validOffset(bad), false);
});
test("invented original deadline wording is replaced with actual quoted source", () => {
  const raw = structuredClone(samples[0].result); raw.actions[0].deadline.text = "Urgent: pay a late penalty tomorrow";
  const a = validateExtraction(samples[0].source, raw).actions[0];
  assert.equal(a.deadlineText, "Register using the club form by November 5, 2026.");
  assert.ok(a.issues.some(i => /not verbatim/.test(i)));
});
test("user can add a missed cutoff; a detected source cutoff cannot silently become a day marker", () => {
  const initial = { ...first()[0], approved: true, dateConfirmed: true };
  const timed = editAction(initial, { requiresTime: true, time: "17:00", utcOffset: "-10:00" });
  assert.equal(timed.approved, false); assert.equal(timed.dateConfirmed, false); assert.equal(timed.dateOrigin, "user supplied");
  assert.equal(canConfirmDate(timed), true);
  const sourceTimed = validateExtraction(samples[1].source, samples[1].result).actions[1];
  assert.equal(editAction(sourceTimed, { requiresTime: false }).requiresTime, true);
});
test("both export formats preserve wording, condition and time corrections", () => {
  const changed = { ...editAction(first()[0], { title: "Register, after checking eligibility", condition: "Only if eligible", requiresTime: true, time: "17:00", utcOffset: "-10:00" }), approved: true, dateConfirmed: true };
  const ics = calendarText([changed], meta).replace(/\r\n /g, "");
  for (const output of [ics, checklistText([changed], meta)]) {
    assert.match(output, /Original proposed action/); assert.match(output, /Original condition/); assert.match(output, /wording edited by user/); assert.match(output, /time or offset edited by user/);
  }
});
test("unapproved, omitted and unsupported actions never enter exports", () => {
  const a = first()[0]; const actions = [a, { ...a, id: "omitted", approved: true, omitted: true }, { ...a, id: "bad", approved: true, evidenceValid: false }];
  assert.equal(calendarText(actions, meta).includes("BEGIN:VEVENT"), false);
  assert.equal(checklistText(actions, meta).includes("- [ ]"), false);
});
test("unresolved approved items stay in checklist, with no invented calendar date", () => {
  const a = { ...first()[3], approved: true };
  const text = checklistText([a], meta); assert.match(text, /next Friday/); assert.match(text, /Unresolved/); assert.match(text, /Only if/);
  assert.equal(calendarText([a], meta).includes("BEGIN:VEVENT"), false);
});
test("all-day calendar entry uses an exclusive next-day end and contains sample provenance", () => {
  const a = { ...first()[0], approved: true, dateConfirmed: true };
  const text = calendarText([a], meta);
  assert.match(text, /DTSTART;VALUE=DATE:20261105\r\nDTEND;VALUE=DATE:20261106/);
  assert.match(text.replace(/\r\n /g, ""), /SYNTHETIC SAMPLE WALKTHROUGH/);
  assert.ok(text.endsWith("END:VCALENDAR\r\n")); assert.ok(!text.includes("BEGIN:VALARM"));
});
test("timed calendar cutoff is converted to UTC with no fabricated duration", () => {
  const a = { ...first()[0], date: "2026-11-05", requiresTime: true, time: "17:30", utcOffset: "-10:00", approved: true, dateConfirmed: true };
  const text = calendarText([a], meta); assert.match(text, /DTSTART:20261106T033000Z/); assert.ok(!text.includes("DTEND")); assert.ok(!text.includes("DURATION"));
});
test("calendar text escapes injection and folds UTF-8 by bytes without splitting characters", () => {
  const a = { ...first()[0], title: "Task\r\nBEGIN:VEVENT,with;punctuation", approved: true, dateConfirmed: true };
  const text = calendarText([a], meta); assert.equal((text.match(/\r\nBEGIN:VEVENT\r\n/g) ?? []).length, 1);
  assert.match(text, /SUMMARY:Task\\nBEGIN:VEVENT\\,with\\;punctuation/);
  const folded = foldLine("DESCRIPTION:" + "🎓".repeat(50));
  for (const line of folded.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75);
  assert.equal(folded.replace(/\r\n /g, ""), "DESCRIPTION:" + "🎓".repeat(50));
});
test("user-added actions require exact source evidence and start unapproved", () => {
  const a = manualAction(samples[0].source, "Register", "Register using the club form by November 5, 2026.", "Only if attending", 1);
  assert.equal(a.origin, "user"); assert.equal(a.evidenceValid, true); assert.equal(a.approved, false); assert.equal(a.date, ""); assert.equal(a.id, "manual-1");
  assert.throws(() => manualAction(samples[0].source, "Invented action", "An invented quotation.", "", 2), /exact supporting passage/);
  assert.throws(() => manualAction(samples[0].source, " ", "Register", "", 3), /short action/);
});
test("manual timed actions preserve cutoff requirements and manual provenance in downloads", () => {
  const a = manualAction(samples[1].source, "Upload budget", "Upload your budget by December 2, 2026 at 5:00 pm.", "", 1);
  assert.equal(a.sourceRequiresTime, true);
  const reviewed = { ...editAction(a, { date: "2026-12-02", time: "17:00", utcOffset: "-10:00" }), dateConfirmed: true, approved: true };
  const manualMeta = { ...meta, mode: "manual" as const };
  assert.equal(calendarEligible(reviewed), true);
  for (const output of [checklistText([reviewed], manualMeta), calendarText([reviewed], manualMeta).replace(/\r\n /g, "")]) {
    assert.match(output, /Manual review/); assert.match(output, /Added by user from source/); assert.match(output, /no AI extraction/);
  }
});
test("long manual passages retain full evidence and detected date-conflict warnings", () => {
  const quote = "Register by November 5, 2026. " + "Read all conditions carefully. ".repeat(25) + "The same form says November 7, 2026.";
  assert.ok(quote.length > 600 && quote.length <= 1200);
  const a = manualAction(quote, "Register", quote, "", 2);
  assert.equal(a.evidence[0].quote, quote); assert.equal(a.date, "");
  assert.ok(a.issues.some(issue => /conflicting/.test(issue)));
  assert.match(checklistText([{ ...a, approved: true }], { ...meta, mode: "manual" }), /conflicting date/);
});
