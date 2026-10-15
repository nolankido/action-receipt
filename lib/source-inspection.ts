import { revealActionView, type ActionView } from "./action-view.ts";

export type SourceOrigin = { kind: "action" | "flag"; id: string; label: string };

// Presentation only. A replaced receipt must not send focus to a stale origin,
// and returning to a filtered-out action must reveal it before focus moves.
export function planSourceReturn(origin: SourceOrigin | null, actionIds: readonly string[], flagIds: readonly string[], view: ActionView) {
  if (!origin || !(origin.kind === "action" ? actionIds : flagIds).includes(origin.id)) return { origin: null, view };
  return { origin, view: origin.kind === "action" ? revealActionView(view, origin.id) : view };
}
