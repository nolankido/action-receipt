"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Download, MessageCircleQuestion, Quote, X } from "lucide-react";
import { clarificationCandidates, clarificationText, editQuestionDraft, MAX_QUESTION_LENGTH, questionDraft, type QuestionDraft } from "../lib/clarification.ts";
import type { ReceiptMeta } from "../lib/export.ts";
import type { ReviewedAction } from "../lib/receipt.ts";

export default function ClarificationSheet({ source, actions, meta, onClose, onDownload }: {
  source: string; actions: ReviewedAction[]; meta: ReceiptMeta; onClose: () => void; onDownload: (text: string, count: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const candidates = clarificationCandidates(source, actions, meta.attention ?? []);
  const [drafts, setDrafts] = useState<QuestionDraft[]>(() => candidates.map(questionDraft));
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  const update = (id: string, edit: (draft: QuestionDraft) => QuestionDraft) => setDrafts(old => old.map(d => d.id === id ? edit(d) : d));
  const count = drafts.filter(d => d.checked).length;
  let text = "", error = "";
  if (count) { try { text = clarificationText(source, actions, meta, drafts); } catch (e) { error = e instanceof Error ? e.message : "Reopen the sheet and check the questions again."; } }
  return <dialog ref={dialog} className="export-preview clarification-sheet" aria-labelledby="clarification-heading" aria-describedby="clarification-description" onCancel={onClose} onClose={onClose}>
    <div className="preview-header"><div><p className="eyebrow">WHEN THE NOTICE LEAVES A QUESTION</p><h2 id="clarification-heading">Ask with the source.</h2></div><button className="icon-button" onClick={onClose} aria-label="Close clarification sheet"><X size={21} /></button></div>
    <div className="preview-body"><p id="clarification-description">Choose what you actually need to ask. Edit each draft, check its source, then include it in your sheet. Nothing is selected or sent automatically.</p>
    <p className="question-session-note">Closing discards question edits and selections. Download your sheet before closing; review files do not save question drafts.</p>
    <div className="question-guidance"><MessageCircleQuestion size={19} /><p>Undated checklist items can stay undated. These optional questions cover incomplete date details and source flags you marked as needing clarification. Complete dates that only need your confirmation belong in Review details.</p></div>
    <p className="question-count" role="status">{count} of {candidates.length} question drafts selected.</p>
    {candidates.map((candidate, index) => {
      const draft = drafts.find(d => d.id === candidate.id);
      if (!draft) return null;
      return <section className={`question-card ${draft.checked ? "is-checked" : ""}`} key={candidate.id} aria-labelledby={`question-context-${index}`}>
        <p className="question-kind">{candidate.kind === "note" ? "YOUR CLARIFICATION NOTE" : "OPTIONAL DATE QUESTION"}</p><h3 id={`question-context-${index}`}>{candidate.context}</h3>
        {candidate.condition && <p className="question-condition">Condition: {candidate.condition}</p>}
        <p className="question-origin">{candidate.origin}</p><p className="question-detail">{candidate.detail}</p>
        <details className="question-source"><summary><Quote size={13} /> Check supporting source ({candidate.quotes.length})<ChevronDown size={13} /></summary>{candidate.quotes.map((quote, i) => <blockquote key={i} tabIndex={0}>{quote}</blockquote>)}</details>
        <label className="question-label" htmlFor={`question-text-${index}`}>{candidate.kind === "note" ? "Edit your note into a question" : "Question to ask"}</label><textarea id={`question-text-${index}`} rows={3} maxLength={MAX_QUESTION_LENGTH} value={draft.text} onChange={e => { const value = e.target.value; update(draft.id, d => editQuestionDraft(d, value)); }} aria-describedby={`question-edit-hint-${index}`} />
        <p className="field-hint" id={`question-edit-hint-${index}`}>Editing clears this question's selection. Up to 600 characters.</p>
        <label className="check-row question-check"><input type="checkbox" checked={draft.checked} disabled={!draft.text.trim() || draft.text.trim().length > MAX_QUESTION_LENGTH} onChange={e => { const checked = e.target.checked; update(draft.id, d => ({ ...d, checked })); }} /><span>I checked this question and its source. Include it in my sheet.</span></label>
      </section>;
    })}
    {!candidates.length && <p className="preview-empty">No question drafts are available. Return to the review to check loaded decisions or record what needs clarification.</p>}
    <div className="question-disclosure"><p>The sheet includes only selected questions, their conditions and source quotations. Read it before sharing. Question selection does not approve an action, confirm a date or clear a flag. Closing discards these question edits and selections; review files do not save them.</p></div>
    {error && <p className="error-message" role="alert">{error}</p>}
    {text && <details className="preview-file"><summary>Inspect exact clarification sheet (.md)</summary><pre tabIndex={0} aria-label="Exact clarification sheet download text">{text}</pre></details>}</div>
    <div className="preview-footer"><button className="text-button" onClick={onClose}><ArrowLeft size={15} /> Return to review</button><button className="primary-button" disabled={!text || !!error} onClick={() => onDownload(text, count)}><Download size={15} /> Download questions ({count})</button></div>
  </dialog>;
}
