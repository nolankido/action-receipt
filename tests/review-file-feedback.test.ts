import assert from "node:assert/strict";
import test from "node:test";
import { planReviewFileFeedback, type ReviewFileFeedback } from "../lib/review-file-feedback.ts";
import { reviewContentStamp } from "../lib/review-session.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { demoScenario } from "../lib/demo-scenario.ts";

const content = () => ({ source: demoScenario.source, title: demoScenario.title, ...extractLocally(demoScenario.source), mode: "local" as const, sampleId: null, restored: false });

test("download feedback follows actual receipt edits without claiming a verified save", () => {
  const review = content(); const stamp = reviewContentStamp(review);
  const feedback: ReviewFileFeedback = { kind: "download", contentStamp: stamp };
  const current = planReviewFileFeedback(feedback, stamp);
  assert.equal(current.stale, false); assert.equal(current.action, null);
  assert.match(current.message, /does not verify/);
  for (const changed of [{ ...review, title: "Renamed" }, { ...review, actions: review.actions.map(a => ({ ...a, approved: true })) }, { ...review, notes: ["A committed note"] }]) {
    const plan = planReviewFileFeedback(feedback, reviewContentStamp(changed));
    assert.equal(plan.stale, true); assert.equal(plan.action, "save");
  }
  assert.equal(planReviewFileFeedback(feedback, reviewContentStamp(review)).stale, false);
  assert.deepEqual(feedback, { kind: "download", contentStamp: stamp });
});

test("file-operation errors have distinct recovery actions and retain exact validation messages", () => {
  for (const operation of ["open", "save"] as const) {
    const feedback: ReviewFileFeedback = { kind: "error", operation, message: "The exact validation failure." };
    const plan = planReviewFileFeedback(feedback, "unrelated content");
    assert.equal(plan.message, feedback.message); assert.equal(plan.action, operation); assert.equal(plan.stale, false);
    assert.match(plan.title, operation === "open" ? /not opened/ : /not requested/);
  }
  for (const kind of ["opened", "recovered"] as const) {
    const plan = planReviewFileFeedback({ kind, message: "Check approvals and dates again." }, "stamp");
    assert.equal(plan.action, null); assert.match(plan.title, /fresh checking/);
  }
});
