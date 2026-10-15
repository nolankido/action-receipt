"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Plus, Quote, TriangleAlert } from "lucide-react";
import type { Evidence, ReviewedAction, SourceReviewItem } from "../lib/receipt.ts";
import { sourceReviewState, sourceReviewSummary, type DecisionInput } from "../lib/source-review.ts";
import SourceReviewEditor from "./source-review-editor.tsx";
import type { SourceEditorMode, SourceReviewFields } from "../lib/source-review-form.ts";

export type FlagActionInput = { title: string; quote: string; condition: string; note: string };
type Props = { items: SourceReviewItem[]; actions: ReviewedAction[]; disabled: boolean; focusedFlag?: { id: string; signal: number };
  onEvidence: (e: Evidence, flagId: string, trigger: HTMLElement) => void; onAction: (id: string) => void;
  onRecord: (id: string, input: DecisionInput) => void; onCreate: (id: string, input: FlagActionInput) => void };

function FlagCard({ item, actions, disabled, onEvidence, onAction, onRecord, onCreate }: Omit<Props, "items"> & { item: SourceReviewItem }) {
  const [editor, setEditor] = useState<SourceEditorMode | null>(null);
  const [fields, setFields] = useState<SourceReviewFields>(() => ({ kind: item.decision?.kind ?? "linked", actionId: item.decision?.actionId ?? "", note: item.decision?.note ?? "", title: "", condition: "", quote: item.evidence.quote.length <= 1200 ? item.evidence.quote : "" }));
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const createButton = useRef<HTMLButtonElement>(null); const decisionButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!editor) return;
    const first = formRef.current?.querySelector<HTMLElement>("input, select, textarea");
    first?.scrollIntoView({ block: "nearest", behavior: "instant" }); first?.focus({ preventScroll: true });
  }, [editor]);
  function closeEditor() { const origin = editor === "create" ? createButton : decisionButton; setEditor(null); setError(""); origin.current?.focus(); }
  const state = sourceReviewState(item, actions);
  return <article className="source-review-card">
    <p className={`queue-status ${state.addressed ? "addressed" : "pending"}`}>{state.addressed ? <Check size={14} /> : <TriangleAlert size={14} />}{state.label}</p>
    <p className="queue-reason"><strong>Original flag:</strong> {item.reason}</p>
    <blockquote tabIndex={0} aria-label="Flagged source passage">{item.evidence.quote}</blockquote>
    <button className="text-button" onClick={event => onEvidence(item.evidence, item.id, event.currentTarget)}><Quote size={13} /> Inspect in the full notice <ArrowUpRight size={13} /></button>
    {item.decision && <div className="queue-decision"><strong>{item.decision.origin === "imported" ? "Loaded decision (unverified)" : "Your recorded decision"}</strong><p>{item.decision.kind === "linked" ? "Linked to an action" : item.decision.kind === "not_action" ? "Not an obligation" : "Needs clarification"}</p><p>{item.decision.note}</p>{item.decision.actionId && actions.some(a => a.id === item.decision!.actionId) && <button className="text-button" onClick={() => onAction(item.decision!.actionId!)}>Review linked action <ArrowUpRight size={13} /></button>}</div>}
    <div className="queue-tools"><button ref={createButton} disabled={disabled || actions.length >= 20} aria-expanded={editor === "create"} aria-controls={editor === "create" ? `${item.id}-editor` : undefined} onClick={() => { if (editor === "create") closeEditor(); else { setEditor("create"); setError(""); } }}><Plus size={14} /> Create an action from this passage</button><button ref={decisionButton} disabled={disabled} aria-expanded={editor === "decision"} aria-controls={editor === "decision" ? `${item.id}-editor` : undefined} onClick={() => { if (editor === "decision") closeEditor(); else { setFields(old => ({ ...old, kind: item.decision?.kind ?? "linked", actionId: item.decision?.actionId ?? "", note: item.decision?.note ?? old.note })); setEditor("decision"); setError(""); } }}>{item.decision ? "Recheck or change decision" : "Record a decision"}</button></div>
    {actions.length >= 20 && <p className="field-hint">This receipt has reached its 20-action limit, including omitted actions. You can still record a decision or review existing actions.</p>}
    {editor && <SourceReviewEditor item={item} actions={actions} mode={editor} fields={fields} disabled={disabled} error={error} formRef={formRef} onChange={patch => setFields(old => ({ ...old, ...patch }))} onCancel={closeEditor} onSubmit={event => { event.preventDefault(); if (disabled) return; try { if (editor === "create") onCreate(item.id, { title: fields.title, quote: fields.quote, condition: fields.condition, note: fields.note }); else onRecord(item.id, { kind: fields.kind, note: fields.note, actionId: fields.kind === "linked" ? fields.actionId : null }); setEditor(null); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "This decision could not be recorded."); } }} />}
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
