import { calendarEligible, manualAction, nextManualNumber, type ReviewedAction, type SourceDecision, type SourceReviewItem } from "./receipt.ts";

export type DecisionInput = Pick<SourceDecision, "kind" | "note" | "actionId">;
const signature = (a: ReviewedAction) => JSON.stringify([a.title, a.condition, a.date, a.time, a.utcOffset, a.requiresTime, a.evidence.map(e => e.quote), a.dateEvidence.map(e => e.quote)]);
export function recordSourceDecision(item: SourceReviewItem, input: DecisionInput, actions: ReviewedAction[]): SourceReviewItem {
  const note = input.note.trim();
  if (!note || note.length > 600) throw new Error("Explain your decision in 1 to 600 characters.");
  if (!["linked", "not_action", "clarify"].includes(input.kind)) throw new Error("Choose a supported review decision.");
  const action = actions.find(a => a.id === input.actionId);
  if (input.kind === "linked" && (!action || action.omitted || !action.evidenceValid || !action.title.trim())) throw new Error("Choose an active action with matched evidence and nonempty wording.");
  return { ...item, decision: { kind: input.kind, note, actionId: input.kind === "linked" ? action!.id : null, origin: "user", confirmed: true, actionSnapshot: input.kind === "linked" ? signature(action!) : null } };
}
export function createActionFromFlag(source: string, item: SourceReviewItem, input: { title: string; quote: string; condition: string; note: string }, actions: ReviewedAction[]) {
  if (actions.length >= 20) throw new Error("The receipt has reached its 20-action limit.");
  if (!item.evidence.quote.includes(input.quote.trim()) || !input.quote.trim()) throw new Error("Use an exact excerpt from this flagged passage.");
  const action = manualAction(source, input.title, input.quote, input.condition, nextManualNumber(actions));
  const updated = recordSourceDecision(item, { kind: "linked", note: input.note, actionId: action.id }, [...actions, action]);
  return { action, item: updated };
}
export type SourceReviewStatus = "decision" | "recheck" | "clarify" | "not_action" | "unavailable" | "changed" | "approval" | "linked";
export function sourceReviewState(item: SourceReviewItem, actions: ReviewedAction[]): { addressed: boolean; code: SourceReviewStatus; label: string } {
  const d = item.decision;
  if (!d) return { addressed: false, code: "decision", label: "Decision needed" };
  if (!d.confirmed) return { addressed: false, code: "recheck", label: d.origin === "imported" ? "Loaded decision needs rechecking" : "Decision needs rechecking" };
  if (d.kind === "clarify") return { addressed: false, code: "clarify", label: "Awaiting clarification" };
  if (d.kind === "not_action") return { addressed: true, code: "not_action", label: "Reviewed: not an obligation" };
  const a = actions.find(a => a.id === d.actionId);
  if (!a || a.omitted || !a.evidenceValid || !a.title.trim()) return { addressed: false, code: "unavailable", label: "Linked action is unavailable" };
  if (d.actionSnapshot !== signature(a)) return { addressed: false, code: "changed", label: "Linked action changed; recheck this decision" };
  if (!a.approved) return { addressed: false, code: "approval", label: "Linked action still needs approval" };
  return { addressed: true, code: "linked", label: calendarEligible(a) ? "Linked to approved action with confirmed date" : "Linked to approved checklist item; date unconfirmed" };
}
export function sourceReviewSummary(items: SourceReviewItem[], actions: ReviewedAction[]) {
  const addressed = items.filter(item => sourceReviewState(item, actions).addressed).length;
  return { total: items.length, addressed, pending: items.length - addressed };
}
export function sourceDecisionLines(item: SourceReviewItem, actions: ReviewedAction[]): string[] {
  const d = item.decision; const state = sourceReviewState(item, actions);
  if (!d) return [`Review status: ${state.label}`];
  const action = actions.find(a => a.id === d.actionId);
  return [`Review status: ${state.label}`, `Decision origin: ${d.origin === "imported" ? "Imported file; unverified until rechecked" : "Recorded by user"}`,
    `Decision: ${d.kind === "linked" ? "Link to an action" : d.kind === "not_action" ? "Not an obligation" : "Needs clarification"}`,
    `Decision note: ${d.note}`, ...(d.kind === "linked" ? [`Linked action: ${action?.title || "Unavailable"}; association supplied by user, not an inferred deadline`] : []),
    "This source decision does not approve an action or confirm a date."];
}
