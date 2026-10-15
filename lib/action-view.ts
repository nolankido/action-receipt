import { checklistEligible, type ReviewedAction } from "./receipt.ts";

export const actionViewFilters = ["all", "review", "approved", "omitted"] as const;
export type ActionViewFilter = typeof actionViewFilters[number];
export type ActionView = { filter: ActionViewFilter; ids: string[] };
export const actionViewLabels: Record<ActionViewFilter, string> = {
  all: "All actions", review: "Needs review", approved: "Approved", omitted: "Omitted",
};

function matches(action: ReviewedAction, filter: ActionViewFilter): boolean {
  if (filter === "all") return true;
  if (filter === "omitted") return action.omitted;
  if (filter === "approved") return checklistEligible(action);
  return !action.omitted && !checklistEligible(action);
}

// A selected view is a stable set of IDs. Status edits must not remove an input
// while someone is typing, or eject a just-approved card from keyboard focus.
// Choosing/refreshing a view is explicit and changes no receipt data.
export function chooseActionView(actions: readonly ReviewedAction[], filter: ActionViewFilter): ActionView {
  return { filter, ids: filter === "all" ? [] : actions.filter(a => matches(a, filter)).map(a => a.id) };
}

export function planActionView(actions: readonly ReviewedAction[], view: ActionView) {
  const counts = Object.fromEntries(actionViewFilters.map(filter => [filter, actions.filter(a => matches(a, filter)).length])) as Record<ActionViewFilter, number>;
  const selected = new Set(view.ids);
  const visible = view.filter === "all" ? [...actions] : actions.filter(a => selected.has(a.id));
  const current = actions.filter(a => matches(a, view.filter)).map(a => a.id);
  const refreshNeeded = view.filter !== "all" && (current.length !== view.ids.length || current.some((id, index) => id !== view.ids[index]));
  return { counts, visibleIds: new Set(visible.map(a => a.id)), visibleCount: visible.length, refreshNeeded };
}

// Source flags, the guide and excluded-download links can target a card hidden
// by the selected view. Reveal it before the existing card-focus effect runs.
export function revealActionView(view: ActionView, id: string): ActionView {
  return view.filter === "all" || view.ids.includes(id) ? view : { filter: "all", ids: [] };
}
