import assert from "node:assert/strict";
import test from "node:test";
import { dateProblems, explicitDates } from "../lib/dates.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, dateConfirmationIssues, editAction, validateExtraction } from "../lib/receipt.ts";
import { calendarText, checklistText, planExports } from "../lib/export.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";

const meta = { mode: "local" as const, title: "Synthetic date integrity check", receiptId: "date-integrity", createdAt: new Date("2026-10-15T00:00:00Z"), notes: [] };
test("an invalid linked deadline cannot borrow a different valid date from the same clause", () => {
  for (const bad of ["February 30, 2032", "2032-02-30", "31 April 2032", "Feb. 29, 2031"]) {
    const source = `Submit the form by ${bad} for the event on March 1, 2032.`;
    const r = extractLocally(source); const a = r.actions[0];
    assert.equal(a.date, "", bad); assert.equal(a.originalDate, "");
    assert.ok(a.issues.some(i => /invalid or outside/.test(i)));
    assert.ok(r.attention.some(f => /Date needs clarification/.test(f.reason)));
    assert.equal(calendarEligible({ ...a, approved: true, dateConfirmed: true }), false);
    assert.ok(!calendarText([{ ...a, approved: true, dateConfirmed: true }], meta).includes("BEGIN:VEVENT"));
  }
});
test("mixed named and unsupported numeric dates remain unresolved without picking a locale", () => {
  for (const wording of ["11/07/2032", "07/11/2032", "2032/11/07", "07.11.2032", "11-07-32"]) {
    const source = `Register by November 5, 2032 (deadline ${wording}).`;
    const r = extractLocally(source);
    assert.equal(r.actions[0].date, "", wording);
    assert.ok(r.actions[0].issues.some(i => /Numeric date wording/.test(i)));
    assert.ok(r.attention.some(f => f.evidence.quote === source));
  }
});
test("extended dates and an unsupported earlier cutoff cannot contribute a valid prefix or later event date", () => {
  for (const wording of ["November 5, 2032/33", "2032-11-05/06", "2032-11-05.5"]) {
    assert.deepEqual(explicitDates(wording), []);
    const r = extractLocally(`Submit the form by ${wording}.`);
    assert.equal(r.actions[0].date, ""); assert.ok(r.attention.some(f => /Extended date wording/.test(f.reason)));
  }
  for (const source of ["Bring the packet by February 30 for the event on March 1, 2032.", "Return the packet by 2032-02-28T17:00 for the event on March 1, 2032."]) {
    assert.equal(extractLocally(source).actions[0].date, "");
  }
});
test("an incomplete named date cannot borrow another date's year or scheduled date", () => {
  for (const source of ["Bring the packet on November 5 for the event on March 1, 2032.", "Submit by November 5 or November 7, 2032.", "Return the packet on 5 November for the event on March 1, 2032."]) {
    const r = extractLocally(source);
    assert.equal(r.actions[0].date, "");
    assert.ok(r.actions[0].issues.some(i => /partial written date/.test(i)));
  }
});
test("unsupported or impossible calendar dates are flagged even without a supported action verb", () => {
  for (const wording of ["February 30, 2032", "2032-13-01", "November 5, 0999", "11/07/2032"]) {
    const source = `The office notice lists the date as ${wording}.`;
    const r = extractLocally(source);
    assert.equal(r.actions.length, 0); assert.equal(r.attention.length, 1);
    assert.equal(r.attention[0].evidence.quote, source); assert.match(r.attention[0].reason, /Date needs clarification/);
  }
});
test("the common evidence validator rejects questionable dates in an explicit proposal", () => {
  for (const source of ["Submit by February 30, 2032 or March 1, 2032.", "Submit by March 1, 2032 (also printed as 03/02/2032)."] ) {
    const a = validateExtraction(source, { actions: [{ title: "Submit the form", condition: null, evidence: [source], deadline: { text: source, evidence: [source], date: "2032-03-01", time: null, utcOffset: null, status: "explicit" }, issues: [] }], notes: [] }).actions[0];
    assert.equal(a.date, ""); assert.ok(a.issues.some(i => /Clarify/.test(i)));
  }
});
test("date problems in a condition stay separate from the action's valid deadline", () => {
  for (const source of ["If your old permit says February 30, 2032, submit the new form by March 1, 2032.", "Submit the new form by March 1, 2032 only if your old permit says 02/30/2032."]) {
    const r = extractLocally(source); const a = r.actions[0];
    assert.equal(a.date, "2032-03-01"); assert.ok(a.condition);
    assert.ok(r.attention.some(f => /Date in a condition needs clarification/.test(f.reason)));
    assert.ok(a.dateEvidence.every(e => !e.quote.includes("permit")));
  }
  const laterClause = extractLocally("Submit by March 1, 2032; another card lists 03/02/2032.");
  assert.equal(laterClause.actions[0].date, "2032-03-01"); assert.ok(laterClause.attention.length);
});
test("supported dates and phone numbers do not gain numeric-date warnings", () => {
  for (const wording of ["2032-11-05", "February 29, 2032", "5 Nov. 2032"]) {
    const source = `Register by ${wording} and quote contact number 800-555-1234.`;
    const a = extractLocally(source).actions[0];
    assert.ok(a.date); assert.deepEqual(dateProblems(source), []);
  }
  assert.deepEqual(explicitDates("February 30, 2032 and March 1, 2032"), ["2032-03-01"]);
});
test("repeated questionable passages retain every exact source location and separate flag IDs", () => {
  const quote = "Submit by February 30, 2032 or March 1, 2032.";
  const source = "🎓 Synthetic notice\n" + quote + "\n" + quote;
  const r = extractLocally(source);
  assert.deepEqual(r.actions.map(a => a.date), ["", ""]);
  assert.equal(new Set(r.attention.map(f => f.id)).size, 2);
  for (const f of r.attention) {
    assert.equal(f.evidence.starts.length, 2);
    for (const start of f.evidence.starts) assert.equal(source.slice(start, start + f.evidence.quote.length), quote);
  }
});
test("deliberate clarification retains invalid original wording and requires fresh trust after reopening", () => {
  const source = "Submit the form by February 30, 2032 or March 1, 2032.";
  const r = extractLocally(source); const a = editAction(r.actions[0], { date: "2032-03-01" });
  assert.equal(a.approved, false); assert.equal(a.dateConfirmed, false);
  const checked = { ...a, approved: true, dateConfirmed: true }; const m = { ...meta, attention: r.attention };
  for (const text of [checklistText([checked], m), calendarText([checked], m).replace(/\r\n /g, "")]) {
    assert.match(text, /February 30/); assert.match(text, /invalid or outside/); assert.match(text, /user supplied/);
  }
  const loaded = openReviewFile(saveReviewFile({ source, actions: [checked], meta: m })).actions[0];
  assert.equal(loaded.date, "2032-03-01"); assert.equal(loaded.approved, false); assert.equal(loaded.dateConfirmed, false);
});
test("many questionable dates produce bounded proposal diagnostics instead of a schema failure", () => {
  const source = "Submit by November 5, 2032 (" + Array.from({ length: 25 }, (_, i) => `also printed ${i % 12 + 1}/07/2032`).join(", ") + ").";
  const r = extractLocally(source);
  assert.equal(r.actions[0].date, ""); assert.ok(r.actions[0].issues.length <= 24);
  assert.doesNotThrow(() => saveReviewFile({ source, actions: r.actions, meta: { ...meta, attention: r.attention, notes: r.notes } }));
});
test("date-review explanations and calendar exclusion share the same validation", () => {
  const source = "Pay the deposit by November 5, 2032 at 17:00 UTC-10:00.";
  const initial = extractLocally(source).actions[0];
  for (const patch of [{ date: "", time: "", utcOffset: "" }, { time: "17:00:30", utcOffset: "-10:00:30" }, { date: "9999-12-31", time: "23:00", utcOffset: "-10:00" }]) {
    const a = { ...editAction(initial, patch), approved: true, dateConfirmed: true };
    const issues = dateConfirmationIssues(a); assert.ok(issues.length);
    const reason = planExports([a]).notInCalendar[0].reason;
    assert.equal(reason.toLowerCase(), ("Checklist only: " + issues[0]).toLowerCase());
    assert.equal(calendarEligible(a), false);
  }
  assert.deepEqual(dateConfirmationIssues(initial), []);
});
test("unsupported time and offset draft values survive save/open without becoming shortened or eligible", () => {
  const source = "Pay the deposit by November 5, 2032 at 17:00 UTC-10:00.";
  const a = editAction(extractLocally(source).actions[0], { time: "17:00:30", utcOffset: "-10:00:30" });
  assert.equal(dateConfirmationIssues(a).length, 2);
  const loaded = openReviewFile(saveReviewFile({ source, actions: [a], meta })).actions[0];
  assert.equal(loaded.time, "17:00:30"); assert.equal(loaded.utcOffset, "-10:00:30");
  assert.equal(calendarEligible({ ...loaded, approved: true, dateConfirmed: true }), false);
});
test("calendar draft storage remains bounded while permitting incomplete or unsupported input", () => {
  const source = "Pay the deposit by November 5, 2032 at 17:00 UTC-10:00.";
  const a = editAction(extractLocally(source).actions[0], { utcOffset: "x".repeat(64) });
  assert.equal(openReviewFile(saveReviewFile({ source, actions: [a], meta })).actions[0].utcOffset, a.utcOffset);
  assert.throws(() => saveReviewFile({ source, actions: [{ ...a, utcOffset: "x".repeat(65) }], meta }), /could not be saved/);
});
