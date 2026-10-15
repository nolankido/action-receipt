import assert from "node:assert/strict";
import test from "node:test";
import { chooseActionView, planActionView, revealActionView } from "../lib/action-view.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { checklistEligible, editAction } from "../lib/receipt.ts";
import { planExports } from "../lib/export.ts";

const setup = () => extractLocally("Register by November 5, 2032. Pay the deposit by November 8, 2032. Email the coordinator by next Friday.").actions;

test("action views partition active and omitted items using actual checklist eligibility", () => {
  const a = setup();
  const actions = [a[0], { ...a[1], approved: true, dateConfirmed: false }, { ...a[2], omitted: true, approved: true }];
  assert.deepEqual(planActionView(actions, chooseActionView(actions, "all")).counts, { all: 3, review: 1, approved: 1, omitted: 1 });
  for (const [filter, id] of [["review", a[0].id], ["approved", a[1].id], ["omitted", a[2].id]] as const) {
    assert.deepEqual([...planActionView(actions, chooseActionView(actions, filter)).visibleIds], [id]);
  }
});

test("undated approved tasks stay approved while invalid evidence stays in review", () => {
  const a = setup(); const actions = [{ ...a[2], approved: true }, { ...a[0], approved: true, evidenceValid: false }];
  const view = planActionView(actions, chooseActionView(actions, "approved"));
  assert.deepEqual([...view.visibleIds], [a[2].id]);
  assert.equal(view.counts.review, 1);
  assert.equal(planExports(actions).calendar.length, 0);
});

test("approving a card keeps it in the selected review batch until explicit refresh", () => {
  const actions = setup(); const view = chooseActionView(actions, "review");
  const changed = actions.map((a, index) => index === 1 ? { ...a, approved: true } : a);
  const plan = planActionView(changed, view);
  assert.deepEqual([...plan.visibleIds], actions.map(a => a.id));
  assert.equal(plan.counts.review, 2); assert.equal(plan.refreshNeeded, true);
  const refreshed = planActionView(changed, chooseActionView(changed, "review"));
  assert.deepEqual([...refreshed.visibleIds], [actions[0].id, actions[2].id]);
  assert.equal(refreshed.refreshNeeded, false);
});

test("editing or omitting an approved card does not remove its in-progress fields", () => {
  const actions = setup().map(a => ({ ...a, approved: true }));
  const view = chooseActionView(actions, "approved");
  for (const replacement of [editAction(actions[0], { title: "Check the edited registration instruction" }), editAction(actions[0], { omitted: true })]) {
    const changed = [replacement, ...actions.slice(1)];
    const plan = planActionView(changed, view);
    assert.equal(plan.visibleIds.has(replacement.id), true);
    assert.equal(plan.refreshNeeded, true);
    assert.equal(planActionView(changed, chooseActionView(changed, "approved")).visibleIds.has(replacement.id), false);
    assert.equal(checklistEligible(replacement), false);
  }
});

test("targeted navigation reveals hidden actions and preserves a view when already visible", () => {
  const actions = setup(); const review = chooseActionView(actions, "review");
  assert.equal(revealActionView(review, actions[0].id), review);
  const approved = chooseActionView(actions, "approved");
  const revealed = revealActionView(approved, actions[0].id);
  assert.equal(revealed.filter, "all");
  assert.equal(planActionView(actions, revealed).visibleIds.has(actions[0].id), true);
});

test("view selection and refresh leave receipt content and full export eligibility unchanged", () => {
  const actions = setup().map((a, index) => ({ ...a, approved: index !== 0 }));
  const before = JSON.stringify(actions); const exported = planExports(actions).checklist.map(a => a.id);
  for (const filter of ["all", "review", "approved", "omitted"] as const) {
    const view = chooseActionView(actions, filter); Object.freeze(view.ids);
    planActionView(actions, view); revealActionView(view, actions[0].id);
    assert.equal(JSON.stringify(actions), before);
    assert.deepEqual(planExports(actions).checklist.map(a => a.id), exported);
  }
  assert.equal(planActionView([], chooseActionView([], "review")).visibleCount, 0);
});
