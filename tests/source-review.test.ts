import test from "node:test";
import assert from "node:assert/strict";
import { extractLocally } from "../lib/local-extraction.ts";
import { editAction } from "../lib/receipt.ts";
import { calendarText, checklistText } from "../lib/export.ts";
import { createActionFromFlag, recordSourceDecision, sourceDecisionLines, sourceReviewState, sourceReviewSummary } from "../lib/source-review.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";
import { reviewScenario } from "../lib/samples.ts";

function setup() {
  const source = reviewScenario.source; const r = extractLocally(source);
  const consent = r.attention.find(i => i.evidence.quote.includes("signed consent"))!;
  const cancelled = r.attention.find(i => i.evidence.quote.includes("membership fee"))!;
  const conflict = r.attention.find(i => i.reason.includes("Weekday/date"))!;
  const meta = { mode: "local" as const, title: reviewScenario.title, receiptId: "queue-test", createdAt: new Date("2026-10-15T00:00:00.000Z"), notes: r.notes, attention: r.attention };
  return { source, ...r, consent, cancelled, conflict, meta };
}
function repair() { const s = setup(); return { ...s, repaired: createActionFromFlag(s.source, s.consent, { title: "Attach a signed consent form", quote: s.consent.evidence.quote, condition: "", note: "This required attachment was missing from the proposed actions." }, s.actions) }; }
test("the guided example is actually scanned and exposes a missed instruction, a conflict and a cancellation", () => {
  const s = setup(); assert.ok(s.consent && s.conflict && s.cancelled); assert.equal(s.attention.length, 3);
  assert.ok(!s.actions.some(a => /consent/.test(a.title))); assert.equal(s.actions.find(a => /deposit/.test(a.title))!.date, "");
  assert.equal(sourceReviewSummary(s.attention, s.actions).pending, 3);
});
test("creating from a flag preserves exact evidence and records a link without approval or a guessed date", () => {
  const { repaired, consent, actions } = repair();
  assert.equal(repaired.action.evidence[0].quote, consent.evidence.quote); assert.equal(repaired.action.origin, "user");
  assert.equal(repaired.action.approved, false); assert.equal(repaired.action.dateConfirmed, false); assert.equal(repaired.action.date, "");
  assert.equal(repaired.item.decision?.actionId, repaired.action.id); assert.match(sourceReviewState(repaired.item, [...actions, repaired.action]).label, /needs approval/);
  assert.equal(sourceReviewState(repaired.item, [...actions, { ...repaired.action, approved: true }]).addressed, true);
});
test("invalid repairs fail atomically for unrelated evidence, empty explanations and the action cap", () => {
  const s = setup(); const before = JSON.stringify(s); const input = { title: "Consent", quote: s.consent.evidence.quote, condition: "", note: "Required attachment" };
  assert.throws(() => createActionFromFlag(s.source, s.consent, { ...input, quote: s.actions[0].evidence[0].quote }, s.actions), /exact excerpt/);
  assert.throws(() => createActionFromFlag(s.source, s.consent, { ...input, note: " " }, s.actions), /Explain/);
  assert.throws(() => createActionFromFlag(s.source, s.consent, input, Array.from({ length: 20 }, (_, i) => ({ ...s.actions[0], id: `cap-${i}` }))), /20-action/);
  assert.equal(JSON.stringify(s), before);
});
test("not-an-obligation decisions count as addressed while clarification decisions remain pending", () => {
  const s = setup(); const excluded = recordSourceDecision(s.cancelled, { kind: "not_action", note: "The notice explicitly says this fee is not needed.", actionId: null }, s.actions);
  const clarify = recordSourceDecision(s.conflict, { kind: "clarify", note: "Ask whether the weekday or calendar date is correct.", actionId: null }, s.actions);
  assert.deepEqual(sourceReviewSummary([excluded, clarify, s.consent], s.actions), { total: 3, addressed: 1, pending: 2 });
  assert.match(sourceReviewState(clarify, s.actions).label, /Awaiting clarification/);
  assert.ok(s.actions.every(a => !a.approved));
});
test("a link cannot silently stay addressed after wording, condition, date, time or omission changes", () => {
  const { repaired, actions } = repair(); const ready = { ...repaired.action, approved: true };
  assert.equal(sourceReviewState(repaired.item, [...actions, ready]).addressed, true);
  const patches: Parameters<typeof editAction>[1][] = [{ title: "Changed action" }, { condition: "Only if attending" }, { date: "2032-11-05" }, { requiresTime: true, time: "17:00", utcOffset: "-10:00" }, { omitted: true }];
  for (const patch of patches) { const changed = { ...editAction(ready, patch), approved: true }; assert.equal(sourceReviewState(repaired.item, [...actions, changed]).addressed, false); }
  const changed = editAction(ready, { title: "Attach the guardian consent form" });
  const rechecked = recordSourceDecision(repaired.item, { kind: "linked", actionId: changed.id, note: "Rechecked the updated wording against the original passage." }, [...actions, changed]);
  assert.equal(sourceReviewState(rechecked, [...actions, { ...changed, approved: true }]).addressed, true);
});
test("links reject missing, omitted, unmatched and blank actions while keeping existing approval flags unchanged", () => {
  const s = setup(); const input = { kind: "linked" as const, actionId: "missing", note: "Relevant action" };
  assert.throws(() => recordSourceDecision(s.conflict, input, s.actions), /Choose an active action/);
  for (const patch of [{ omitted: true }, { evidenceValid: false }, { title: " " }]) assert.throws(() => recordSourceDecision(s.conflict, { ...input, actionId: s.actions[0].id }, [{ ...s.actions[0], ...patch }]), /Choose an active action/);
  const ready = { ...s.actions[0], approved: true, dateConfirmed: true }; const before = JSON.stringify(ready);
  recordSourceDecision(s.conflict, { ...input, actionId: ready.id }, [ready]); assert.equal(JSON.stringify(ready), before);
});
test("both exports keep original flags and decision notes as context without creating tasks or events", () => {
  const { repaired, actions, meta } = repair(); const ready = { ...actions[0], approved: true, dateConfirmed: true };
  const m = { ...meta, attention: [repaired.item] }; const all = [ready, repaired.action];
  const md = checklistText(all, m); const ics = calendarText(all, m).replace(/\r\n /g, "");
  assert.equal((md.match(/^- \[ \]/gm) ?? []).length, 1); assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 1);
  for (const out of [md, ics]) { assert.match(out, /required attachment was missing/); assert.match(out, /signed consent form/); assert.match(out, /needs approval/); assert.match(out, /does not approve an action or confirm a date/); }
});
test("review v2 preserves IDs, notes and choices but resets decision confirmation and provenance", () => {
  const { source, repaired, actions, meta } = repair(); const all = [...actions, { ...repaired.action, approved: true }]; const text = saveReviewFile({ source, actions: all, meta: { ...meta, attention: [repaired.item] } });
  const file = JSON.parse(text); assert.equal(file.version, 2); assert.equal(file.attention[0].decision.confirmed, undefined); assert.equal(file.attention[0].decision.actionSnapshot, undefined);
  const loaded = openReviewFile(text); const flag = loaded.meta.attention![0];
  assert.equal(flag.id, repaired.item.id); assert.equal(flag.decision?.note, repaired.item.decision?.note); assert.equal(flag.decision?.origin, "imported"); assert.equal(flag.decision?.confirmed, false);
  const approved = loaded.actions.map(a => ({ ...a, approved: true })); assert.equal(sourceReviewState(flag, approved).addressed, false);
  assert.match(sourceDecisionLines(flag, approved).join(" "), /Imported file; unverified/);
  const checked = recordSourceDecision(flag, { kind: "linked", actionId: repaired.action.id, note: flag.decision!.note }, approved); assert.equal(sourceReviewState(checked, approved).addressed, true);
});
test("legacy review v1 opens without fabricated decisions and can be saved as v2", () => {
  const s = setup(); const file = JSON.parse(saveReviewFile(s)); file.version = 1; file.attention = file.attention.map((i: { quote: string; reason: string }) => ({ quote: i.quote, reason: i.reason }));
  const loaded = openReviewFile(JSON.stringify(file)); assert.ok(loaded.meta.attention!.every(i => !i.decision)); assert.equal(JSON.parse(saveReviewFile(loaded)).version, 2);
});
test("duplicate flag IDs, dangling action links and injected decision trust fields are rejected", () => {
  const s = repair(); const make = () => JSON.parse(saveReviewFile({ source: s.source, actions: [...s.actions, s.repaired.action], meta: { ...s.meta, attention: [s.repaired.item, s.cancelled] } }));
  for (const modify of [(f: ReturnType<typeof make>) => { f.attention[1].id = f.attention[0].id; }, (f: ReturnType<typeof make>) => { f.attention[0].decision.actionId = "missing"; }, (f: ReturnType<typeof make>) => { f.attention[0].decision.confirmed = true; }, (f: ReturnType<typeof make>) => { f.attention[0].decision.kind = "not_action"; }]) { const file = make(); modify(file); assert.throws(() => openReviewFile(JSON.stringify(file)), /current review has not been changed/); }
});
test("different flags on the same passage have unique identities and independent decisions", () => {
  const source = "Submit your form by Tuesday, Nov. 8, 2032; inspect the posted instructions."; const r = extractLocally(source);
  assert.equal(r.attention.length, 2); assert.equal(new Set(r.attention.map(i => i.id)).size, 2);
  const changed = recordSourceDecision(r.attention[0], { kind: "clarify", note: "Ask about the weekday conflict.", actionId: null }, r.actions);
  assert.equal(changed.decision?.kind, "clarify"); assert.equal(r.attention[1].decision, undefined);
  assert.doesNotThrow(() => openReviewFile(saveReviewFile({ source, actions: r.actions, meta: { ...setup().meta, notes: r.notes, attention: [changed, r.attention[1]] } })));
});
test("a long flagged passage keeps its full context while a new action uses a shorter exact excerpt", () => {
  const source = "Participants must attach a signed consent form, including the guardian signature. " + "Read all published conditions carefully. ".repeat(35);
  // One long instruction is flagged; a short matched excerpt can still repair it.
  const instruction = "Participants must attach " + "the signed consent details ".repeat(50) + ".";
  const r = extractLocally(instruction); const flag = r.attention[0]; assert.ok(flag.evidence.quote.length > 1200);
  const repaired = createActionFromFlag(instruction, flag, { title: "Attach signed consent", quote: "Participants must attach the signed consent details", condition: "", note: "Recorded the attachment requirement; the original long passage still needs full reading." }, r.actions);
  assert.equal(repaired.item.evidence.quote, instruction); assert.ok(repaired.action.evidence[0].quote.length < 1200); assert.equal(repaired.action.approved, false);
  assert.throws(() => createActionFromFlag(instruction, flag, { title: "Attach", quote: source, condition: "", note: "Unrelated excerpt" }, r.actions), /exact excerpt/);
});
