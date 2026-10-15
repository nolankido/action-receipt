import { planExports } from "./export.ts";
import type { ReviewedAction, SourceReviewItem } from "./receipt.ts";
import { sourceReviewState } from "./source-review.ts";

export type ReviewTarget = { kind: "flag" | "action"; id: string } | { kind: "source" | "preview" };

// Navigation only. Waiting for external clarification must not trap the user or
// grant an approval/date confirmation. Export eligibility has its own selectors.
export function planReviewGuide(actions: ReviewedAction[], items: SourceReviewItem[]) {
  const flags = items.map(item => ({ item, state: sourceReviewState(item, actions) }));
  const decisions = flags.filter(({ state }) => ["decision", "recheck", "unavailable", "changed"].includes(state.code));
  const waiting = flags.filter(({ state }) => state.code === "clarify");
  const plan = planExports(actions);
  const unchecked = plan.notInChecklist.filter(({ action }) => !action.omitted);
  const linked = flags.find(({ state }) => state.code === "approval")?.item.decision?.actionId;
  const nextAction = unchecked.find(({ action }) => action.id === linked)?.action ?? unchecked[0]?.action;
  const target: ReviewTarget = decisions.length ? { kind: "flag", id: decisions[0].item.id }
    : nextAction ? { kind: "action", id: nextAction.id }
    : plan.checklist.length ? { kind: "preview" } : { kind: "source" };
  return { target, decisions: decisions.length, waiting: waiting.length, unchecked: unchecked.length,
    approved: plan.checklist.length, calendar: plan.calendar.length, checklistOnly: plan.checklist.length - plan.calendar.length,
    optionalDateAction: plan.notInCalendar.find(({ action }) => plan.checklist.some(a => a.id === action.id))?.action.id ?? null };
}
