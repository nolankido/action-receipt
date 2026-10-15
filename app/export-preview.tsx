"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Download, FileText, ShieldCheck, X } from "lucide-react";
import { calendarText, checklistText, modeDescription, planExports, reviewedDateText, type ReceiptMeta } from "../lib/export.ts";
import { checklistEligible, type ReviewedAction } from "../lib/receipt.ts";
import { sourceDecisionLines, sourceReviewSummary } from "../lib/source-review.ts";

export default function ExportPreview({ actions, meta, onClose, onDownload, onReviewAction }: {
  actions: ReviewedAction[]; meta: ReceiptMeta; onClose: () => void;
  onDownload: (kind: "checklist" | "calendar", text: string, count: number) => void;
  onReviewAction: (id: string, field: "title" | "date") => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<"checklist" | "calendar">("checklist");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  // Use the same eligibility plan and serializers as the actual downloads.
  const plan = planExports(actions);
  const included = kind === "checklist" ? plan.checklist : plan.calendar;
  const excluded = kind === "checklist" ? plan.notInChecklist : plan.notInCalendar;
  const text = kind === "checklist" ? checklistText(actions, meta) : calendarText(actions, meta);
  const flags = sourceReviewSummary(meta.attention ?? [], actions);
  return <dialog ref={dialog} className="export-preview" aria-labelledby="export-preview-title" aria-describedby="export-preview-description" onCancel={onClose} onClose={onClose}>
    <div className="preview-header"><div><p className="eyebrow">BEFORE YOU DOWNLOAD</p><h2 id="export-preview-title">Check your receipt.</h2></div><button className="icon-button" onClick={onClose} aria-label="Close download preview"><X size={21} /></button></div>
    <p id="export-preview-description">See the included actions and exact file content. Opening this preview does not approve or change anything.</p>
    <div className="preview-counts"><span><Check size={15} /><strong>{plan.checklist.length}</strong> checklist {plan.checklist.length === 1 ? "task" : "tasks"}</span><span><CalendarDays size={15} /><strong>{plan.calendar.length}</strong> calendar {plan.calendar.length === 1 ? "entry" : "entries"}</span></div>
    <p className="preview-notice"><strong>{meta.title || "Untitled notice"}</strong><span>{modeDescription(meta.mode, meta.restored)}</span></p>
    <div className="preview-format" role="group" aria-label="Choose download format"><button aria-pressed={kind === "checklist"} onClick={() => setKind("checklist")}><FileText size={15} /> Checklist (.md)</button><button aria-pressed={kind === "calendar"} onClick={() => setKind("calendar")}><CalendarDays size={15} /> Calendar (.ics)</button></div>
    <section className="preview-included" aria-labelledby="preview-included-heading"><h3 id="preview-included-heading">Included in this {kind === "checklist" ? "checklist" : "calendar"} ({included.length})</h3>
      {included.length ? <ol>{included.map(a => <li key={a.id}><strong>{a.title}</strong>{a.condition && <p>Condition: {a.condition}</p>}<p>{reviewedDateText(a)}</p>{kind === "calendar" && a.requiresTime && <p className="preview-calendar-note">The file stores this cutoff as a UTC instant. Your calendar may display it in another time zone.</p>}</li>)}</ol> : <p className="preview-empty">No actions qualify yet. Return to the review and use the reasons below to finish checking them.</p>}
    </section>
    {excluded.length > 0 && <section className="preview-excluded" aria-labelledby="preview-excluded-heading"><h3 id="preview-excluded-heading">Not included ({excluded.length})</h3><ul>{excluded.map(({ action, reason }) => <li key={action.id}><strong>{action.title.trim() || "Action wording is empty"}</strong><p>{reason}</p><button className="text-button preview-review-action" onClick={() => onReviewAction(action.id, kind === "calendar" && checklistEligible(action) ? "date" : "title")}>Review this action <ArrowLeft size={13} /></button></li>)}</ul><p>These titles and exclusion reasons are shown here to help you review. They are not added as tasks or events to the download.</p></section>}
    {flags.total > 0 && <details className="preview-decisions"><summary>Source decisions: {flags.addressed} addressed, {flags.pending} need attention</summary><p>Counts cover identified flags only. Decisions do not certify completeness or confirm dates.</p><ul>{meta.attention!.map(item => <li key={item.id}><strong>{item.reason}</strong>{sourceDecisionLines(item, actions).map((line, i) => <p key={i}>{line}</p>)}</li>)}</ul></details>}
    <div className="preview-disclosure"><ShieldCheck size={18} /><p>Downloads include supporting quotations, original warnings, recorded decision notes, {meta.notes.length} notice {meta.notes.length === 1 ? "note" : "notes"} and {meta.attention?.length ?? 0} flagged source {meta.attention?.length === 1 ? "passage" : "passages"}. Context can mention unapproved instructions. Inspect the exact text below before sharing. A calendar download adds nothing to a calendar automatically.</p></div>
    <details className="preview-file" key={kind}><summary>Inspect exact {kind === "checklist" ? "Markdown" : "iCalendar"} file content</summary><pre tabIndex={0} aria-label={`Exact ${kind} download text`}>{text}</pre></details>
    <div className="preview-footer"><button className="text-button" onClick={onClose}><ArrowLeft size={15} /> Return to review</button><button className="primary-button" disabled={!included.length} onClick={() => onDownload(kind, text, included.length)}><Download size={15} /> Download {kind === "checklist" ? "checklist" : "calendar"}</button></div>
  </dialog>;
}
