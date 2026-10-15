import test from "node:test";
import assert from "node:assert/strict";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, canConfirmDate, editAction } from "../lib/receipt.ts";
import { calendarText, checklistText } from "../lib/export.ts";

const meta = { mode: "local" as const, title: "Fresh test notice", receiptId: "fresh", createdAt: new Date("2026-10-15T00:00:00Z"), notes: [] };
test("fresh unseen text gets separate source-linked actions without saved lookup or a model", () => {
  const source = "Register for the telescope session by March 3, 2031. Pay the equipment deposit by March 7, 2031.";
  const result = extractLocally(source);
  assert.equal(result.actions.length, 2);
  assert.deepEqual(result.actions.map(a => a.date), ["2031-03-03", "2031-03-07"]);
  for (const a of result.actions) { assert.equal(a.origin, "rules"); assert.equal(a.evidenceValid, true); assert.equal(a.approved, false); assert.equal(a.dateConfirmed, false); assert.ok(source.includes(a.evidence[0].quote)); }
});
test("relative dates, missing years and ambiguous numeric dates stay unresolved", () => {
  for (const wording of ["next Friday", "tomorrow", "within seven days of receipt", "April 9", "04/09/2031"]) {
    const a = extractLocally(`Submit the astronomy proposal by ${wording}.`).actions[0];
    assert.equal(a.date, ""); assert.equal(calendarEligible({ ...a, approved: true }), false);
  }
});
test("event dates and dates in other sentences are never borrowed as registration deadlines", () => {
  const event = extractLocally("Register for the workshop on August 4, 2031. Registration instructions follow separately.");
  assert.equal(event.actions[0].date, "");
  const separate = extractLocally("Applications close on August 6, 2031. Use the online form to apply. The printed deadline says August 9, 2031.");
  assert.equal(separate.actions[0].date, ""); assert.ok(separate.notes.some(n => /August 6/.test(n) && /August 9/.test(n)));
});
test("conditional and optional instructions retain qualifications; negation does not become a payment", () => {
  const source = "If you need a locker, email the coordinator by June 6, 2031. Optional: Upload a sketch by June 7, 2031. You do not need to pay a fee. Do not submit the withdrawn form.";
  const actions = extractLocally(source).actions;
  assert.equal(actions.length, 2); assert.match(actions[0].condition, /If you need a locker/); assert.match(actions[1].condition, /Optional/i);
  assert.ok(!actions.some(a => /pay|withdrawn/.test(a.title)));
});
test("a passage with multiple instructions cannot assign one deadline automatically", () => {
  const a = extractLocally("Register by May 5, 2031 and pay the deposit by May 7, 2031.").actions[0];
  assert.equal(a.date, ""); assert.ok(a.issues.some(i => /several actions/.test(i)));
});
test("timed cutoffs need a valid clock and explicit offset, and still need human confirmation", () => {
  const a = extractLocally("Send your report by July 2, 2031 at 5:00 pm UTC-10:00.").actions[0];
  assert.equal(a.time, "17:00"); assert.equal(a.utcOffset, "-10:00"); assert.equal(canConfirmDate(a), true); assert.equal(calendarEligible(a), false);
  for (const clock of ["17:00", "midnight", "5:00 pm"]) {
    const b = extractLocally(`Complete your orientation by July 2, 2031 at ${clock}.`).actions[0];
    assert.equal(b.requiresTime, true); assert.equal(canConfirmDate(b), false);
  }
});
test("local mode and action origin survive both exports with the same approval rules", () => {
  const a = extractLocally("Print your transit permit by September 4, 2031.").actions[0];
  assert.equal(calendarText([a], meta).includes("BEGIN:VEVENT"), false);
  const reviewed = { ...a, approved: true, dateConfirmed: true };
  for (const output of [checklistText([reviewed], meta), calendarText([reviewed], meta).replace(/\r\n /g, "")]) { assert.match(output, /Local text rules/); assert.match(output, /no AI model or API/); assert.match(output, /Print your transit permit/); }
  assert.equal(editAction(reviewed, { date: "2031-09-05" }).approved, false);
});
test("unsupported prose, overlong passages and the action cap fail conservatively", () => {
  const prose = extractLocally("The society is excited about the coming semester. We hope to see everyone soon."); assert.equal(prose.actions.length, 0);
  const long = extractLocally("Submit " + "your notes ".repeat(120) + "by May 1, 2031."); assert.equal(long.actions.length, 0); assert.ok(long.notes.some(n => /long passage/.test(n)));
  const many = extractLocally(Array.from({ length: 25 }, (_, n) => `Submit document ${n + 1} by May 1, 2031.`).join("\n")); assert.equal(many.actions.length, 20); assert.ok(many.notes.some(n => /20-action/.test(n)));
  assert.throws(() => extractLocally("too short"), /30 to/);
});
test("non-temporal by/before phrases cannot turn an event date into a deadline", () => {
  for (const ending of ["using the form provided by Student Affairs", "before attending the orientation"]) {
    const a = extractLocally(`Register for the workshop on November 10, 2031 ${ending}.`).actions[0];
    assert.equal(a.date, ""); assert.ok(a.title.includes(ending));
  }
});
test("trailing waiver and attendance conditions survive shortened action wording and exports", () => {
  for (const condition of ["unless you have a waiver", "only if you plan to attend"]) {
    const a = extractLocally(`Pay the fee by December 2, 2031 ${condition}.`).actions[0];
    assert.equal(a.title, "Pay the fee"); assert.equal(a.condition, condition);
    assert.ok(checklistText([{ ...a, approved: true }], meta).includes(condition));
  }
});
test("an adjacent explicit cancellation referring back suppresses the earlier proposal", () => {
  const r = extractLocally("Pay the fee by December 2, 2031. This payment request has been cancelled.");
  assert.equal(r.actions.length, 0); assert.ok(r.notes.some(n => /cancellation/.test(n)));
});
