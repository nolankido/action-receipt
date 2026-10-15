"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Plus, Quote, TriangleAlert } from "lucide-react";
import type { Evidence, ReviewedAction, SourceReviewItem } from "../lib/receipt.ts";
import { sourceReviewState, sourceReviewSummary, type DecisionInput } from "../lib/source-review.ts";

export type FlagActionInput = { title: string; quote: string; condition: string; note: string };
type Props = { items: SourceReviewItem[]; actions: ReviewedAction[]; disabled: boolean; focusedFlag?: { id: string; signal: number };
  onEvidence: (e: Evidence) => void; onAction: (id: string) => void;
  onRecord: (id: string, input: DecisionInput) => void; onCreate: (id: string, input: FlagActionInput) => void };

function FlagCard({ item, actions, disabled, onEvidence, onAction, onRecord, onCreate }: Omit<Props, "items"> & { item: SourceReviewItem }) {
  const [editor, setEditor] = useState<"decision" | "create" | null>(null);
  const [kind, setKind] = useState<DecisionInput["kind"]>(item.decision?.kind ?? "linked");
  const [actionId, setActionId] = useState(item.decision?.actionId ?? "");
  const [note, setNote] = useState(item.decision?.note ?? "");
  const [title, setTitle] = useState(""); const [condition, setCondition] = useState("");
  const [quote, setQuote] = useState(item.evidence.quote.length <= 1200 ? item.evidence.quote : "");
  const [error, setError] = useState("");
  const state = sourceReviewState(item, actions);
  const candidates = actions.filter(a => !a.omitted && a.evidenceValid && a.title.trim());
  const quoteTooLong = quote.trim().length > 1200;
  const exact = Boolean(quote.trim() && !quoteTooLong && item.evidence.quote.includes(quote.trim()));
  return <article className="source-review-card">
    <p className={`queue-status ${state.addressed ? "addressed" : "pending"}`}>{state.addressed ? <Check size={14} /> : <TriangleAlert size={14} />}{state.label}</p>
    <p className="queue-reason"><strong>Original flag:</strong> {item.reason}</p>
    <blockquote tabIndex={0} aria-label="Flagged source passage">{item.evidence.quote}</blockquote>
    <button className="text-button" onClick={() => onEvidence(item.evidence)}><Quote size={13} /> Inspect in the full notice <ArrowUpRight size={13} /></button>
    {item.decision && <div className="queue-decision"><strong>{item.decision.origin === "imported" ? "Loaded decision (unverified)" : "Your recorded decision"}</strong><p>{item.decision.kind === "linked" ? "Linked to an action" : item.decision.kind === "not_action" ? "Not an obligation" : "Needs clarification"}</p><p>{item.decision.note}</p>{item.decision.actionId && actions.some(a => a.id === item.decision!.actionId) && <button className="text-button" onClick={() => onAction(item.decision!.actionId!)}>Review linked action <ArrowUpRight size={13} /></button>}</div>}
    <div className="queue-tools"><button disabled={disabled || actions.length >= 20} onClick={() => { setEditor(editor === "create" ? null : "create"); setError(""); }}><Plus size={14} /> Create an action from this passage</button><button disabled={disabled} onClick={() => { setKind(item.decision?.kind ?? "linked"); setActionId(item.decision?.actionId ?? ""); setNote(item.decision?.note ?? note); setEditor(editor === "decision" ? null : "decision"); setError(""); }}>{item.decision ? "Recheck or change decision" : "Record a decision"}</button></div>
    {editor && <form className="queue-form" onSubmit={e => { e.preventDefault(); if (disabled) return; try { if (editor === "create") onCreate(item.id, { title, quote, condition, note }); else onRecord(item.id, { kind, note, actionId: kind === "linked" ? actionId : null }); setEditor(null); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "This decision could not be recorded."); } }}>
      <fieldset disabled={disabled}>
        {editor === "create" ? <><p>Write the missing action yourself. Its source is prefilled when the passage fits. It will still need approval and date review.</p><label>Action wording<input required maxLength={240} value={title} onChange={e => setTitle(e.target.value)} /></label><label>Exact supporting excerpt<textarea required rows={3} aria-invalid={quoteTooLong || Boolean(quote.trim() && !exact)} aria-describedby={`${item.id}-quote-hint`} value={quote} onChange={e => setQuote(e.target.value)} /></label><p id={`${item.id}-quote-hint`} className="field-hint" role="status">{quoteTooLong ? "The full paste is kept, but this excerpt is over 1,200 characters. Choose a shorter exact excerpt that keeps its applicable conditions, dates and times." : item.evidence.quote.length > 1200 ? "Copy a shorter exact excerpt from the passage above, up to 1,200 characters." : "Keep any conditions that apply. The quotation must be an exact excerpt from this passage."}{quote.trim() && !quoteTooLong && !exact ? " This excerpt does not match." : ""}</p><label>Condition or optionality (optional)<input maxLength={600} value={condition} onChange={e => setCondition(e.target.value)} /></label></> : <><label>How are you addressing this flag?<select value={kind} onChange={e => setKind(e.target.value as DecisionInput["kind"])}><option value="linked">Link to an existing action</option><option value="not_action">This is not an obligation</option><option value="clarify">I need clarification</option></select></label>{kind === "linked" && <label>Choose an action<select required value={actionId} onChange={e => setActionId(e.target.value)}><option value="">Select an action</option>{candidates.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>}</>}
        <label>{editor === "create" ? "How does this action address the flag?" : "Explain your decision"}<textarea required maxLength={600} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder={kind === "clarify" && editor !== "create" ? "What do you still need to ask or check?" : "Record your reasoning in your own words."} /></label>
        <p className="field-hint">Recording a decision does not approve an action, confirm a date or transfer a deadline. The original warning stays in the receipt.</p>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="queue-form-buttons"><button className="primary-button" type="submit" disabled={!note.trim() || (editor === "create" ? !title.trim() || !exact || actions.length >= 20 : kind === "linked" && !candidates.some(a => a.id === actionId))}>{editor === "create" ? "Add action and record link" : "Record checked decision"}</button><button className="text-button" type="button" onClick={() => setEditor(null)}>Cancel</button></div>
      </fieldset>
    </form>}
  </article>;
}

export default function SourceReviewQueue(props: Props) {
  const [all, setAll] = useState(false); const [selected, setSelected] = useState("");
  const focusAfterDecision = useRef(false);
  const summary = sourceReviewSummary(props.items, props.actions);
  const visible = all ? props.items : props.items.filter(item => !sourceReviewState(item, props.actions).addressed);
  const index = Math.max(0, visible.findIndex(item => item.id === selected)); const item = visible[index];
  useEffect(() => {
    if (!props.focusedFlag?.signal || !props.items.some(item => item.id === props.focusedFlag!.id)) return;
    setAll(true); setSelected(props.focusedFlag.id);
    const timer = setTimeout(() => { const choice = document.getElementById("queue-flag-choice"); choice?.scrollIntoView({ block: "nearest", behavior: "instant" }); choice?.focus({ preventScroll: true }); }, 0);
    return () => clearTimeout(timer);
  }, [props.focusedFlag?.id, props.focusedFlag?.signal]);
  useEffect(() => {
    if (focusAfterDecision.current) document.getElementById(item ? "queue-flag-choice" : "source-review-heading")?.focus();
    focusAfterDecision.current = false;
  }, [item?.id, props.items]);
  return <section className="source-review-queue" aria-labelledby="source-review-heading">
    <div className="queue-heading"><TriangleAlert size={17} /><h3 id="source-review-heading" tabIndex={-1}>Review the flagged passages</h3></div>
    <p className="queue-progress" role="status">{summary.addressed} of {summary.total} identified flags addressed. {summary.pending} still need attention.</p>
    <progress value={summary.addressed} max={summary.total} aria-label="Identified flags addressed" />
    <p className="queue-boundary">Read the whole notice for anything the rules missed. Linked actions still need approval and date checks.</p>
    <div className="queue-filter" role="group" aria-label="Filter source flags"><button aria-pressed={!all} onClick={() => setAll(false)}>Needs attention ({summary.pending})</button><button aria-pressed={all} onClick={() => setAll(true)}>All flags ({summary.total})</button></div>
    {item ? <><div className="queue-navigation"><button className="icon-button" aria-label="Previous flagged passage" disabled={index === 0} onClick={() => setSelected(visible[index - 1].id)}><ArrowLeft size={16} /></button><label className="sr-only" htmlFor="queue-flag-choice">Flagged passage</label><select id="queue-flag-choice" value={item.id} onChange={e => setSelected(e.target.value)}>{visible.map((item, i) => <option key={item.id} value={item.id}>{i + 1}. {item.evidence.quote.slice(0, 65)}</option>)}</select><button className="icon-button" aria-label="Next flagged passage" disabled={index === visible.length - 1} onClick={() => setSelected(visible[index + 1].id)}><ArrowRight size={16} /></button></div><FlagCard key={item.id} {...props} item={item} onRecord={(id, input) => { props.onRecord(id, input); focusAfterDecision.current = true; }} /></> : <p className="queue-empty">Every identified flag has a recorded decision linked to an approved action or marked as not an obligation. This does not confirm completeness or every date. Use All flags to revisit decisions.</p>}
  </section>;
}
