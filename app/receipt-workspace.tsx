"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCheck, ChevronDown, CircleHelp, Download, Eye, FileText, FolderOpen, Info, LoaderCircle, LockKeyhole, MessageCircleQuestion, Pencil, Plus, Quote, ReceiptText, RotateCcw, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import { reviewScenario, samples } from "../lib/samples.ts";
import { demoScenario } from "../lib/demo-scenario.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, canApprove, canConfirmDate, displayDate, editAction, manualAction, nextManualNumber, noticeInputState, resultIsCurrent, validateExtraction, validDate, validOffset, validTime, type Evidence, type ReviewedAction, type SourceReviewItem } from "../lib/receipt.ts";
import { calendarText, checklistText, planExports, type ReceiptMeta } from "../lib/export.ts";
import { MAX_REVIEW_BYTES, openReviewFile as parseReviewFile, saveReviewFile } from "../lib/review-file.ts";
import ExportPreview from "./export-preview.tsx";
import SourceReviewQueue, { type FlagActionInput } from "./source-review-queue.tsx";
import { createActionFromFlag, recordSourceDecision, type DecisionInput } from "../lib/source-review.ts";
import ReviewGuide from "./review-guide.tsx";
import type { ReviewTarget } from "../lib/review-guide.ts";
import ClarificationSheet from "./clarification-sheet.tsx";
import { clarificationCandidates } from "../lib/clarification.ts";
import RecoveryBanner from "./recovery-banner.tsx";
import { recoverWorkspace, type RecoveryCopy, type ReplacementKind, type WorkspaceSnapshot } from "../lib/workspace-recovery.ts";
import { checkpointReview, reviewContentStamp, reviewSessionState } from "../lib/review-session.ts";
import ReviewSaveStatus from "./review-save-status.tsx";

function saveFile(text: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SourcePassage({ source, selected }: { source: string; selected: Evidence | null }) {
  if (!selected || !selected.starts.length) return <>{source}</>;
  const chunks = []; let from = 0;
  for (const [n, start] of selected.starts.entries()) {
    chunks.push(<span key={`text-${n}`}>{source.slice(from, start)}</span>);
    chunks.push(<mark id={`source-evidence-${n}`} tabIndex={-1} key={`mark-${n}`}>{source.slice(start, start + selected.quote.length)}</mark>);
    from = start + selected.quote.length;
  }
  chunks.push(<span key="end">{source.slice(from)}</span>);
  return <>{chunks}</>;
}

function ManualActionForm({ source, disabled, selected, onAdd }: { source: string; disabled: boolean; selected: Evidence | null; onAdd: (title: string, quote: string, condition: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [condition, setCondition] = useState("");
  const [error, setError] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) titleInput.current?.focus(); }, [open]);
  const quoteTooLong = quote.trim().length > 1200;
  const exactMatch = Boolean(quote.trim() && !quoteTooLong && source.includes(quote.trim()));
  return <div className="manual-action-area">
    <button className="manual-toggle" disabled={disabled} aria-expanded={open} aria-controls="manual-action-form" onClick={() => setOpen(!open)}><Plus size={15} /> {open ? "Close action form" : "Add an action from the source"}<ChevronDown size={14} className={open ? "rotate" : ""} /></button>
    {disabled && <p className="field-hint">Add actions after processing finishes. A receipt can hold up to 20 actions.</p>}
    {open && <form id="manual-action-form" className="manual-action-form" onSubmit={e => {
      e.preventDefault(); if (disabled) return;
      try { onAdd(title, quote, condition); setTitle(""); setQuote(""); setCondition(""); setError(""); setOpen(false); }
      catch (e) { setError(e instanceof Error ? e.message : "This action could not be added."); }
    }}>
      <p>Repair a missed instruction, or review a notice yourself. Your action will be labeled as added by you and needs approval before export.</p>
      <label htmlFor="manual-action-title">What needs to be done?</label><input ref={titleInput} id="manual-action-title" required maxLength={240} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Bring a signed permission slip" />
      <label htmlFor="manual-action-quote">Exact supporting passage</label><textarea id="manual-action-quote" required rows={3} value={quote} onChange={e => setQuote(e.target.value)} placeholder="Copy the relevant words from the original notice." aria-invalid={quoteTooLong || Boolean(quote.trim() && !exactMatch)} aria-describedby="manual-passage-hint" />
      {selected && <button className="text-button reuse-passage" type="button" disabled={selected.quote.length > 1200} onClick={() => { setQuote(selected.quote); setError(""); }}><Quote size={13} /> Use highlighted passage</button>}
      {selected && selected.quote.length > 1200 && <p className="field-hint">The highlighted passage is longer than 1,200 characters. Copy a shorter exact excerpt from it.</p>}
      <p className={`field-hint ${exactMatch ? "matched-passage" : ""}`} id="manual-passage-hint" role="status">{quoteTooLong ? "The full paste is kept, but this excerpt is over 1,200 characters. Choose a shorter exact excerpt that keeps any applicable conditions, dates and times." : quote.trim() ? exactMatch ? "This passage occurs in the notice. Check that it supports your action." : "This passage does not match the notice. Copy its exact wording." : "Include any conditions, dates and times that apply. Up to 1,200 characters."}</p>
      <label htmlFor="manual-action-condition">Condition or optionality <span>(optional)</span></label><input id="manual-action-condition" maxLength={600} value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g. Only if you plan to attend" />
      <p className="field-hint">Set and confirm any date in Review details after adding the action.</p>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={disabled || !title.trim() || !exactMatch}><Plus size={15} /> Add for review</button>
    </form>}
  </div>;
}

function ActionCard({ action, index, onChange, onEvidence, focusSignal = 0, focusField = "title" }: { action: ReviewedAction; index: number; onChange: (a: ReviewedAction) => void; onEvidence: (e: Evidence) => void; focusSignal?: number; focusField?: "title" | "date" }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!focusSignal) return;
    setOpen(true);
    const timer = setTimeout(() => { const field = document.getElementById(`${action.id}-${focusField}`); field?.scrollIntoView({ block: "center", behavior: "instant" }); field?.focus({ preventScroll: true }); }, 0);
    return () => clearTimeout(timer);
  }, [focusSignal, action.id, focusField]);
  const eligible = action.dateConfirmed && canConfirmDate(action);
  const needsClarification = !canConfirmDate(action);
  const change = (patch: Parameters<typeof editAction>[1]) => onChange(editAction(action, patch));
  const prefix = action.id;
  return (
    <article id={`action-card-${action.id}`} aria-labelledby={`${prefix}-heading`} className={`action-card ${action.approved ? "is-approved" : ""} ${action.omitted ? "is-omitted" : ""}`}>
      <div className="action-top"><span className="action-number">{String(index + 1).padStart(2, "0")}</span><span className={`badge ${action.approved ? "green" : !action.evidenceValid ? "red" : needsClarification && !eligible ? "amber" : "neutral"}`}>
        {action.omitted ? "Omitted" : action.approved ? <><Check size={12} /> Approved</> : !action.evidenceValid ? "Evidence needs attention" : eligible ? "Date confirmed" : needsClarification ? "Needs clarification" : "Ready to review"}
      </span><button className="icon-button omit-button" aria-label={action.omitted ? `Restore ${action.title}` : `Omit ${action.title}`} onClick={() => change({ omitted: !action.omitted })}>{action.omitted ? <RotateCcw size={15} /> : <X size={15} />}</button></div>
      <h3 id={`${prefix}-heading`}>{action.title || "Action wording is empty"}</h3>
      {action.origin === "user" && <p className="correction-label"><Pencil size={11} /> Added by you from source</p>}{action.origin === "rules" && <p className="correction-label"><FileText size={11} /> Found by local text rules</p>}
      {action.origin === "imported" && <p className="correction-label"><FolderOpen size={11} /> Loaded from review file; check again</p>}
      {(action.title !== action.originalTitle || action.condition !== action.originalCondition) && <p className="correction-label"><Pencil size={11} /> {action.origin === "imported" ? "Wording differs from unverified file metadata" : "Wording edited by you"}</p>}
      {action.condition && <p className="condition">{action.condition}</p>}
      <div className={`deadline-line ${needsClarification ? "unresolved" : ""}`}><CalendarDays size={15} /><span>{action.date ? displayDate(action.date) : action.deadlineText || "No deadline stated"}{action.requiresTime ? ` · ${validTime(action.time) ? action.time : "Cutoff time unresolved"} · ${validOffset(action.utcOffset) ? `UTC${action.utcOffset}` : "UTC offset unresolved"}` : ""}{action.date && !eligible ? " (unconfirmed)" : ""}</span>{eligible && <Check size={14} className="confirmed-check" aria-label="Date confirmed" />}</div>
      <div className="evidence-line"><Quote size={13} /><span>{action.evidence[0]?.quote}</span></div>
      <div className="action-tools"><button className="text-button" onClick={() => onEvidence(action.evidence[0])} disabled={!action.evidence[0]?.starts.length}><Quote size={13} /> View source <ArrowUpRight size={12} /></button><button className="text-button" aria-expanded={open} aria-controls={`${prefix}-review`} onClick={() => setOpen(!open)}>{open ? "Close details" : "Review details"}<ChevronDown size={13} className={open ? "rotate" : ""} /></button></div>
      {open && <div className="action-details" id={`${prefix}-review`}>
        <label htmlFor={`${prefix}-title`}>Action wording</label><textarea id={`${prefix}-title`} rows={2} maxLength={240} value={action.title} onChange={e => change({ title: e.target.value })} />
        {action.title !== action.originalTitle && <p className="provenance">{action.origin === "imported" ? "Prior action metadata (unverified)" : "Original proposed action"}: {action.originalTitle}</p>}
        <label htmlFor={`${prefix}-condition`}>Condition or optionality</label><textarea id={`${prefix}-condition`} rows={2} maxLength={600} value={action.condition} onChange={e => change({ condition: e.target.value })} placeholder="Only if…" />
        {action.condition !== action.originalCondition && <p className="provenance">{action.origin === "imported" ? "Prior condition metadata (unverified)" : "Original proposed condition"}: {action.originalCondition || "None"}</p>}
        <div className="original-deadline"><span className="field-label">Original deadline wording</span><p>{action.deadlineText || "Not stated in the notice"}</p></div>
        {action.dateEvidence.map((e, i) => <button className="evidence-quote" key={`date-${i}`} onClick={() => onEvidence(e)} disabled={!e.starts.length}><Quote size={13} /><span>{e.quote}</span><ArrowUpRight size={12} /></button>)}
        {action.evidence.slice(1).map((e, i) => <button className="evidence-quote" key={`action-${i}`} onClick={() => onEvidence(e)} disabled={!e.starts.length}><Quote size={13} /><span>{e.quote}</span></button>)}
        <label htmlFor={`${prefix}-date`}>Calendar date <span className="optional-label">confirm after checking</span></label><input type="date" id={`${prefix}-date`} min="1000-01-01" max="9999-12-31" value={action.date} onChange={e => change({ date: e.target.value })} />
        {!action.sourceRequiresTime && <label className="check-row timed-cutoff-toggle"><input type="checkbox" checked={action.requiresTime} onChange={e => change({ requiresTime: e.target.checked })} /><span>This action has a timed cutoff.</span></label>}
        {action.requiresTime && <div className="time-fields"><div><label htmlFor={`${prefix}-time`}>Cutoff time</label><input type="time" id={`${prefix}-time`} value={action.time} onChange={e => change({ time: e.target.value })} /></div><div><label htmlFor={`${prefix}-offset`}>UTC offset on that date</label><input id={`${prefix}-offset`} placeholder="e.g. -10:00" maxLength={6} value={action.utcOffset} onChange={e => change({ utcOffset: e.target.value })} /></div></div>}
        <p className="field-hint">{action.requiresTime ? "Confirm the cutoff and UTC offset for this specific date. Daylight saving time can change offsets." : "Calendar export creates an all-day deadline marker. No cutoff time or reminder is inferred."}</p>
        {action.requiresTime && validDate(action.date) && validTime(action.time) && validOffset(action.utcOffset) && !canConfirmDate(action) && <p className="error-message" role="alert">This cutoff falls outside the supported calendar range after UTC conversion. Check the date, time and offset before confirming.</p>}
        <label className="check-row date-confirm"><input type="checkbox" aria-label={`Confirm ${action.requiresTime ? "date, time and UTC offset" : "date"} for: ${action.title || "untitled action"}`} checked={action.dateConfirmed} disabled={!canConfirmDate(action) || action.omitted} onChange={e => onChange({ ...action, dateConfirmed: e.target.checked, approved: false })} /><span>I confirmed this date{action.requiresTime ? ", time, and UTC offset" : ""}.</span></label>
        <p className="provenance">{action.dateOrigin === "user supplied" ? "Date or time edited by you. Original wording and warnings stay in the receipt." : action.dateOrigin === "review file" ? "Date or time loaded from a review file. Check it against the source and confirm again." : "Dates are proposals until you confirm them."}</p>
        {action.issues.length > 0 && <div className="review-flags"><span className="field-label"><TriangleAlert size={13} /> Original review flags</span><ul>{action.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>{eligible && <p>Your confirmed date resolves calendar eligibility. Original flags remain in the export.</p>}</div>}
        {action.evidence.some(e => e.starts.length > 1) && <p className="field-hint">A quotation appears multiple times. “View source” highlights every match.</p>}
      </div>}
      <label className="check-row approve-row"><input type="checkbox" aria-label={`I checked this action: ${action.title || "untitled action"}`} checked={action.approved} disabled={!canApprove(action)} onChange={e => onChange({ ...action, approved: e.target.checked })} /><span>{action.approved ? "Reviewed and approved" : "I checked this action"}</span>{action.approved && <CheckCheck size={15} />}</label>
      {action.approved && !calendarEligible(action) && <p className="checklist-only">Checklist only until the date is confirmed.</p>}
    </article>
  );
}

export default function ReceiptWorkspace() {
  const [initial] = useState(() => extractLocally(demoScenario.source));
  const [saveBaseline, setSaveBaseline] = useState(() => reviewContentStamp({ source: demoScenario.source, title: demoScenario.title, ...initial, mode: "local", sampleId: null, restored: false }));
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [source, setSource] = useState(demoScenario.source);
  const [title, setTitle] = useState(demoScenario.title);
  const [actions, setActions] = useState<ReviewedAction[]>(initial.actions);
  const [notes, setNotes] = useState(initial.notes);
  const [attention, setAttention] = useState<SourceReviewItem[]>(initial.attention);
  const [mode, setMode] = useState<"sample" | "local" | "manual" | null>("local");
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Evidence | null>(null);
  const [evidenceFocus, setEvidenceFocus] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [methodOpen, setMethodOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [recoveryCopy, setRecoveryCopy] = useState<RecoveryCopy | null>(null);
  const [focusedAction, setFocusedAction] = useState<{ id: string; signal: number; field: "title" | "date" }>({ id: "", signal: 0, field: "title" });
  const [focusedFlag, setFocusedFlag] = useState({ id: "", signal: 0 });
  const [restoredReview, setRestoredReview] = useState(false);
  const [openingReview, setOpeningReview] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileMessage, setFileMessage] = useState("");
  const requestId = useRef(0); const currentSource = useRef(source);
  const workspaceVersion = useRef(0); const fileLoadId = useRef(0);
  const receiptId = useRef("session"); const createdAt = useRef(new Date());
  const dialog = useRef<HTMLDialogElement>(null); const noticeInput = useRef<HTMLTextAreaElement>(null);
  const reviewInput = useRef<HTMLInputElement>(null);
  useEffect(() => { receiptId.current = crypto.randomUUID(); }, []);
  useEffect(() => { if (methodOpen) dialog.current?.showModal(); else dialog.current?.close(); }, [methodOpen]);
  useEffect(() => {
    if (!selected || editing) return;
    const passage = document.getElementById("source-evidence-0");
    passage?.scrollIntoView({ behavior: "instant", block: "nearest" });
    passage?.focus({ preventScroll: true });
  }, [selected, evidenceFocus, editing]);
  const inputState = noticeInputState(source);
  const content = { source, title, actions, notes, attention, mode, sampleId, restored: restoredReview };
  const session = reviewSessionState(content, saveBaseline, recoveryCopy);
  useEffect(() => {
    if (!session.warnBeforeLeaving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [session.warnBeforeLeaving]);
  const shortPractice = mode === "local" && !restoredReview && source === demoScenario.source;
  const exportPlan = planExports(actions);
  const approved = exportPlan.checklist;
  const calendar = exportPlan.calendar;
  const active = actions.filter(a => !a.omitted);
  const questionCount = clarificationCandidates(source, actions, attention).length;
  const meta = (): ReceiptMeta => ({ mode: mode ?? "manual", title, createdAt: createdAt.current, receiptId: receiptId.current, notes, attention, restored: restoredReview });
  const snapshot = (): WorkspaceSnapshot => ({ source, title, actions, notes, attention, mode, sampleId, restored: restoredReview, receiptId: receiptId.current, createdAt: createdAt.current });
  function rememberWorkspace(kind: ReplacementKind, label: string) {
    setRecoveryCopy(checkpointReview(snapshot(), saveBaseline, recoveryCopy, kind, label));
  }
  function resetResults(newSource: string, replacement?: { kind: ReplacementKind; label: string }) {
    if (replacement) rememberWorkspace(replacement.kind, replacement.label);
    // Comparison data must not retain a different notice after replacement.
    setSaveBaseline(""); setDownloadRequested(false);
    workspaceVersion.current++; requestId.current++; currentSource.current = newSource; setSource(newSource); setActions([]); setNotes([]); setAttention([]); setSelected(null); setMode(null); setSampleId(null); setError(""); setBusy(false); setRestoredReview(false); setFileError(""); setFileMessage("");
    receiptId.current = crypto.randomUUID(); createdAt.current = new Date();
    setFocusedAction({ id: "", signal: 0, field: "title" }); setFocusedFlag({ id: "", signal: 0 }); setPreviewOpen(false); setQuestionsOpen(false);
  }
  function ownNotice() { resetResults("", { kind: "replace", label: "Before starting a new notice" }); setTitle(""); setEditing(true); setAnnouncement("Ready for your notice."); setTimeout(() => noticeInput.current?.focus(), 0); }
  function loadSample(id: string) {
    const sample = samples.find(s => s.id === id)!;
    resetResults(sample.source, { kind: "replace", label: "Before loading a sample" }); setTitle(sample.title); setMode("sample"); setSampleId(id); setEditing(false);
    const result = validateExtraction(sample.source, sample.result, requestId.current + 1);
    setActions(result.actions); setNotes(result.notes); receiptId.current = crypto.randomUUID(); createdAt.current = new Date();
    setSaveBaseline(reviewContentStamp({ source: sample.source, title: sample.title, ...result, attention: [], mode: "sample", sampleId: id, restored: false }));
    setAnnouncement(`Loaded ${sample.label}, a synthetic walkthrough with saved results.`);
  }
  async function analyze() {
    if (busy) return;
    if (!inputState.ready) { setError(inputState.message); return; }
    rememberWorkspace("scan", "Before the last scan");
    const submitted = source; const thisRequest = ++requestId.current;
    workspaceVersion.current++; setRestoredReview(false); setFileError(""); setFileMessage("");
    setBusy(true); setError(""); setActions([]); setNotes([]); setAttention([]); setSelected(null); setMode(null); setSampleId(null);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (!resultIsCurrent(thisRequest, requestId.current, submitted, currentSource.current)) return;
      const result = extractLocally(submitted, thisRequest);
      workspaceVersion.current++;
      setActions(result.actions); setNotes(result.notes); setAttention(result.attention); setMode("local"); setEditing(false);
      receiptId.current = crypto.randomUUID(); createdAt.current = new Date(); setAnnouncement(`${result.actions.length} proposed actions. Check each one against the source.`);
    } catch (e) {
      if (resultIsCurrent(thisRequest, requestId.current, submitted, currentSource.current)) setError(e instanceof Error ? e.message : "The notice could not be processed. Your text is still here.");
    } finally { if (thisRequest === requestId.current) setBusy(false); }
  }
  function tryGuidedReview() {
    resetResults(reviewScenario.source, { kind: "replace", label: "Before guided practice" }); setTitle(reviewScenario.title); setEditing(false);
    const result = extractLocally(reviewScenario.source, requestId.current);
    setActions(result.actions); setNotes(result.notes); setAttention(result.attention); setMode("local");
    setSaveBaseline(reviewContentStamp({ source: reviewScenario.source, title: reviewScenario.title, ...result, mode: "local", sampleId: null, restored: false }));
    setAnnouncement("Scanned an invented notice using the actual local rules. Review the flagged passages and add the missed consent action.");
  }
  function restartPractice() {
    resetResults(demoScenario.source, { kind: "replace", label: "Before restarting short practice" }); setTitle(demoScenario.title); setEditing(false);
    const result = extractLocally(demoScenario.source, requestId.current);
    setActions(result.actions); setNotes(result.notes); setAttention(result.attention); setMode("local");
    setSaveBaseline(reviewContentStamp({ source: demoScenario.source, title: demoScenario.title, ...result, mode: "local", sampleId: null, restored: false }));
    setAnnouncement("Freshly scanned the short synthetic practice notice. Nothing is approved or date-confirmed.");
    setTimeout(() => document.getElementById("workspace")?.focus({ preventScroll: false }), 0);
  }
  function highlight(evidence: Evidence) { setSelected(evidence); setEvidenceFocus(n => n + 1); setEditing(false); setAnnouncement(`Highlighted ${evidence.starts.length} source match${evidence.starts.length === 1 ? "" : "es"}. Focus moved to the first match in the original notice.`); }
  function addManual(title: string, quote: string, condition: string) {
    if (!inputState.ready) throw new Error(inputState.message);
    if (busy || actions.length >= 20) throw new Error("A receipt can hold up to 20 actions. Wait for processing to finish before adding one.");
    const action = manualAction(source, title, quote, condition, nextManualNumber(actions));
    workspaceVersion.current++;
    if (!mode) { setMode("manual"); receiptId.current = crypto.randomUUID(); createdAt.current = new Date(); }
    setActions(old => [...old, action]); setAnnouncement("Added your action with its source passage. Review and approve it before exporting.");
  }
  function reviewLinkedAction(id: string, field: "title" | "date" = "title") { setFocusedAction(old => ({ id, signal: old.signal + 1, field })); }
  function goToReview(target: ReviewTarget) {
    if (busy || openingReview) return;
    if (target.kind === "flag") setFocusedFlag(old => ({ id: target.id, signal: old.signal + 1 }));
    else if (target.kind === "action") reviewLinkedAction(target.id);
    else if (target.kind === "preview") setPreviewOpen(true);
    else { setEditing(false); setTimeout(() => { const heading = document.getElementById("source-heading"); heading?.scrollIntoView({ block: "nearest", behavior: "instant" }); heading?.focus({ preventScroll: true }); }, 0); }
  }
  function recordFlag(id: string, input: DecisionInput) {
    const item = attention.find(item => item.id === id); if (!item) throw new Error("This flag is no longer in the current notice.");
    const updated = recordSourceDecision(item, input, actions);
    workspaceVersion.current++; setAttention(old => old.map(item => item.id === id ? updated : item));
    setAnnouncement("Source decision recorded. Action approvals and date confirmations were not changed.");
  }
  function createFromFlag(id: string, input: FlagActionInput) {
    const item = attention.find(item => item.id === id); if (!item || busy || openingReview) throw new Error("Wait for the current notice to finish loading.");
    const result = createActionFromFlag(source, item, input, actions);
    workspaceVersion.current++; setActions(old => [...old, result.action]); setAttention(old => old.map(item => item.id === id ? result.item : item));
    reviewLinkedAction(result.action.id); setAnnouncement("Added a source-backed action and recorded your link. Review and approve the new action; its date starts unresolved.");
  }
  function saveReview() {
    try {
      if (!inputState.ready) throw new Error(inputState.message);
      saveFile(saveReviewFile({ source, actions, meta: meta() }), "application/json;charset=utf-8", "action-receipt-review.json");
      setSaveBaseline(reviewContentStamp(content)); setDownloadRequested(true);
      setFileError(""); setFileMessage("Review-file download requested for the current version. Confirm the file saved before leaving. It includes the full notice and added actions, but not the recovery copy or unfinished form entries. Opening it requires fresh approvals.");
      setAnnouncement("Review-file download requested. Confirm it saved before leaving. No notice was uploaded.");
    } catch (e) { setFileError(e instanceof Error ? e.message : "The review could not be saved."); }
  }
  async function openReview(file: File) {
    const thisLoad = ++fileLoadId.current; const version = workspaceVersion.current;
    setOpeningReview(true); setFileError(""); setFileMessage("");
    try {
      if (file.size > MAX_REVIEW_BYTES) throw new Error("Review files must be 1 MB or smaller. Your current review has not been changed.");
      let text: string;
      try { text = await file.text(); } catch { throw new Error("The file could not be read. Your current review has not been changed."); }
      const loaded = parseReviewFile(text);
      if (thisLoad !== fileLoadId.current) return;
      if (version !== workspaceVersion.current) throw new Error("Your review changed while the file was opening. Open the file again if you want to replace it.");
      resetResults(loaded.source, { kind: "replace", label: "Before opening a review file" }); setTitle(loaded.meta.title); setActions(loaded.actions); setNotes(loaded.meta.notes); setAttention(loaded.meta.attention ?? []); setMode(loaded.meta.mode); setRestoredReview(true); setEditing(false);
      receiptId.current = loaded.meta.receiptId; createdAt.current = loaded.meta.createdAt;
      setSaveBaseline(reviewContentStamp({ source: loaded.source, title: loaded.meta.title, actions: loaded.actions, notes: loaded.meta.notes, attention: loaded.meta.attention ?? [], mode: loaded.meta.mode, sampleId: null, restored: true }));
      setFileMessage("Review opened. Edits, omissions and decision notes were kept. Approvals and date confirmations were cleared; loaded source decisions need rechecking.");
      setAnnouncement(`Opened ${loaded.actions.length} actions from a review file. Check and approve them again before export.`);
    } catch (e) { if (thisLoad === fileLoadId.current) setFileError(e instanceof Error ? e.message : "The file could not be opened. Your current review was kept."); }
    finally { if (thisLoad === fileLoadId.current) setOpeningReview(false); }
  }
  function exportChecklist() { saveFile(checklistText(actions, meta()), "text/markdown;charset=utf-8", "action-receipt.md"); setAnnouncement(`Downloaded a checklist with ${approved.length} approved actions.`); }
  function restorePrevious() {
    if (!recoveryCopy) return;
    const result = recoverWorkspace(snapshot(), recoveryCopy.workspace); const saved = result.workspace;
    fileLoadId.current++; setOpeningReview(false); resetResults(saved.source);
    setTitle(saved.title); setActions(saved.actions); setNotes(saved.notes); setAttention(saved.attention); setMode(saved.mode); setSampleId(saved.sampleId); setRestoredReview(saved.restored); setEditing(saved.mode === null);
    receiptId.current = saved.receiptId; createdAt.current = saved.createdAt;
    setSaveBaseline(recoveryCopy.unsaved ? "" : reviewContentStamp(saved));
    setRecoveryCopy({ label: "Before the last recovery", workspace: result.previous, unsaved: session.current });
    setFileMessage("Workspace recovered from this tab's memory. Approvals and date confirmations were cleared. Recheck every recorded source decision. The outgoing workspace is now the recovery copy.");
    setAnnouncement("Previous workspace recovered. Check actions, dates and source decisions again. Outgoing work remains in the recovery copy.");
  }
  function exportCalendar() { saveFile(calendarText(actions, meta()), "text/calendar;charset=utf-8", "action-receipt.ics"); setAnnouncement(`Downloaded ${calendar.length} calendar entries. ${approved.length - calendar.length} approved items omitted because their dates are unresolved.`); }
  function downloadPreview(kind: "checklist" | "calendar", text: string, count: number) {
    saveFile(text, kind === "checklist" ? "text/markdown;charset=utf-8" : "text/calendar;charset=utf-8", kind === "checklist" ? "action-receipt.md" : "action-receipt.ics");
    setAnnouncement(`Downloaded the previewed ${kind} with ${count} ${kind === "checklist" ? "tasks" : "entries"}.`);
  }
  function openQuestions() { if (busy || openingReview || !questionCount) return; setPreviewOpen(false); setQuestionsOpen(true); }
  function downloadQuestions(text: string, count: number) {
    saveFile(text, "text/markdown;charset=utf-8", "action-receipt-questions.md");
    setAnnouncement(`Downloaded ${count} checked clarification questions. No questions were sent and no approvals or dates changed.`);
  }
  return (
    <div className="app-shell" id="top">
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <header className="site-header"><a className="brand" href="#top" aria-label="Action Receipt home"><span className="brand-icon"><ReceiptText size={22} strokeWidth={1.7} /></span><span>Action Receipt<span className="brand-dot">.</span></span></a><div className="header-right"><span className="session-label"><span className="status-dot" /> One notice. Clear next steps.</span><button className="method-button" onClick={() => setMethodOpen(true)}><CircleHelp size={16} /> How it works</button></div></header>
      <main>
        <section className="intro"><div><p className="eyebrow"><span /> FROM NOTICE TO NEXT STEP</p><h1>Know what’s next.<br /><em>Keep the proof.</em></h1><p className="intro-copy">Turn a tangled notice into a checklist you can check.<br className="desktop-break" /> Every action has a source. No accounts, API credits, or model downloads.</p></div><div className="intro-aside"><div className="mini-proof"><Quote size={19} /><div><strong>Less guessing.<br />More checking.</strong><p>Read. Review. Decide.</p></div></div><button className="own-notice-button" onClick={ownNotice}>Use your own notice <ArrowUpRight size={17} /></button></div></section>
        <div className="practice-intro"><div><p className="eyebrow">START WITH ONE INVENTED NOTICE</p><p>{shortPractice ? <><strong>3 proposals. 2 passages to check. Your decisions next.</strong> This practice notice was freshly scanned by local rules. Nothing starts approved.</> : <><strong>Try the short practice notice.</strong> Review separate deadlines, repair a missed instruction and keep an unclear date unresolved.</>}</p></div><button onClick={restartPractice}>Restart short practice (replaces review) <RotateCcw size={14} /></button></div>
        <details className="sample-section"><summary>More practice: saved walkthroughs and a harder notice <ChevronDown size={14} /></summary><p className="practice-disclosure">Switching examples replaces this review and keeps one temporary recovery copy. Saved walkthroughs are labeled; the harder notice runs local rules.</p><div className="samples">{samples.map((sample, i) => <button className={`sample-choice ${sampleId === sample.id ? "selected" : ""}`} key={sample.id} onClick={() => loadSample(sample.id)}><span className="sample-index">0{i + 1}</span><span className="sample-copy"><strong>{sample.label}</strong><span>{sample.kind}</span></span><ArrowUpRight size={17} /></button>)}</div>
        <div className="guided-review-example"><p><strong>Try a harder notice.</strong> Practice a missed instruction, a weekday/date conflict and a waived fee with a fresh local scan.</p><button onClick={tryGuidedReview}>Try harder notice (replaces review)</button></div></details>
        <section id="workspace" className="workspace" tabIndex={-1} aria-label="Notice review workspace">
          <div className="workspace-top"><div className="workspace-title"><span className="workspace-number">01</span><h2>Your notice, made clearer</h2></div><span className="privacy-label"><LockKeyhole size={13} /> Runs in your browser</span></div>
          <ReviewSaveStatus current={session.current} previous={session.previous} downloadRequested={!session.current && downloadRequested} canSave={!busy && !openingReview && inputState.ready} onSave={saveReview} />
          <details className="review-file-toolbar"><summary>Open a saved review <ChevronDown size={13} /></summary><div className="review-file-buttons"><button disabled={busy || openingReview} onClick={() => reviewInput.current?.click()}>{openingReview ? <LoaderCircle size={14} className="spin" /> : <FolderOpen size={14} />} {openingReview ? "Opening review…" : "Open review file"}</button><input ref={reviewInput} className="sr-only" type="file" accept=".json,application/json" aria-label="Choose a saved Action Receipt review" disabled={busy || openingReview} onChange={e => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (file) void openReview(file); }} /></div><p>Save keeps the full notice and added actions, including unapproved items. Opening replaces this workspace and resets approvals and date confirmations. Unfinished form entries are not saved.</p></details>{fileMessage && <p className="review-file-message file-feedback" role="status">{fileMessage}</p>}{fileError && <div className="error-message file-feedback" role="alert"><TriangleAlert size={15} /> {fileError}</div>}
          {recoveryCopy && <RecoveryBanner copy={recoveryCopy} onRestore={restorePrevious} onDiscard={() => { setRecoveryCopy(null); setAnnouncement("Recovery copy discarded from this tab."); setTimeout(() => document.getElementById("workspace")?.focus({ preventScroll: true }), 0); }} />}
          {restoredReview && <div className="mode-banner"><FolderOpen size={16} /><p><strong>Loaded review file.</strong> Its labels and interpretation are unverified. Check the source again. Approvals and date confirmations were cleared when opened. Loaded source decisions need rechecking. The file describes its prior mode as {mode === "sample" ? "a synthetic sample" : mode === "local" ? "local text rules" : "manual review"}.</p></div>}
          {mode === "sample" && !restoredReview && <div className="mode-banner"><Info size={16} /><p><strong>Synthetic sample walkthrough.</strong> These are saved example results, not a fresh scan of the text. Review, edit, and export them to explore the workflow.</p></div>}
          {mode === "local" && !restoredReview && <div className="mode-banner live"><FileText size={16} /><p><strong>Local text-rule proposals.</strong> These are English pattern matches, not AI interpretation. Read the complete notice and add anything the rules missed.</p></div>}
          {mode === "manual" && !restoredReview && <div className="mode-banner"><Pencil size={16} /><p><strong>Manual review.</strong> You added these actions from the source. No automatic extraction was used for this receipt.</p></div>}
          <div className="workspace-grid">
            <section className="source-panel" aria-labelledby="source-heading"><div className="panel-heading"><div><FileText size={17} /><h2 id="source-heading" tabIndex={-1}>The original notice</h2></div><span className="panel-caption">YOUR SOURCE OF TRUTH</span></div>
              <div className="source-meta"><label htmlFor="notice-title">Notice name <span>(optional)</span></label><input id="notice-title" maxLength={120} value={title} onChange={e => { workspaceVersion.current++; setTitle(e.target.value); }} placeholder="e.g. Campus workshop registration" /></div>
              <div className="source-tabs" role="group" aria-label="Source view"><button className={!editing ? "active" : ""} onClick={() => setEditing(false)} disabled={!source}><FileText size={13} /> Read & inspect</button><button className={editing ? "active" : ""} onClick={() => setEditing(true)}><Pencil size={13} /> Edit notice</button></div>
              {editing ? <div className="notice-editor"><label className="sr-only" htmlFor="notice-text">Paste the notice text</label><textarea ref={noticeInput} id="notice-text" value={source} aria-invalid={inputState.kind === "long" || inputState.kind === "short"} aria-describedby="notice-validation" placeholder="Paste a school, club, or event notice here. Include the dates and conditions exactly as written." onChange={e => resetResults(e.target.value, { kind: "source_edit", label: "Before editing the notice" })} /><div className="editor-footer"><span>{recoveryCopy ? "Editing clears results. A recovery copy is available above." : "Editing clears previous results and approvals."}</span><span>{source.length.toLocaleString("en-US")} / 15,000</span></div></div> : <div className="notice-paper">{source ? <><p className="document-kicker">{restoredReview ? "LOADED NOTICE · FILE METADATA UNVERIFIED" : mode === "sample" ? "SYNTHETIC EXAMPLE" : shortPractice ? "SYNTHETIC PRACTICE · FRESH LOCAL SCAN" : "ORIGINAL TEXT"}</p><pre className="notice-content"><SourcePassage source={source} selected={selected} /></pre><div className="paper-end"><span /><ReceiptText size={17} /><span /></div></> : <div className="empty-source"><FileText size={30} /><h3>A little context goes a long way.</h3><p>Paste the complete notice, including dates and conditions.</p><button className="text-button" onClick={() => { setEditing(true); setTimeout(() => noticeInput.current?.focus(), 0); }}>Paste a notice <ArrowRight size={14} /></button></div>}</div>}
              {selected && !editing && <div className="highlight-note"><Quote size={13} /> {selected.starts.length} exact match{selected.starts.length === 1 ? "" : "es"} highlighted<button onClick={() => setSelected(null)} aria-label="Clear source highlighting"><X size={13} /></button></div>}
              <div className="analyze-area"><p id="notice-validation" className={`notice-validation ${inputState.ready ? "" : "needs-input"}`} role="status">{inputState.message}</p><button className="primary-button analyze-button" disabled={busy || !inputState.ready} onClick={analyze}>{busy ? <LoaderCircle size={17} className="spin" /> : <FileText size={17} />}{busy ? "Checking your notice…" : actions.length > 0 && mode !== "sample" ? "Scan again (clears review)" : "Find actions locally"}<ArrowRight size={17} /></button><p>Uses text rules in this browser. No text is sent to a server or AI service.</p><p className="processing-disclosure">Scanning replaces current actions and approvals. Check for missed instructions and unclear date roles.</p>{error && <div className="error-message" role="alert"><TriangleAlert size={16} /><span>{error}</span></div>}</div>
            </section>
            <section className="actions-panel" aria-labelledby="actions-heading"><div className="panel-heading"><div><ReceiptText size={17} /><h2 id="actions-heading">Your action receipt</h2><span className="count-badge">{active.length}</span></div><span className="panel-caption">REVIEW BEFORE YOU EXPORT</span></div>
              <ReviewGuide actions={actions} items={attention} hasResults={mode !== null} canScan={inputState.ready} inputStatus={inputState.kind} disabled={busy || openingReview} onGo={goToReview} onScan={() => void analyze()} onPaste={() => { setEditing(true); setTimeout(() => noticeInput.current?.focus(), 0); }} onDate={id => reviewLinkedAction(id, "date")} questionCount={questionCount} onQuestions={openQuestions} />
              <div className="review-summary"><span><span className="summary-dot green-dot" /> {approved.length} approved for checklist</span><span><span className="summary-dot amber-dot" /> {calendar.length} eligible for calendar</span></div>
              {attention.length > 0 && <SourceReviewQueue key={requestId.current} items={attention} actions={actions} focusedFlag={focusedFlag} disabled={busy || openingReview} onEvidence={highlight} onAction={reviewLinkedAction} onRecord={recordFlag} onCreate={createFromFlag} />}
              <div className="actions-list">{busy ? <div className="empty-actions"><span className="empty-icon"><Sparkles size={28} className="pulse" /></span><h3>Finding the next steps.</h3><p>Actions and source passages will appear here for your review.</p></div> : actions.length ? actions.map((a, index) => <ActionCard key={a.id} action={a} index={index} focusSignal={focusedAction.id === a.id ? focusedAction.signal : 0} focusField={focusedAction.id === a.id ? focusedAction.field : "title"} onChange={next => { workspaceVersion.current++; setActions(old => old.map(item => item.id === next.id ? next : item)); }} onEvidence={highlight} />) : <div className="empty-actions"><span className="empty-icon"><ReceiptText size={30} /></span><h3>{mode === "local" ? "No actions were identified." : "A clear next step starts here."}</h3><p>{mode === "local" ? "Check the original notice yourself. The text rules may have missed something. Add actions from exact source passages." : "Scan a notice locally, add an action from its exact source text, or try a sample. Nothing is approved automatically."}</p></div>}</div>
              {notes.length > 0 && <details className="notice-notes"><summary><Info size={14} /> Notice-level notes <ChevronDown size={13} /></summary><ul>{notes.map((note, i) => <li key={i}>{note}</li>)}</ul></details>}
              {inputState.ready && <ManualActionForm key={requestId.current} source={source} disabled={busy || openingReview || actions.length >= 20} selected={selected} onAdd={addManual} />}
              <div className="export-area"><div className="export-title"><span className="export-icon"><ShieldCheck size={18} /></span><div><h3>Your approval controls the tasks.</h3><p>Files also include source quotes, decision notes and flagged passages.</p></div></div><button className="preview-button" disabled={busy || openingReview || !actions.length} onClick={() => setPreviewOpen(true)}><Eye size={16} /> Preview downloads & see what is missing <ArrowUpRight size={14} /></button><button className="preview-button question-open" disabled={busy || openingReview || !questionCount} onClick={openQuestions}><MessageCircleQuestion size={16} /> Prepare clarification questions <span>{questionCount}</span></button><div className="export-buttons"><button disabled={!approved.length} onClick={exportChecklist}><Download size={15} /> Checklist <span>{approved.length}</span></button><button disabled={!calendar.length} onClick={exportCalendar}><CalendarDays size={15} /> Calendar <span>{calendar.length}</span></button></div><p className="export-hint">{approved.length > calendar.length ? `${approved.length - calendar.length} approved item${approved.length - calendar.length === 1 ? " stays" : "s stay"} in the checklist only. Confirm complete dates in Review details to include them in the calendar.` : "Downloads a Markdown checklist or .ics file. Nothing is added to your calendar automatically."}</p></div>
            </section>
          </div>
        </section>
        <section className="principles" aria-label="Review principles"><div><span>01</span><p><strong>Follow the evidence.</strong> Open a source passage to see the words behind an action.</p></div><div><span>02</span><p><strong>Keep uncertainty visible.</strong> Unclear dates stay unresolved until you clarify them.</p></div><div><span>03</span><p><strong>Make the final call.</strong> Check meaning, conditions, and anything the rules missed.</p></div></section>
      </main>
      <footer><span className="footer-brand"><ReceiptText size={15} /> Action Receipt</span><p>Built with AI. Runs locally, without API fees.</p><a className="offline-download" href="./action-receipt.html" download="action-receipt.html"><Download size={12} /> Download offline app</a><button onClick={() => setMethodOpen(true)}>Method & privacy <ArrowUpRight size={12} /></button></footer>
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
      {previewOpen && <ExportPreview actions={actions} meta={meta()} onClose={() => setPreviewOpen(false)} onDownload={downloadPreview} onReviewAction={(id, field) => { setPreviewOpen(false); reviewLinkedAction(id, field); }} questionCount={questionCount} onQuestions={openQuestions} />}
      {questionsOpen && <ClarificationSheet source={source} actions={actions} meta={meta()} onClose={() => setQuestionsOpen(false)} onDownload={downloadQuestions} />}
      <dialog ref={dialog} className="method-dialog" onCancel={() => setMethodOpen(false)} onClose={() => setMethodOpen(false)}><button className="dialog-close icon-button" onClick={() => setMethodOpen(false)} aria-label="Close method and privacy"><X size={20} /></button><span className="dialog-symbol"><ReceiptText size={27} /></span><p className="eyebrow">A RECEIPT, WITH REASONS</p><h2>Clear actions leave room<br />for your judgment.</h2><p>Action Receipt uses local English text rules to propose actions from one notice. It has no runtime AI model or API. It does not guarantee a correct or complete reading.</p><ol><li><strong>Find the source.</strong> Quotations are matched exactly against the pasted text. A match proves the quotation is present, not that the interpretation is right.</li><li><strong>Clarify the date.</strong> Relative wording, missing years and conflicting dates need your decision. Timed deadlines also need a confirmed UTC offset.</li><li><strong>Approve deliberately.</strong> Edits clear approval. Calendar downloads contain only approved actions with confirmed, complete dates. Original warnings stay in the files.</li></ol><h3>What happens to your notice?</h3><p>Your notice, pattern matching, review decisions and downloads stay in this browser. There are no model downloads, API calls, accounts, analytics or persistent notice history. One temporary recovery copy stays in this tab until replaced, discarded, refreshed or closed. Restoring it clears approvals, date confirmations and source-decision checks. Downloads include only the current workspace, not the recovery copy. Refreshing clears your session. Save a review file explicitly if you want to reopen your work later; the app does not save it automatically. The optional clarification sheet includes only questions you select and check, with their source context. Nothing is sent. Question edits are discarded when the sheet closes and are not saved in review files. The downloadable app works offline; the hosted page needs a connection to load. Downloaded files contain source quotations, your recorded decision notes, notice notes and flagged passages, including context that is not an approved task.</p><p className="dialog-note">Built with AI coding assistance using the Devpost Learn Skill Pack. The finished app runs with ordinary browser code. Saved samples, fresh local-rule proposals and your own additions remain distinguishable in downloads.</p><button className="primary-button" onClick={() => setMethodOpen(false)}>Back to the workspace <ArrowRight size={16} /></button></dialog>
    </div>
  );
}
