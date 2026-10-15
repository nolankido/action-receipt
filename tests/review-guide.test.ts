import assert from "node:assert/strict";
import test from "node:test";
import { extractLocally } from "../lib/local-extraction.ts";
import { planReviewGuide } from "../lib/review-guide.ts";
import { recordSourceDecision } from "../lib/source-review.ts";
import { editAction } from "../lib/receipt.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";
import { calendarText, checklistText } from "../lib/export.ts";
import { reviewScenario } from "../lib/samples.ts";

const setup = () => extractLocally(reviewScenario.source);
test("the guide starts with an undecided source flag and does not change review state", () => {
  const r = setup(); const before = JSON.stringify(r); const p = planReviewGuide(r.actions, r.attention);
  assert.deepEqual(p.target, { kind: "flag", id: r.attention[0].id });
  assert.equal(p.decisions, 3); assert.equal(p.unchecked, 4); assert.equal(p.approved, 0); assert.equal(p.calendar, 0);
  assert.equal(JSON.stringify(r), before);
});
test("a user-recorded clarification stays pending without trapping navigation", () => {
  const r = setup(); const items = r.attention.map(item => recordSourceDecision(item, { kind: "clarify", note: "Ask the organizer before deciding.", actionId: null }, r.actions));
  const p = planReviewGuide(r.actions, items); assert.equal(p.decisions, 0); assert.equal(p.waiting, 3);
  assert.deepEqual(p.target, { kind: "action", id: r.actions[0].id });
  const approved = r.actions.map(a => ({ ...a, approved: true })); const after = planReviewGuide(approved, items);
  assert.equal(after.target.kind, "preview"); assert.equal(after.waiting, 3); assert.equal(after.calendar, 0); assert.equal(after.checklistOnly, 4);
});
test("an unapproved linked action is suggested before unrelated unchecked actions", () => {
  const r = setup(); const linked = r.actions[2]; const items = r.attention.map(item => recordSourceDecision(item, { kind: "linked", actionId: linked.id, note: "Review the linked instruction and its source." }, r.actions));
  assert.deepEqual(planReviewGuide(r.actions, items).target, { kind: "action", id: linked.id });
  assert.equal(planReviewGuide(r.actions, items).decisions, 0);
});
test("changed and unavailable links return to their exact source flag", () => {
  const r = setup(); const a = r.actions[0]; const flag = recordSourceDecision(r.attention[0], { kind: "linked", actionId: a.id, note: "Check this interpretation against the passage." }, r.actions);
  for (const changed of [editAction(a, { title: "Different wording" }), editAction(a, { omitted: true }), { ...a, evidenceValid: false }]) {
    const p = planReviewGuide([changed, ...r.actions.slice(1)], [flag]);
    assert.deepEqual(p.target, { kind: "flag", id: flag.id }); assert.equal(p.decisions, 1);
  }
});
test("opening a saved clarification needs a real recheck instead of counting it as waiting", () => {
  const r = setup(); const items = r.attention.map(item => recordSourceDecision(item, { kind: "clarify", note: "Unresolved, ask the organizer.", actionId: null }, r.actions));
  const file = saveReviewFile({ source: reviewScenario.source, actions: r.actions, meta: { mode: "local", title: "Practice", createdAt: new Date("2026-10-15T00:00:00Z"), receiptId: "guide", notes: r.notes, attention: items } });
  const loaded = openReviewFile(file); const p = planReviewGuide(loaded.actions, loaded.meta.attention!);
  assert.equal(p.waiting, 0); assert.equal(p.decisions, 3); assert.equal(p.target.kind, "flag"); assert.equal(p.approved, 0);
});
test("empty, all-omitted and invalid actions never produce a ready-to-download target", () => {
  const r = setup(); assert.equal(planReviewGuide([], []).target.kind, "source");
  assert.equal(planReviewGuide(r.actions.map(a => ({ ...a, omitted: true, approved: true })), []).target.kind, "source");
  const invalid = { ...r.actions[0], approved: true, evidenceValid: false }; const p = planReviewGuide([invalid], []);
  assert.equal(p.approved, 0); assert.equal(p.unchecked, 1); assert.deepEqual(p.target, { kind: "action", id: invalid.id });
});
test("calendar guidance is optional and uses actual export eligibility, including timed cutoffs", () => {
  const r = extractLocally("Submit the form by December 2, 2032 at 5 pm UTC-10:00. Bring your ID on December 3, 2032.");
  const all = r.actions.map(a => ({ ...a, approved: true, dateConfirmed: true }));
  const bad = { ...all[0], utcOffset: "", dateConfirmed: true };
  const p = planReviewGuide([bad, all[1]], []);
  assert.equal(p.target.kind, "preview"); assert.equal(p.approved, 2); assert.equal(p.calendar, 1); assert.equal(p.checklistOnly, 1); assert.equal(p.optionalDateAction, bad.id);
  const ready = planReviewGuide(all, []); assert.equal(ready.calendar, 2); assert.equal(ready.optionalDateAction, null);
});
test("preview remains available with unresolved flags but exports preserve uncertainty and gates", () => {
  const r = setup(); const actions = r.actions.map(a => ({ ...a, approved: true }));
  const items = r.attention.map(item => recordSourceDecision(item, { kind: "clarify", note: "Organizer confirmation still needed.", actionId: null }, actions));
  const p = planReviewGuide(actions, items); assert.equal(p.target.kind, "preview");
  const meta = { mode: "local" as const, title: "Practice", createdAt: new Date("2026-10-15T00:00:00Z"), receiptId: "guide", notes: r.notes, attention: items };
  const md = checklistText(actions, meta); const ics = calendarText(actions, meta);
  assert.equal((md.match(/^- \[ \]/gm) ?? []).length, p.approved); assert.match(md, /Awaiting clarification/); assert.match(md, /Organizer confirmation still needed/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, p.calendar); assert.equal(p.calendar, 0);
});
