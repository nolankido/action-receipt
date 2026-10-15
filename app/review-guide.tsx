"use client";

import { ArrowRight, CalendarDays, Eye, MessageCircleQuestion, Route, TriangleAlert } from "lucide-react";
import { planReviewGuide, type ReviewTarget } from "../lib/review-guide.ts";
import type { noticeInputState, ReviewedAction, SourceReviewItem } from "../lib/receipt.ts";

export default function ReviewGuide({ actions, items, hasResults, canScan, inputStatus, disabled, onGo, onScan, onPaste, onDate, questionCount, onQuestions }: {
  actions: ReviewedAction[]; items: SourceReviewItem[]; hasResults: boolean; canScan: boolean; disabled: boolean;
  inputStatus: ReturnType<typeof noticeInputState>["kind"];
  onGo: (target: ReviewTarget) => void; onScan: () => void; onPaste: () => void; onDate: (id: string) => void;
  questionCount: number; onQuestions: () => void;
}) {
  const plan = planReviewGuide(actions, items);
  const copy = {
    flag: ["Check a flagged passage.", "Decide what it means or repair a missed instruction from its exact source. A source decision and an action approval are separate.", "Review this passage"],
    action: ["Check the next action.", "Check its wording, conditions and source. Approve it if it applies, or omit it. An unresolved date can stay in the checklist.", "Review this action"],
    source: ["Read the complete notice.", "Nothing qualifies for export yet. Check for missed instructions, add an action from its source, or restore an omitted action.", "Read the notice"],
    preview: ["Preview your approved receipt.", "The checklist keeps approved tasks, including unresolved dates. The calendar includes only tasks with complete, confirmed dates.", "Preview downloads"],
  }[plan.target.kind];
  const inputCopy = {
    long: ["Shorten the notice to continue.", "The entire paste is kept. The limit is 15,000 characters. Edit the source deliberately before scanning; nothing has been extracted from a cut-off copy.", "Edit notice"],
    short: ["Complete the notice to continue.", "The notice needs at least 30 characters, excluding surrounding spaces. Include its complete instructions, dates and conditions.", "Edit notice"],
    empty: ["Paste a notice to begin.", "Paste the complete text, then scan it with local rules. Read the source to catch anything the rules miss.", "Paste a notice"],
    ready: ["Find actions in this notice.", "Scan the complete text with local rules, then check every action against the source. Nothing is approved automatically.", "Find actions locally"],
  }[inputStatus];
  const heading = disabled ? "Your workspace is loading." : !hasResults ? inputCopy[0] : copy[0];
  return <section className="review-guide" aria-labelledby="review-guide-heading">
    <div className="guide-intro"><span className="guide-icon"><Route size={20} /></span><div><p className="eyebrow">YOUR NEXT STEP</p><h2 id="review-guide-heading">{heading}</h2><p>{disabled ? "The next step will update when processing finishes." : !hasResults ? inputCopy[1] : copy[1]}</p></div></div>
    {hasResults && <dl className="guide-counts"><div><dt>Flag decisions</dt><dd>{plan.decisions} to check</dd></div><div><dt>Action review</dt><dd>{plan.unchecked} to check</dd></div><div><dt>Downloads</dt><dd>{plan.approved} checklist · {plan.calendar} calendar</dd></div></dl>}
    {hasResults && plan.waiting > 0 && <p className="guide-waiting"><TriangleAlert size={15} /><span>{plan.waiting} source {plan.waiting === 1 ? "flag is" : "flags are"} awaiting clarification. {plan.approved > 0 && plan.decisions === 0 && plan.unchecked === 0 ? "You can preview approved items while clarification is pending." : "Continue reviewing other items while clarification is pending."} Original flags and decision notes remain in the files.</span></p>}
    <div className="guide-buttons"><button className="primary-button" disabled={disabled} onClick={() => hasResults ? onGo(plan.target) : canScan ? onScan() : onPaste()}>{hasResults ? copy[2] : inputCopy[2]}<ArrowRight size={15} /></button>
      {hasResults && actions.length > 0 && plan.target.kind !== "preview" && <button className="text-button" disabled={disabled} onClick={() => onGo({ kind: "preview" })}><Eye size={15} /> Inspect current downloads</button>}
      {hasResults && plan.target.kind === "preview" && plan.optionalDateAction && <button className="text-button" disabled={disabled} onClick={() => onDate(plan.optionalDateAction!)}><CalendarDays size={15} /> Review optional calendar dates ({plan.checklistOnly})</button>}
      {hasResults && questionCount > 0 && <button className="text-button" disabled={disabled} onClick={onQuestions}><MessageCircleQuestion size={15} /> Prepare clarification questions ({questionCount})</button>}
    </div>
    <p className="guide-boundary">{hasResults ? "This guide describes the current review, not completeness. Calendar export is optional. Never guess a date to finish." : "Your notice stays in this browser. No account, credits or model download."}</p>
  </section>;
}
