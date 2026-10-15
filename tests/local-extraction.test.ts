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
  assert.equal(a.date, ""); assert.match(a.title, /and pay the deposit/); assert.ok(a.issues.some(i => /several actions/.test(i)));
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
test("all unlinked date passages and unsupported obligations get exact, source-linked review entries", () => {
  const quotes = ["Applications close on May 3, 2032.", "The printed form says May 5, 2032.", "The website says May 7, 2032.", "You must attach a signed guardian letter."];
  const source = quotes.join("\n"); const r = extractLocally(source, 4);
  assert.equal(r.actions.length, 0); assert.equal(r.attention.length, 4);
  assert.deepEqual(r.attention.map(item => item.evidence.quote), quotes);
  for (const item of r.attention) { assert.ok(item.evidence.starts.length > 0); assert.ok(source.includes(item.evidence.quote)); assert.match(item.id, /review-r4-p/); }
  assert.match(r.attention[3].reason, /outside the supported patterns/);
});
test("negation and adjacent cancellation are visible review context, never silent omissions", () => {
  const r = extractLocally("Pay the deposit by May 3, 2032. This payment request has been cancelled. You do not need to submit a new form.");
  assert.equal(r.actions.length, 0); assert.equal(r.attention.length, 3);
  assert.match(r.attention[0].reason, /withdraw/); assert.match(r.attention[1].reason, /Negation/);
});
test("the proposal and review-list caps report every omitted part of their bounded results", () => {
  const make = (n: number) => Array.from({ length: n }, (_, i) => `Submit document ${i + 1} by May 1, 2032.`).join("\n");
  const twentyFive = extractLocally(make(25)); assert.equal(twentyFive.actions.length, 20); assert.equal(twentyFive.attention.length, 5);
  assert.ok(twentyFive.attention.every(item => /20-action limit/.test(item.reason)));
  const more = extractLocally(make(110)); assert.equal(more.attention.length, 80); assert.ok(more.notes.some(n => /10 more omitted/.test(n)));
});
test("different or ambiguously mixed clock times remain unresolved even with an explicit date and offset", () => {
  for (const clocks of ["5:00 pm or 7:00 pm", "noon or 5:00 pm", "5:00 pm or midnight", "5:00 pm or 17:00"]) {
    const a = extractLocally(`Upload your report by July 2, 2032 at ${clocks} UTC-10:00.`).actions[0];
    assert.equal(a.time, ""); assert.equal(a.sourceRequiresTime, true); assert.equal(canConfirmDate(a), false);
  }
});
test("different UTC offsets cannot silently choose the first; repeated identical offsets are allowed", () => {
  const a = extractLocally("Upload your report by July 2, 2032 at 5:00 pm UTC-10:00 or UTC-08:00.").actions[0];
  assert.equal(a.utcOffset, ""); assert.equal(canConfirmDate(a), false);
  const b = extractLocally("Upload your report by July 2, 2032 at 5:00 pm UTC-10:00 (also printed as GMT-10:00).").actions[0];
  assert.equal(b.utcOffset, "-10:00"); assert.equal(b.time, "17:00");
});
test("both downloads retain notice-level and skipped-passage context without creating extra tasks", () => {
  const r = extractLocally("Print your transit permit by September 4, 2032. The separate fee deadline is September 6, 2032.");
  const a = { ...r.actions[0], approved: true, dateConfirmed: true };
  const context = { ...meta, notes: r.notes, attention: r.attention };
  const checklist = checklistText([a], context); const calendar = calendarText([a], context).replace(/\r\n /g, "");
  assert.equal((checklist.match(/- \[ \]/g) ?? []).length, 1); assert.equal((calendar.match(/BEGIN:VEVENT/g) ?? []).length, 1);
  for (const output of [checklist, calendar]) { assert.match(output, /fee deadline is September 6/); assert.match(output, /not linked to an action/); assert.match(output, /Local English text rules generated/); }
});
test("dates in prefix or trailing conditions are not action deadlines", () => {
  for (const source of ["If your payment was received by 2031-05-01, bring your student ID.", "Bring your student ID if your payment was received by 2031-05-01."]) {
    const a = extractLocally(source).actions[0]; assert.equal(a.date, ""); assert.match(a.condition, /payment/); assert.ok(a.issues.some(i => /appears in the condition/.test(i)));
  }
  const a = extractLocally("If payment was received by May 1, 2031, bring your student ID on May 4, 2031.").actions[0];
  assert.equal(a.date, "2031-05-04"); assert.ok(a.dateEvidence.every(e => !e.quote.includes("May 1")));
});
test("condition clocks and separate-clause opening hours never become deadline cutoffs", () => {
  for (const source of ["If you attended the 5 pm UTC-10:00 briefing, submit your report by December 2, 2031.", "Submit your report by December 2, 2031; the help desk is open at 5 pm UTC-10:00."]) {
    const a = extractLocally(source).actions[0]; assert.equal(a.date, "2031-12-02"); assert.equal(a.time, ""); assert.equal(a.utcOffset, ""); assert.equal(a.requiresTime, false);
  }
  const a = extractLocally("Register for the 5 pm UTC-10:00 briefing by December 2, 2031.").actions[0];
  assert.equal(a.time, ""); assert.ok(a.issues.some(i => /outside a recognized deadline clause/.test(i)));
});
test("a complex long instruction keeps its independent warnings without overflowing validation", () => {
  const source = "If your permit was issued on May 1, 2031, register for " + "the school workshop ".repeat(20) + "on May 4, 2031 at 5 pm and pay the deposit.";
  const a = extractLocally(source).actions[0];
  assert.equal(a.date, ""); assert.equal(a.time, ""); assert.match(a.condition, /May 1, 2031/);
  assert.ok(a.issues.some(i => /shortened/.test(i))); assert.ok(a.issues.some(i => /outside a recognized deadline clause/.test(i)));
});
test("a timezone offset by itself does not invent a timed cutoff for a date-only instruction", () => {
  const a = extractLocally("Submit your permission slip by October 4, 2032 (UTC-10:00).").actions[0];
  assert.equal(a.date, "2032-10-04"); assert.equal(a.time, ""); assert.equal(a.requiresTime, false); assert.equal(canConfirmDate(a), true);
});
