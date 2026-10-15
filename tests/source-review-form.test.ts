import test from "node:test";
import assert from "node:assert/strict";
import { planSourceReviewForm, type SourceReviewFields } from "../lib/source-review-form.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { reviewScenario } from "../lib/samples.ts";
import { createActionFromFlag, recordSourceDecision } from "../lib/source-review.ts";

const setup = () => { const result = extractLocally(reviewScenario.source); return { ...result, item: result.attention.find(i => i.evidence.quote.includes("signed consent"))! }; };
const fields = (): SourceReviewFields => ({ kind: "linked", actionId: "", note: "", title: "", quote: "", condition: "" });

test("source form explains unavailable links and admits clarification without an action", () => {
  const s = setup(); const f = { ...fields(), note: "Ask the coordinator." };
  const invalid = s.actions.map(a => ({ ...a, evidenceValid: false }));
  const blocked = planSourceReviewForm("decision", f, s.item.evidence.quote, invalid);
  assert.equal(blocked.ready, false); assert.match(blocked.message, /No active action/);
  const clarify = { ...f, kind: "clarify" as const };
  assert.equal(planSourceReviewForm("decision", clarify, s.item.evidence.quote, invalid).ready, true);
  const recorded = recordSourceDecision(s.item, { ...clarify, actionId: null }, invalid);
  assert.equal(recorded.decision?.kind, "clarify");
  assert.ok(invalid.every(a => !a.approved && !a.dateConfirmed));
});

test("create form gates exact excerpt, explanation and capacity without truncation or automatic approval", () => {
  const s = setup(); const f = { ...fields(), title: "Attach signed consent", quote: s.item.evidence.quote, note: "The required attachment was missing." };
  assert.equal(planSourceReviewForm("create", f, s.item.evidence.quote, s.actions).ready, true);
  const result = createActionFromFlag(reviewScenario.source, s.item, f, s.actions);
  assert.equal(result.action.approved, false); assert.equal(result.action.dateConfirmed, false);
  for (const patch of [{ title: " " }, { quote: "Not in the passage" }, { quote: "x".repeat(1201) }, { note: " " }]) assert.equal(planSourceReviewForm("create", { ...f, ...patch }, s.item.evidence.quote, s.actions).ready, false);
  assert.equal(planSourceReviewForm("create", f, s.item.evidence.quote, Array.from({ length: 20 }, () => s.actions[0])).ready, false);
  assert.equal(f.quote, s.item.evidence.quote);
});

test("decision form candidates match the domain link gate and wording remains unmodified", () => {
  const s = setup(); const a = s.actions[0]; const f = { ...fields(), actionId: a.id, note: "Checked this action against the flagged passage." };
  assert.equal(planSourceReviewForm("decision", f, s.item.evidence.quote, [a]).ready, true);
  const before = JSON.stringify(a); recordSourceDecision(s.item, f, [a]); assert.equal(JSON.stringify(a), before);
  for (const patch of [{ omitted: true }, { evidenceValid: false }, { title: " " }]) assert.equal(planSourceReviewForm("decision", f, s.item.evidence.quote, [{ ...a, ...patch }]).ready, false);
  assert.equal(planSourceReviewForm("decision", { ...f, note: " " }, s.item.evidence.quote, [a]).ready, false);
});
