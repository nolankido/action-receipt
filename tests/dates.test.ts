import test from "node:test";
import assert from "node:assert/strict";
import { explicitDates, protectDateAbbreviations, weekdayConflicts } from "../lib/dates.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, editAction, validateExtraction } from "../lib/receipt.ts";
import { calendarText, checklistText } from "../lib/export.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";

const meta = { mode: "local" as const, title: "Date syntax test", receiptId: "date-tests", createdAt: new Date("2026-10-15T00:00:00.000Z"), notes: [] };
test("English month abbreviations normalize in either date order without inferring a year", () => {
  const names = ["Jan.", "Feb", "Mar.", "Apr", "May", "Jun.", "Jul", "Aug.", "Sept.", "Oct", "Nov.", "Dec"];
  names.forEach((name, i) => {
    const expected = `2032-${String(i + 1).padStart(2, "0")}-05`;
    assert.deepEqual(explicitDates(`${name} 5, 2032`), [expected]); assert.deepEqual(explicitDates(`5 ${name} 2032`), [expected]);
    assert.deepEqual(explicitDates(`${name} 5`), []);
  });
  assert.deepEqual(explicitDates("Sep 5, 2032 and 5 September 2032"), ["2032-09-05"]);
});
test("abbreviation periods stay inside source-linked instructions while real sentence boundaries stay separate", () => {
  const quotes = ["Register by Nov. 5, 2032.", "Pay the deposit by 7 Nov. 2032."];
  const source = "📌 Club notice\n" + quotes.join(" "); const r = extractLocally(source);
  assert.deepEqual(r.actions.map(a => a.date), ["2032-11-05", "2032-11-07"]);
  assert.deepEqual(r.actions.map(a => a.evidence[0].quote), quotes);
  for (const a of r.actions) { assert.equal(a.approved, false); assert.equal(a.dateConfirmed, false); assert.ok(a.evidenceValid); assert.ok(!a.evidence[0].quote.includes("\u2060")); }
});
test("matching full or abbreviated weekdays can precede a named or ISO deadline and timed cutoff", () => {
  for (const wording of ["Friday, Nov. 5, 2032", "Fri. November 5, 2032", "Fri., 5 Nov. 2032", "Friday 2032-11-05"]) {
    const a = extractLocally(`Upload your report by ${wording} at 5 pm UTC-10:00.`).actions[0];
    assert.equal(a.date, "2032-11-05"); assert.equal(a.time, "17:00"); assert.equal(a.utcOffset, "-10:00"); assert.equal(a.title, "Upload your report");
    assert.equal(a.dateConfirmed, false);
  }
  assert.equal(extractLocally("Bring your student ID on Tue. 2 Nov. 2032.").actions[0].date, "2032-11-02");
});
test("weekday contradictions before or after a date remain unresolved with exact review evidence", () => {
  for (const wording of ["Monday, Nov. 5, 2032", "Nov. 5, 2032 (Mon.)", "November 5, 2032, Monday", "2032-11-05 (Monday)"]) {
    const source = `Submit your report by ${wording}.`; const r = extractLocally(source); const a = r.actions[0];
    assert.equal(a.date, ""); assert.equal(a.originalDate, ""); assert.equal(calendarEligible({ ...a, approved: true, dateConfirmed: true }), false);
    assert.ok(a.issues.some(i => /weekday.*does not match/.test(i))); assert.equal(r.attention.length, 1); assert.equal(r.attention[0].evidence.quote, source); assert.match(r.attention[0].reason, /Weekday\/date conflict/);
  }
});
test("the common evidence validator rejects a contradicted weekday even when the proposal claims an explicit date", () => {
  const source = "Submit your report by Monday, November 5, 2032.";
  const a = validateExtraction(source, { actions: [{ title: "Submit report", condition: null, evidence: [source], deadline: { text: source, evidence: [source], date: "2032-11-05", time: null, utcOffset: null, status: "explicit" }, issues: [] }], notes: [] }).actions[0];
  assert.equal(a.date, ""); assert.match(a.issues.join(" "), /Monday.*Friday/);
});
test("a user clarification can resolve a weekday conflict while its warning and source remain in both exports", () => {
  const source = "Submit your report by Monday, Nov. 5, 2032."; const r = extractLocally(source);
  const a = { ...editAction(r.actions[0], { date: "2032-11-05" }), approved: true, dateConfirmed: true };
  assert.equal(calendarEligible(a), true); assert.equal(a.dateOrigin, "user supplied");
  for (const output of [checklistText([a], { ...meta, attention: r.attention }), calendarText([a], { ...meta, attention: r.attention }).replace(/\r\n /g, "")]) {
    assert.match(output, /weekday Monday does not match/); assert.ok(output.replace(/\\,/g, ",").includes(source)); assert.match(output, /user supplied/);
  }
});
test("abbreviations do not infer missing years, relative dates, numeric locale or impossible days", () => {
  for (const wording of ["Nov. 5", "next Friday, Nov. 5, 2032", "Nov. 5, 2032 or next Fri.", "11/05/2032", "Feb. 30, 2032", "Nov. 5, 32"]) {
    const a = extractLocally(`Submit the library application by ${wording}.`).actions[0]; assert.equal(a.date, "");
  }
});
test("abbreviated dates in conditions and later clauses stay separate from the actual deadline", () => {
  for (const source of ["If payment was received by Nov. 1, 2032, submit the form by Nov. 5, 2032.", "Submit the form by Nov. 5, 2032 only if payment was received by Nov. 1, 2032."]) {
    const a = extractLocally(source).actions[0]; assert.equal(a.date, "2032-11-05"); assert.match(a.condition, /Nov\. 1, 2032/); assert.ok(a.dateEvidence.every(e => !e.quote.includes("Nov. 1")));
  }
  const a = extractLocally("Submit the form by Nov. 5, 2032; the desk opens on Nov. 7, 2032.").actions[0]; assert.equal(a.date, "2032-11-05");
});
test("an abbreviated event date cannot be borrowed as a registration deadline", () => {
  const a = extractLocally("Register for the workshop on Nov. 5, 2032 using the form provided by Student Affairs.").actions[0]; assert.equal(a.date, "");
  const b = extractLocally("The workshop is on Nov. 5, 2032. Register using the online form.").actions[0]; assert.equal(b.date, "");
});
test("repeated abbreviated quotations retain every exact position in original UTF-16 source", () => {
  const quote = "Pay the fee by Nov. 5, 2032."; const source = "🎓 Club notice\n" + quote + "\n" + quote;
  const a = extractLocally(source).actions[0]; assert.equal(a.evidence[0].starts.length, 2);
  for (const start of a.evidence[0].starts) assert.equal(source.slice(start, start + quote.length), quote);
});
test("saved abbreviated timed actions keep independently recomputed cutoff protection", () => {
  const source = "Upload your report by Fri., Nov. 5, 2032 at 5 pm UTC-10:00."; const actions = extractLocally(source).actions;
  const f = JSON.parse(saveReviewFile({ source, actions, meta })); Object.assign(f.actions[0], { requiresTime: false, time: "", utcOffset: "", dateEvidence: [], deadlineText: "" });
  const a = openReviewFile(JSON.stringify(f)).actions[0]; assert.equal(a.sourceRequiresTime, true); assert.equal(a.requiresTime, true); assert.equal(a.approved, false); assert.equal(calendarEligible(a), false);
});
test("sentence-boundary protection changes no string length and leaves other punctuation alone", () => {
  const source = "Dr. Smith: Fri., Nov. 5, 2032. Pay later. 🎓"; const protectedText = protectDateAbbreviations(source);
  assert.equal(protectedText.length, source.length); assert.ok(protectedText.startsWith("Dr. Smith:")); assert.ok(protectedText.endsWith("2032. Pay later. 🎓"));
  assert.deepEqual(weekdayConflicts("Friday, Nov. 5, 2032 (Fri.)"), []);
});
