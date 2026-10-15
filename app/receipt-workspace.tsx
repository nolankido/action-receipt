"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCheck, ChevronDown, CircleHelp, Download, FileText, Info, LoaderCircle, LockKeyhole, Pencil, Quote, ReceiptText, RotateCcw, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import { samples } from "../lib/samples.ts";
import { MAX_NOTICE_LENGTH, MIN_NOTICE_LENGTH, calendarEligible, canApprove, canConfirmDate, displayDate, editAction, resultIsCurrent, validateExtraction, type Evidence, type ReviewedAction } from "../lib/receipt.ts";
import { calendarText, checklistText, type ReceiptMeta } from "../lib/export.ts";

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
    chunks.push(<mark id={`source-evidence-${n}`} key={`mark-${n}`}>{source.slice(start, start + selected.quote.length)}</mark>);
    from = start + selected.quote.length;
  }
  chunks.push(<span key="end">{source.slice(from)}</span>);
  return <>{chunks}</>;
}

function ActionCard({ action, index, onChange, onEvidence }: { action: ReviewedAction; index: number; onChange: (a: ReviewedAction) => void; onEvidence: (e: Evidence) => void }) {
  const [open, setOpen] = useState(false);
  const eligible = action.dateConfirmed && canConfirmDate(action);
  const needsClarification = !action.originalDate || (action.requiresTime && !action.utcOffset);
  const change = (patch: Parameters<typeof editAction>[1]) => onChange(editAction(action, patch));
  const prefix = action.id;
  return (
    <article className={`action-card ${action.approved ? "is-approved" : ""} ${action.omitted ? "is-omitted" : ""}`}>
      <div className="action-top"><span className="action-number">{String(index + 1).padStart(2, "0")}</span><span className={`badge ${action.approved ? "green" : !action.evidenceValid ? "red" : needsClarification && !eligible ? "amber" : "neutral"}`}>
        {action.omitted ? "Omitted" : action.approved ? <><Check size={12} /> Approved</> : !action.evidenceValid ? "Evidence needs attention" : eligible ? "Date confirmed" : needsClarification ? "Needs clarification" : "Ready to review"}
      </span><button className="icon-button omit-button" aria-label={action.omitted ? `Restore ${action.title}` : `Omit ${action.title}`} onClick={() => change({ omitted: !action.omitted })}>{action.omitted ? <RotateCcw size={15} /> : <X size={15} />}</button></div>
      <h3>{action.title}</h3>
      {(action.title !== action.originalTitle || action.condition !== action.originalCondition) && <p className="correction-label"><Pencil size={11} /> Wording edited by you</p>}
      {action.condition && <p className="condition">{action.condition}</p>}
      <div className={`deadline-line ${!action.date ? "unresolved" : ""}`}><CalendarDays size={15} /><span>{action.date ? displayDate(action.date) : action.deadlineText || "No deadline stated"}{action.time && action.date ? ` · ${action.time}` : ""}</span>{eligible && <Check size={14} className="confirmed-check" />}</div>
      <div className="evidence-line"><Quote size={13} /><span>{action.evidence[0]?.quote}</span></div>
      <div className="action-tools"><button className="text-button" onClick={() => onEvidence(action.evidence[0])} disabled={!action.evidence[0]?.starts.length}><Quote size={13} /> View source <ArrowUpRight size={12} /></button><button className="text-button" aria-expanded={open} aria-controls={`${prefix}-review`} onClick={() => setOpen(!open)}>{open ? "Close details" : "Review details"}<ChevronDown size={13} className={open ? "rotate" : ""} /></button></div>
      {open && <div className="action-details" id={`${prefix}-review`}>
        <label htmlFor={`${prefix}-title`}>Action wording</label><textarea id={`${prefix}-title`} rows={2} maxLength={240} value={action.title} onChange={e => change({ title: e.target.value })} />
        {action.title !== action.originalTitle && <p className="provenance">Original proposed action: {action.originalTitle}</p>}
        <label htmlFor={`${prefix}-condition`}>Condition or optionality</label><textarea id={`${prefix}-condition`} rows={2} maxLength={600} value={action.condition} onChange={e => change({ condition: e.target.value })} placeholder="Only if…" />
        {action.condition !== action.originalCondition && <p className="provenance">Original proposed condition: {action.originalCondition || "None"}</p>}
        <div className="original-deadline"><span className="field-label">Original deadline wording</span><p>{action.deadlineText || "Not stated in the notice"}</p></div>
        {action.dateEvidence.map((e, i) => <button className="evidence-quote" key={`date-${i}`} onClick={() => onEvidence(e)} disabled={!e.starts.length}><Quote size={13} /><span>{e.quote}</span><ArrowUpRight size={12} /></button>)}
        {action.evidence.slice(1).map((e, i) => <button className="evidence-quote" key={`action-${i}`} onClick={() => onEvidence(e)} disabled={!e.starts.length}><Quote size={13} /><span>{e.quote}</span></button>)}
        <label htmlFor={`${prefix}-date`}>Calendar date <span className="optional-label">confirm after checking</span></label><input type="date" id={`${prefix}-date`} min="1000-01-01" max="9999-12-31" value={action.date} onChange={e => change({ date: e.target.value })} />
        {!action.sourceRequiresTime && <label className="check-row timed-cutoff-toggle"><input type="checkbox" checked={action.requiresTime} onChange={e => change({ requiresTime: e.target.checked })} /><span>This action has a timed cutoff.</span></label>}
        {action.requiresTime && <div className="time-fields"><div><label htmlFor={`${prefix}-time`}>Cutoff time</label><input type="time" id={`${prefix}-time`} value={action.time} onChange={e => change({ time: e.target.value })} /></div><div><label htmlFor={`${prefix}-offset`}>UTC offset on that date</label><input id={`${prefix}-offset`} placeholder="e.g. -10:00" maxLength={6} value={action.utcOffset} onChange={e => change({ utcOffset: e.target.value })} /></div></div>}
        <p className="field-hint">{action.requiresTime ? "Confirm the cutoff and UTC offset for this specific date. Daylight saving time can change offsets." : "Calendar export creates an all-day deadline marker. No cutoff time or reminder is inferred."}</p>
        <label className="check-row date-confirm"><input type="checkbox" checked={action.dateConfirmed} disabled={!canConfirmDate(action) || action.omitted} onChange={e => onChange({ ...action, dateConfirmed: e.target.checked, approved: false })} /><span>I confirmed this date{action.requiresTime ? ", time, and UTC offset" : ""}.</span></label>
        <p className="provenance">{action.dateOrigin === "user supplied" ? "Date or time edited by you. Original wording and warnings stay in the receipt." : "Dates are proposals until you confirm them."}</p>
        {action.issues.length > 0 && <div className="review-flags"><span className="field-label"><TriangleAlert size={13} /> Original review flags</span><ul>{action.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>{eligible && <p>Your confirmed date resolves calendar eligibility. Original flags remain in the export.</p>}</div>}
        {action.evidence.some(e => e.starts.length > 1) && <p className="field-hint">A quotation appears multiple times. “View source” highlights every match.</p>}
      </div>}
      <label className="check-row approve-row"><input type="checkbox" checked={action.approved} disabled={!canApprove(action)} onChange={e => onChange({ ...action, approved: e.target.checked })} /><span>{action.approved ? "Reviewed and approved" : "I checked this action"}</span>{action.approved && <CheckCheck size={15} />}</label>
      {action.approved && !calendarEligible(action) && <p className="checklist-only">Checklist only until the date is confirmed.</p>}
    </article>
  );
}

export default function ReceiptWorkspace() {
  const first = samples[0];
  const initial = validateExtraction(first.source, first.result);
  const [source, setSource] = useState(first.source);
  const [title, setTitle] = useState(first.title);
  const [actions, setActions] = useState<ReviewedAction[]>(initial.actions);
  const [notes, setNotes] = useState(initial.notes);
  const [mode, setMode] = useState<"sample" | "live" | null>("sample");
  const [sampleId, setSampleId] = useState<string | null>(first.id);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Evidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [liveReady, setLiveReady] = useState<boolean | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const [model, setModel] = useState("");
  const requestId = useRef(0); const currentSource = useRef(source);
  const receiptId = useRef("session"); const createdAt = useRef(new Date());
  const dialog = useRef<HTMLDialogElement>(null); const noticeInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { receiptId.current = crypto.randomUUID(); fetch("/api/status").then(r => r.ok ? r.json() : null).then(d => setLiveReady(Boolean(d && typeof d === "object" && "liveAI" in d && d.liveAI === true))).catch(() => setLiveReady(false)); }, []);
  useEffect(() => { if (methodOpen) dialog.current?.showModal(); else dialog.current?.close(); }, [methodOpen]);
  useEffect(() => { if (selected) document.getElementById("source-evidence-0")?.scrollIntoView({ behavior: "instant", block: "nearest" }); }, [selected]);
  const approved = actions.filter(a => a.approved && !a.omitted && a.evidenceValid);
  const calendar = actions.filter(calendarEligible);
  const active = actions.filter(a => !a.omitted);
  const unclear = active.filter(a => !a.dateConfirmed || !canConfirmDate(a)).length;
  const meta = (): ReceiptMeta => ({ mode: mode === "live" ? "live" : "sample", title, createdAt: createdAt.current, receiptId: receiptId.current, notes });
  function resetResults(newSource: string) {
    requestId.current++; currentSource.current = newSource; setSource(newSource); setActions([]); setNotes([]); setSelected(null); setMode(null); setSampleId(null); setError(""); setBusy(false); setModel("");
  }
  function ownNotice() { resetResults(""); setTitle(""); setEditing(true); setAnnouncement("Ready for your notice. Previous results and approvals were cleared."); setTimeout(() => noticeInput.current?.focus(), 0); }
  function loadSample(id: string) {
    const sample = samples.find(s => s.id === id)!;
    resetResults(sample.source); setTitle(sample.title); setMode("sample"); setSampleId(id); setEditing(false);
    const result = validateExtraction(sample.source, sample.result, requestId.current + 1);
    setActions(result.actions); setNotes(result.notes); receiptId.current = crypto.randomUUID(); createdAt.current = new Date();
    setAnnouncement(`Loaded ${sample.label}, a synthetic walkthrough with saved results.`);
  }
  async function analyze() {
    if (busy || source.trim().length < MIN_NOTICE_LENGTH || source.length > MAX_NOTICE_LENGTH) return;
    const submitted = source; const thisRequest = ++requestId.current;
    setBusy(true); setError(""); setActions([]); setNotes([]); setSelected(null); setMode(null); setSampleId(null);
    try {
      const response = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: submitted }), signal: AbortSignal.timeout(40_000) });
      const data = await response.json() as { message?: unknown; extraction?: unknown; model?: unknown } | null;
      if (!resultIsCurrent(thisRequest, requestId.current, submitted, currentSource.current)) return;
      if (!response.ok) throw new Error(typeof data?.message === "string" ? data.message : "The notice could not be processed.");
      const result = validateExtraction(submitted, data?.extraction, thisRequest);
      setActions(result.actions); setNotes(result.notes); setMode("live"); setModel(typeof data?.model === "string" ? data.model : ""); setEditing(false); setLiveReady(true);
      receiptId.current = crypto.randomUUID(); createdAt.current = new Date(); setAnnouncement(`${result.actions.length} proposed actions. Check each one against the source.`);
    } catch (e) {
      if (resultIsCurrent(thisRequest, requestId.current, submitted, currentSource.current)) setError(e instanceof Error && e.name === "TimeoutError" ? "Processing took too long. Your notice is still here; please try again." : e instanceof Error ? e.message : "Processing failed. Your notice is still here.");
    } finally { if (thisRequest === requestId.current) setBusy(false); }
  }
  function highlight(evidence: Evidence) { setSelected(evidence); setEditing(false); setAnnouncement(`Highlighted ${evidence.starts.length} source match${evidence.starts.length === 1 ? "" : "es"}.`); }
  function exportChecklist() { saveFile(checklistText(actions, meta()), "text/markdown;charset=utf-8", "action-receipt.md"); setAnnouncement(`Downloaded a checklist with ${approved.length} approved actions.`); }
  function exportCalendar() { saveFile(calendarText(actions, meta()), "text/calendar;charset=utf-8", "action-receipt.ics"); setAnnouncement(`Downloaded ${calendar.length} calendar entries. ${approved.length - calendar.length} approved items omitted because their dates are unresolved.`); }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <header className="site-header"><a className="brand" href="/" aria-label="Action Receipt home"><span className="brand-icon"><ReceiptText size={22} strokeWidth={1.7} /></span><span>Action Receipt<span className="brand-dot">.</span></span></a><div className="header-right"><span className="session-label"><span className="status-dot" /> One notice. Clear next steps.</span><button className="method-button" onClick={() => setMethodOpen(true)}><CircleHelp size={16} /> How it works</button></div></header>
      <main>
        <section className="intro"><div><p className="eyebrow"><span /> FROM NOTICE TO NEXT STEP</p><h1>Know what’s next.<br /><em>Keep the proof.</em></h1><p className="intro-copy">Turn a tangled notice into a checklist you can check.<br className="desktop-break" /> Every action has a source. Every unclear date stays yours to resolve.</p></div><div className="intro-aside"><div className="mini-proof"><Quote size={19} /><div><strong>Less guessing.<br />More checking.</strong><p>AI proposes. You decide.</p></div></div><button className="own-notice-button" onClick={ownNotice}>Use your own notice <ArrowUpRight size={17} /></button></div></section>
        <section className="sample-section" aria-label="Synthetic sample notices"><div className="section-heading"><span>TAKE A QUICK LOOK</span><span>Three invented notices. Three useful checks.</span></div><div className="samples">{samples.map((sample, i) => <button className={`sample-choice ${sampleId === sample.id ? "selected" : ""}`} key={sample.id} onClick={() => loadSample(sample.id)}><span className="sample-index">0{i + 1}</span><span className="sample-copy"><strong>{sample.label}</strong><span>{sample.kind}</span></span><ArrowUpRight size={17} /></button>)}</div></section>
        <section id="workspace" className="workspace" aria-label="Notice review workspace">
          <div className="workspace-top"><div className="workspace-title"><span className="workspace-number">01</span><h2>Your notice, made clearer</h2></div><span className="privacy-label"><LockKeyhole size={13} /> No saved notice history</span></div>
          {mode === "sample" && <div className="mode-banner"><Info size={16} /><p><strong>Synthetic sample walkthrough.</strong> These are saved example results, not live AI extraction. Review, edit, and export them to explore the workflow.</p></div>}
          {mode === "live" && <div className="mode-banner live"><Sparkles size={16} /><p><strong>Live AI proposals{model ? ` · ${model}` : ""}.</strong> Check the notice for missed or misinterpreted instructions before approving.</p></div>}
          <div className="workspace-grid">
            <section className="source-panel" aria-labelledby="source-heading"><div className="panel-heading"><div><FileText size={17} /><h2 id="source-heading">The original notice</h2></div><span className="panel-caption">YOUR SOURCE OF TRUTH</span></div>
              <div className="source-meta"><label htmlFor="notice-title">Notice name <span>(optional)</span></label><input id="notice-title" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Campus workshop registration" /></div>
              <div className="source-tabs" role="group" aria-label="Source view"><button className={!editing ? "active" : ""} onClick={() => setEditing(false)} disabled={!source}><FileText size={13} /> Read & inspect</button><button className={editing ? "active" : ""} onClick={() => setEditing(true)}><Pencil size={13} /> Edit notice</button></div>
              {editing ? <div className="notice-editor"><label className="sr-only" htmlFor="notice-text">Paste the notice text</label><textarea ref={noticeInput} id="notice-text" value={source} maxLength={MAX_NOTICE_LENGTH} placeholder="Paste a school, club, or event notice here. Include the dates and conditions exactly as written." onChange={e => resetResults(e.target.value)} /><div className="editor-footer"><span>Editing clears previous results and approvals.</span><span>{source.length.toLocaleString()} / 15,000</span></div></div> : <div className="notice-paper">{source ? <><p className="document-kicker">{mode === "sample" ? "SYNTHETIC EXAMPLE" : "ORIGINAL TEXT"}</p><pre className="notice-content"><SourcePassage source={source} selected={selected} /></pre><div className="paper-end"><span /><ReceiptText size={17} /><span /></div></> : <div className="empty-source"><FileText size={30} /><h3>A little context goes a long way.</h3><p>Paste the complete notice, including dates and conditions.</p><button className="text-button" onClick={() => { setEditing(true); setTimeout(() => noticeInput.current?.focus(), 0); }}>Paste a notice <ArrowRight size={14} /></button></div>}</div>}
              {selected && !editing && <div className="highlight-note"><Quote size={13} /> {selected.starts.length} exact match{selected.starts.length === 1 ? "" : "es"} highlighted<button onClick={() => setSelected(null)} aria-label="Clear source highlighting"><X size={13} /></button></div>}
              <div className="analyze-area"><button className="primary-button analyze-button" disabled={busy || source.trim().length < MIN_NOTICE_LENGTH} onClick={analyze}>{busy ? <LoaderCircle size={17} className="spin" /> : <Sparkles size={17} />}{busy ? "Reading your notice…" : "Analyze notice with AI"}<ArrowRight size={17} /></button><p>{liveReady === false ? "Live AI is not connected yet. The sample walkthrough is available above." : "Sends this text to OpenAI for processing. Avoid sensitive personal information."}</p>{liveReady === false && <p className="processing-disclosure">Using Analyze sends text to OpenAI once live AI is enabled.</p>}{error && <div className="error-message" role="alert"><TriangleAlert size={16} /><span>{error}</span></div>}</div>
            </section>
            <section className="actions-panel" aria-labelledby="actions-heading"><div className="panel-heading"><div><ReceiptText size={17} /><h2 id="actions-heading">Your action receipt</h2><span className="count-badge">{active.length}</span></div><span className="panel-caption">REVIEW BEFORE YOU EXPORT</span></div>
              <div className="review-summary"><span><span className="summary-dot green-dot" /> {approved.length} approved</span><span><span className="summary-dot amber-dot" /> {unclear} date{unclear === 1 ? "" : "s"} to confirm</span></div>
              <div className="actions-list">{busy ? <div className="empty-actions"><span className="empty-icon"><Sparkles size={28} className="pulse" /></span><h3>Finding the next steps.</h3><p>Actions and source passages will appear here for your review.</p></div> : actions.length ? actions.map((a, index) => <ActionCard key={a.id} action={a} index={index} onChange={next => setActions(old => old.map(item => item.id === next.id ? next : item))} onEvidence={highlight} />) : <div className="empty-actions"><span className="empty-icon"><ReceiptText size={30} /></span><h3>{mode === "live" ? "No actions were identified." : "A clear next step starts here."}</h3><p>{mode === "live" ? "Check the original notice yourself. The model may have missed something." : "Analyze a notice or try a synthetic sample. Nothing is approved automatically."}</p></div>}</div>
              {notes.length > 0 && <details className="notice-notes"><summary><Info size={14} /> Notice-level notes <ChevronDown size={13} /></summary><ul>{notes.map((note, i) => <li key={i}>{note}</li>)}</ul></details>}
              <div className="export-area"><div className="export-title"><span className="export-icon"><ShieldCheck size={18} /></span><div><h3>Your approval is the final step.</h3><p>Only checked actions leave this workspace.</p></div></div><div className="export-buttons"><button disabled={!approved.length} onClick={exportChecklist}><Download size={15} /> Checklist <span>{approved.length}</span></button><button disabled={!calendar.length} onClick={exportCalendar}><CalendarDays size={15} /> Calendar <span>{calendar.length}</span></button></div><p className="export-hint">{approved.length > calendar.length ? `${approved.length - calendar.length} approved item${approved.length - calendar.length === 1 ? " stays" : "s stay"} in the checklist only. Confirm complete dates in Review details to include them in the calendar.` : "Downloads a Markdown checklist or .ics file. Nothing is added to your calendar automatically."}</p></div>
            </section>
          </div>
        </section>
        <section className="principles" aria-label="Review principles"><div><span>01</span><p><strong>Follow the evidence.</strong> Open a source passage to see the words behind an action.</p></div><div><span>02</span><p><strong>Keep uncertainty visible.</strong> Unclear dates stay unresolved until you clarify them.</p></div><div><span>03</span><p><strong>Make the final call.</strong> Check meaning, conditions, and anything the AI missed.</p></div></section>
      </main>
      <footer><span className="footer-brand"><ReceiptText size={15} /> Action Receipt</span><p>A small tool for a more considered next step.</p><button onClick={() => setMethodOpen(true)}>Method & privacy <ArrowUpRight size={12} /></button></footer>
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
      <dialog ref={dialog} className="method-dialog" onCancel={() => setMethodOpen(false)} onClose={() => setMethodOpen(false)}><button className="dialog-close icon-button" onClick={() => setMethodOpen(false)} aria-label="Close method and privacy"><X size={20} /></button><span className="dialog-symbol"><ReceiptText size={27} /></span><p className="eyebrow">A RECEIPT, WITH REASONS</p><h2>Useful AI leaves room<br />for your judgment.</h2><p>Action Receipt helps you inspect proposed actions from one notice. It does not guarantee a correct or complete reading.</p><ol><li><strong>Find the source.</strong> Quotations are matched exactly against the pasted text. A match proves the quotation is present, not that the interpretation is right.</li><li><strong>Clarify the date.</strong> Relative wording, missing years and conflicting dates need your decision. Timed deadlines also need a confirmed UTC offset.</li><li><strong>Approve deliberately.</strong> Edits clear approval. Calendar downloads contain only approved actions with confirmed, complete dates. Original warnings stay in the files.</li></ol><h3>What happens to your notice?</h3><p>Walkthroughs use invented notices and saved results in your browser. Live analysis sends the notice to OpenAI through this app’s server. Provider data handling is governed by its terms. The app does not save a notice history or log notice bodies; refreshing clears your session. Downloaded files may contain your source quotations.</p><p className="dialog-note">The live AI service is being configured and tested in the owner’s private review site. Sample mode is always labeled, including in downloads.</p><button className="primary-button" onClick={() => setMethodOpen(false)}>Back to the workspace <ArrowRight size={16} /></button></dialog>
    </div>
  );
}
