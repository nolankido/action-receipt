import assert from "node:assert/strict";
import test from "node:test";
import { clarificationCandidates, clarificationText, editQuestionDraft, questionDraft, selectedQuestions } from "../lib/clarification.ts";
import { calendarText, checklistText, planExports, type ReceiptMeta } from "../lib/export.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { editAction, manualAction } from "../lib/receipt.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";
import { recordSourceDecision, sourceReviewSummary } from "../lib/source-review.ts";
import { reviewScenario } from "../lib/samples.ts";

const meta = (r: ReturnType<typeof extractLocally>): ReceiptMeta => ({ mode: "local", title: "Invented notice", createdAt: new Date("2026-10-15T00:00:00.000Z"), receiptId: "questions", notes: r.notes, attention: r.attention });
function setup() { const source = reviewScenario.source; const r = extractLocally(source); return { source, ...r, meta: meta(r) }; }
test("fresh drafts cover incomplete fields, leave clear unconfirmed dates alone and select nothing", () => {
  const s = setup(); const candidates = clarificationCandidates(s.source, s.actions, s.attention);
  assert.equal(candidates.length, 2); assert.ok(candidates.some(c => /deposit/.test(c.context))); assert.ok(candidates.some(c => /coordinator/.test(c.context)));
  assert.ok(candidates.every(c => c.kind === "date")); assert.ok(candidates.every(c => c.quotes.every(q => s.source.includes(q))));
  assert.equal(selectedQuestions(candidates, candidates.map(questionDraft)).length, 0);
  assert.throws(() => clarificationText(s.source, s.actions, s.meta, candidates.map(questionDraft)), /at least one/);
});
test("a checked clarification note replaces only the generic question for its exact passage", () => {
  const s = setup(); const conflict = s.attention.find(i => /Weekday\/date/.test(i.reason))!;
  const note = recordSourceDecision(conflict, { kind: "clarify", actionId: null, note: "Is the weekday or calendar date correct for the deposit?" }, s.actions);
  const candidates = clarificationCandidates(s.source, s.actions, [note]);
  assert.equal(candidates.length, 2); assert.equal(candidates[0].kind, "note"); assert.equal(candidates[0].question, note.decision!.note);
  assert.ok(!candidates.some(c => c.kind === "date" && /deposit/.test(c.context)));
  assert.ok(candidates.some(c => /coordinator/.test(c.context)));
});
test("editing a question clears its own selection without changing another checked question", () => {
  const s = setup(); const drafts = clarificationCandidates(s.source, s.actions, s.attention).map(c => ({ ...questionDraft(c), checked: true }));
  const changed = editQuestionDraft(drafts[0], "Which full date is intended?");
  assert.equal(changed.checked, false); assert.equal(drafts[0].checked, true); assert.equal(drafts[1].checked, true);
  assert.equal(editQuestionDraft(drafts[0], drafts[0].text), drafts[0]);
});
test("the sheet exports only selected questions and their own context, without task or event entries", () => {
  const s = setup(); const c = clarificationCandidates(s.source, s.actions, s.attention); const drafts = c.map(questionDraft);
  drafts[0] = { ...editQuestionDraft(drafts[0], "Which full date applies to the deposit?"), checked: true };
  const text = clarificationText(s.source, s.actions, { ...s.meta, notes: ["UNSELECTED PRIVATE NOTICE NOTE"] }, drafts);
  assert.equal((text.match(/^## Question /gm) ?? []).length, 1); assert.match(text, /Which full date applies to the deposit/);
  assert.ok(text.includes(c[0].quotes[0])); assert.ok(!text.includes(c[1].quotes[0])); assert.ok(!text.includes("UNSELECTED PRIVATE NOTICE NOTE"));
  assert.match(text, /Edited by user, then checked/); assert.match(text, /No question has been sent and no date has been resolved/);
  assert.ok(!text.includes("- [ ]")); assert.ok(!text.includes("BEGIN:VEVENT"));
});
test("preparing and downloading questions preserves approval, dates, source decisions and both task exports", () => {
  const s = setup(); const actions = s.actions.map(a => ({ ...a, approved: true })); const before = JSON.stringify({ actions, attention: s.attention });
  const checklist = checklistText(actions, s.meta); const calendar = calendarText(actions, s.meta); const plan = planExports(actions); const flags = sourceReviewSummary(s.attention, actions);
  const drafts = clarificationCandidates(s.source, actions, s.attention).map(c => ({ ...questionDraft(c), checked: true }));
  clarificationText(s.source, actions, s.meta, drafts);
  assert.equal(JSON.stringify({ actions, attention: s.attention }), before); assert.equal(checklistText(actions, s.meta), checklist); assert.equal(calendarText(actions, s.meta), calendar);
  assert.deepEqual(planExports(actions), plan); assert.deepEqual(sourceReviewSummary(s.attention, actions), flags);
});
test("missing cutoff times and offsets get specific questions without inventing either", () => {
  const source = "Submit the outline by December 2, 2032 at 5 pm UTC-10:00."; const r = extractLocally(source); const original = r.actions[0];
  assert.equal(clarificationCandidates(source, [original], []).length, 0);
  for (const patch of [{ time: "" }, { utcOffset: "" }, { time: "", utcOffset: "" }]) {
    const a = editAction(original, patch); const [c] = clarificationCandidates(source, [a], []);
    assert.ok(c); assert.equal(c.question.includes("cutoff time"), "time" in patch); assert.equal(c.question.includes("UTC offset"), "utcOffset" in patch);
    assert.match(c.question, /confirm/); assert.equal(a.dateConfirmed, false); assert.equal(a.approved, false);
  }
});
test("omitted, invalid or unmatched action evidence and unmatched source flags cannot enter a question sheet", () => {
  const s = setup(); const a = s.actions.find(a => /deposit/.test(a.title))!;
  for (const bad of [{ ...a, omitted: true }, { ...a, evidenceValid: false }, { ...a, evidence: [] }, { ...a, evidence: [{ quote: "Forged quotation", starts: [0] }] }]) assert.equal(clarificationCandidates(s.source, [bad], []).length, 0);
  const item = recordSourceDecision(s.attention[0], { kind: "clarify", actionId: null, note: "Ask about this passage." }, s.actions);
  assert.equal(clarificationCandidates(s.source, [], [{ ...item, evidence: { quote: "Missing passage", starts: [0] } }]).length, 0);
});
test("imported clarification choices need rechecking, and imported action context stays unverified", () => {
  const s = setup(); const consent = recordSourceDecision(s.attention[0], { kind: "clarify", actionId: null, note: "What must the consent include?" }, s.actions);
  const loaded = openReviewFile(saveReviewFile({ source: s.source, actions: s.actions, meta: { ...s.meta, attention: [consent] } }));
  const before = clarificationCandidates(s.source, loaded.actions, loaded.meta.attention!); assert.ok(before.every(c => c.kind === "date")); assert.ok(before.every(c => /unverified/.test(c.origin)));
  const imported = loaded.meta.attention![0]; const rechecked = recordSourceDecision(imported, { kind: "clarify", actionId: null, note: imported.decision!.note }, loaded.actions);
  assert.ok(clarificationCandidates(s.source, loaded.actions, [rechecked]).some(c => c.kind === "note"));
  assert.ok(!clarificationCandidates(s.source, [], [{ ...imported, decision: { ...imported.decision!, confirmed: true } }]).length);
});
test("changed source, date fields, wording or decision notes invalidate a checked question", () => {
  const s = setup(); const [c] = clarificationCandidates(s.source, s.actions, []); const d = { ...questionDraft(c), checked: true }; const a = s.actions.find(a => c.id === `action:${a.id}`)!;
  for (const changed of [editAction(a, { title: "Changed wording" }), editAction(a, { date: "2032-11-09" }), editAction(a, { condition: "Only if attending" })]) {
    assert.throws(() => clarificationText(s.source, s.actions.map(x => x.id === a.id ? changed : x), s.meta, [d]), /source or context changed/);
  }
  assert.throws(() => clarificationText("Entirely different notice.", s.actions, s.meta, [d]), /source or context changed/);
  assert.throws(() => clarificationText(s.source + "\nThe earlier instructions have changed.", s.actions, s.meta, [d]), /source or context changed/);
  const flag = recordSourceDecision(s.attention[0], { kind: "clarify", actionId: null, note: "What is required?" }, s.actions); const [fc] = clarificationCandidates(s.source, [], [flag]);
  const changed = recordSourceDecision(flag, { kind: "clarify", actionId: null, note: "Which signature is required?" }, s.actions);
  assert.throws(() => clarificationText(s.source, [], { ...s.meta, attention: [changed] }, [{ ...questionDraft(fc), checked: true }]), /source or context changed/);
});
test("empty, overlong, duplicate and unknown selected questions are rejected", () => {
  const s = setup(); const c = clarificationCandidates(s.source, s.actions, s.attention); const draft = { ...questionDraft(c[0]), checked: true };
  for (const text of ["  ", "x".repeat(601)]) assert.throws(() => selectedQuestions(c, [{ ...draft, text }]), /1 and 600/);
  assert.throws(() => selectedQuestions(c, [draft, draft]), /source or context changed/); assert.throws(() => selectedQuestions(c, [{ ...draft, id: "missing" }]), /source or context changed/);
});
test("conditional undated actions keep their condition and sheets escape markup while preserving source lines", () => {
  const source = "Participants must attach a signed consent form.\n  Keep the <script> example and [label](url) exactly as written.";
  const a = manualAction(source, "Attach consent", source, "Only if attending", 1); const c = clarificationCandidates(source, [a], []);
  const draft = { ...editQuestionDraft(questionDraft(c[0]), "Question?\n# Forged heading\n- [ ] Forged task <script>"), checked: true };
  const text = clarificationText(source, [a], { mode: "manual", title: "Notice\n# Heading", createdAt: new Date("2026-10-15T00:00:00Z"), receiptId: "escape", notes: [] }, [draft]);
  assert.match(text, /Condition: Only if attending/); assert.ok(text.includes(">   Keep the \\<script\\> example and \\[label\\](url) exactly as written."));
  assert.ok(!text.includes("\n# Forged heading")); assert.ok(!text.includes("\n- [ ]")); assert.ok(!text.includes("<script>"));
});
