import assert from "node:assert/strict";
import test from "node:test";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, editAction } from "../lib/receipt.ts";
import { calendarText, checklistText, planExports } from "../lib/export.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";
import { recordSourceDecision, sourceReviewState } from "../lib/source-review.ts";

const meta = { mode: "local" as const, title: "Synthetic qualification check", receiptId: "qualification-check", createdAt: new Date("2026-10-15T00:00:00Z"), notes: [] };

test("an except-if waiver is kept whole instead of reversing its meaning", () => {
  const source = "Pay the fee by November 5, 2032 except if you already have a waiver.";
  const a = extractLocally(source).actions[0];
  assert.equal(a.title, "Pay the fee");
  assert.equal(a.condition, "except if you already have a waiver");
  assert.equal(a.date, "2032-11-05");
  assert.equal(a.evidence[0].quote, source);
  assert.equal(a.approved, false); assert.equal(a.dateConfirmed, false);
});

test("trailing exceptions preserve their original marker and qualification", () => {
  for (const condition of ["except when you have a waiver", "except for students with a waiver", "excluding students with a waiver", "other than students with a waiver", "even if you have already reserved a place"]) {
    const a = extractLocally(`Pay the fee by November 5, 2032 ${condition}.`).actions[0];
    assert.equal(a.condition, condition); assert.equal(a.title, "Pay the fee");
    assert.equal(a.date, "2032-11-05");
  }
});

test("prerequisites and audience restrictions remain visible after removing deadline wording", () => {
  for (const condition of ["only after your adviser approves it", "only once your adviser approves it", "only when a place is available", "only for students in the club", "subject to adviser approval", "depending on whether a place is available"]) {
    const a = extractLocally(`Submit your form by November 5, 2032 ${condition}.`).actions[0];
    assert.equal(a.condition, condition); assert.equal(a.title, "Submit your form");
    assert.equal(a.date, "2032-11-05");
  }
});

test("leading exceptions and prerequisites keep their scope separate from the action", () => {
  for (const condition of ["Except for students with a waiver", "Only after your adviser approves it", "Subject to adviser approval"]) {
    const a = extractLocally(`${condition}, submit your form by November 5, 2032.`).actions[0];
    assert.equal(a.condition, condition); assert.equal(a.title, "submit your form");
    assert.equal(a.date, "2032-11-05");
  }
  const a = extractLocally("Only after payment clears on November 1, 2032 at 5 pm UTC-10:00, submit your form by November 5, 2032.").actions[0];
  assert.match(a.condition, /^Only after payment/); assert.equal(a.date, "2032-11-05");
  assert.equal(a.requiresTime, false); assert.ok(a.dateEvidence.every(e => !e.quote.includes("November 1")));
});

test("prefix and trailing qualifications are both preserved without collapsing their logic", () => {
  const a = extractLocally("If you plan to attend, pay the fee by November 5, 2032 except if you have a waiver.").actions[0];
  assert.equal(a.condition, "If you plan to attend; except if you have a waiver");
  assert.equal(a.date, "2032-11-05");
});

test("alternative and joined instructions retain both branches and start without a deadline", () => {
  for (const join of ["or", "&", "and/or", "otherwise,", "alternatively,", "also"]) {
    const source = `Register by November 5, 2032 ${join} pay the fee at the door.`;
    const r = extractLocally(source); const a = r.actions[0];
    assert.match(a.title, /Register.*pay the fee at the door/);
    assert.equal(a.date, ""); assert.equal(a.originalDate, "");
    assert.ok(r.attention.some(f => /Several actions or alternatives/.test(f.reason) && f.evidence.quote === source));
    assert.equal(calendarEligible({ ...a, approved: true, dateConfirmed: true }), false);
  }
});

test("alternative instructions with modal prefixes and timed wording cannot inherit a shared cutoff", () => {
  for (const branch of ["or you can pay at the door", "or please pay at the door", "& you must pay at the door"]) {
    const a = extractLocally(`Register by November 5, 2032 at 5 pm UTC-10:00 ${branch}.`).actions[0];
    assert.equal(a.date, ""); assert.equal(a.time, ""); assert.equal(a.utcOffset, "");
    assert.equal(a.requiresTime, true);
    assert.match(a.title, /pay at the door/);
  }
});

test("alternatives between objects are not mistaken for separate instructions", () => {
  for (const object of ["your passport or student ID", "your passport & student ID", "your club and school ID"]) {
    const r = extractLocally(`Bring ${object} on November 5, 2032.`);
    assert.equal(r.actions[0].date, "2032-11-05");
    assert.ok(!r.attention.some(f => /Several actions or alternatives/.test(f.reason)));
  }
});

test("both exports retain the complete exception, including after explicit user checks", () => {
  const source = "Pay the fee by November 5, 2032 except if you have a waiver.";
  const a = { ...extractLocally(source).actions[0], approved: true, dateConfirmed: true };
  for (const output of [checklistText([a], meta), calendarText([a], meta).replace(/\r\n /g, "")]) {
    assert.match(output, /Condition: except if you have a waiver/);
    assert.ok(!output.includes("Condition: if you have a waiver"));
    assert.match(output, /Pay the fee/);
  }
  assert.equal(planExports([a]).calendar.length, 1);
});

test("saving and reopening keep exception text and unresolved branches while clearing trust", () => {
  const source = "Pay the fee by November 5, 2032 except if you have a waiver. Register by November 6, 2032 or pay at the door.";
  const r = extractLocally(source);
  const checked = r.actions.map(a => ({ ...a, approved: true, dateConfirmed: Boolean(a.date) }));
  const loaded = openReviewFile(saveReviewFile({ source, actions: checked, meta: { ...meta, notes: r.notes, attention: r.attention } }));
  assert.equal(loaded.actions[0].condition, "except if you have a waiver");
  assert.match(loaded.actions[1].title, /or pay at the door/); assert.equal(loaded.actions[1].date, "");
  assert.ok(loaded.actions.every(a => !a.approved && !a.dateConfirmed));
  assert.ok(loaded.meta.attention?.some(f => /Several actions or alternatives/.test(f.reason)));
});

test("changing a qualification clears approval and invalidates an existing source association", () => {
  const r = extractLocally("Register by November 5, 2032 or pay the fee at the door.");
  const a = { ...r.actions[0], approved: true };
  const flag = recordSourceDecision(r.attention[0], { kind: "linked", actionId: a.id, note: "Synthetic check only: both alternatives remain in the wording." }, [a]);
  assert.equal(sourceReviewState(flag, [a]).addressed, true);
  const edited = editAction(a, { condition: "Only if you plan to attend" });
  assert.equal(edited.approved, false); assert.equal(sourceReviewState(flag, [edited]).code, "changed");
});

test("unsupported long qualifications remain source flags instead of being silently shortened", () => {
  const source = "Pay the fee by November 5, 2032 only after " + "your adviser confirms approval ".repeat(22) + ".";
  const r = extractLocally(source);
  assert.equal(r.actions.length, 0);
  assert.ok(r.attention.some(f => f.evidence.quote === source && /Long passage or condition/.test(f.reason)));
  const unsupported = extractLocally("Except for students with a waiver, a guardian signature accompanies the form.");
  assert.equal(unsupported.actions.length, 0); assert.equal(unsupported.attention.length, 1);
});
