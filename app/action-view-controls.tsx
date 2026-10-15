"use client";

import { RotateCcw } from "lucide-react";
import { actionViewFilters, actionViewLabels, type ActionView, type ActionViewFilter, type planActionView } from "../lib/action-view.ts";

export default function ActionViewControls({ view, plan, disabled, onChoose }: {
  view: ActionView; plan: ReturnType<typeof planActionView>; disabled: boolean;
  onChoose: (filter: ActionViewFilter) => void;
}) {
  return <div className="action-view-controls">
    <div className="action-list-label"><h3>Check each action</h3><span role="status" aria-live="polite">Showing {plan.visibleCount} of {plan.counts.all} actions</span></div>
    <div className="action-view-filters" role="group" aria-label="Action views">{actionViewFilters.map(filter => <button key={filter} aria-pressed={view.filter === filter} aria-controls="action-list-items" disabled={disabled} onClick={() => onChoose(filter)}>{actionViewLabels[filter]}<span>{plan.counts[filter]}</span></button>)}</div>
    <p className="action-view-boundary">Views change this list only. Downloads use all approved actions.</p>
    {view.filter !== "all" && <div className={`action-view-refresh ${plan.refreshNeeded ? "has-updates" : ""}`}><p>{plan.refreshNeeded ? "Some actions changed status. Refresh this view when you’re ready." : "Actions stay in place while you review. Refresh to update this view."}</p><button className="text-button" disabled={disabled} onClick={() => onChoose(view.filter)}><RotateCcw size={13} /> Refresh view</button></div>}
  </div>;
}
