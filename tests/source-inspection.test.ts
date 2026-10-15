import assert from "node:assert/strict";
import test from "node:test";
import { planSourceReturn, type SourceOrigin } from "../lib/source-inspection.ts";
import type { ActionView } from "../lib/action-view.ts";

test("source return reveals a hidden action without changing an already-visible view", () => {
  const view: ActionView = { filter: "review", ids: ["a"] };
  const origin: SourceOrigin = { kind: "action", id: "b", label: "Action 2" };
  assert.deepEqual(planSourceReturn(origin, ["a", "b"], [], view), { origin, view: { filter: "all", ids: [] } });
  assert.equal(planSourceReturn({ ...origin, id: "a" }, ["a", "b"], [], view).view, view);
  assert.deepEqual(view, { filter: "review", ids: ["a"] });
});

test("source return distinguishes flag and action identity and rejects replaced origins", () => {
  const view: ActionView = { filter: "approved", ids: [] };
  const origin: SourceOrigin = { kind: "flag", id: "shared", label: "Flagged passage" };
  assert.deepEqual(planSourceReturn(origin, [], ["shared"], view), { origin, view });
  assert.deepEqual(planSourceReturn(origin, ["shared"], [], view), { origin: null, view });
  assert.deepEqual(planSourceReturn({ ...origin, kind: "action" }, [], ["shared"], view), { origin: null, view });
  assert.deepEqual(planSourceReturn(null, [], [], view), { origin: null, view });
});
