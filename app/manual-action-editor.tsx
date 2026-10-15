"use client";

import type { FormEvent, RefObject } from "react";
import { Plus, Quote } from "lucide-react";
import type { Evidence } from "../lib/receipt.ts";

export default function ManualActionEditor({ open, source, disabled, limitReached, selected, title, quote, condition, error, titleRef, onChange, onReuse, onSubmit, onClose }: {
  open: boolean; source: string; disabled: boolean; limitReached: boolean; selected: Evidence | null;
  title: string; quote: string; condition: string; error: string; titleRef: RefObject<HTMLInputElement | null>;
  onChange: (patch: Partial<{ title: string; quote: string; condition: string }>) => void; onReuse: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void;
}) {
  const quoteTooLong = quote.trim().length > 1200;
  const exactMatch = Boolean(quote.trim() && !quoteTooLong && source.includes(quote.trim()));
  const ready = !disabled && Boolean(title.trim()) && exactMatch;
  const readiness = disabled ? limitReached ? "The 20-action limit includes omitted actions. Review existing actions instead." : "Wait for the notice or review file to finish loading. Your draft stays in this form."
    : !title.trim() ? "Write what needs to be done before adding this action."
    : !exactMatch ? "Check the supporting passage above. It must be an exact excerpt of 1,200 characters or fewer."
    : "Ready to add for review. Action approval and calendar-date checks remain separate.";
  return <form id="manual-action-form" hidden={!open} className="manual-action-form" aria-labelledby="manual-action-form-title" onSubmit={onSubmit}>
    <fieldset disabled={disabled}>
      <legend id="manual-action-form-title">Add a source-backed action</legend>
      <p>Repair a missed instruction, or review a notice yourself. Your action will be labeled as added by you and needs approval before export.</p>
      <label htmlFor="manual-action-title">What needs to be done?</label><input ref={titleRef} id="manual-action-title" required maxLength={240} value={title} onChange={e => onChange({ title: e.target.value })} placeholder="e.g. Bring a signed permission slip" />
      <label htmlFor="manual-action-quote">Exact supporting passage</label><textarea id="manual-action-quote" required rows={3} value={quote} onChange={e => onChange({ quote: e.target.value })} placeholder="Copy the relevant words from the original notice." aria-invalid={quoteTooLong || Boolean(quote.trim() && !exactMatch)} aria-describedby="manual-passage-hint" />
      {selected && <button className="text-button reuse-passage" type="button" disabled={selected.quote.length > 1200} onClick={onReuse}><Quote size={13} /> Use highlighted passage</button>}
      {selected && selected.quote.length > 1200 && <p className="field-hint">The highlighted passage is longer than 1,200 characters. Copy a shorter exact excerpt from it.</p>}
      <p className={`field-hint ${exactMatch ? "matched-passage" : ""}`} id="manual-passage-hint" role="status">{quoteTooLong ? "The full paste is kept, but this excerpt is over 1,200 characters. Choose a shorter exact excerpt that keeps any applicable conditions, dates and times." : quote.trim() ? exactMatch ? "This passage occurs in the notice. Check that it supports your action." : "This passage does not match the notice. Copy its exact wording." : "Include any conditions, dates and times that apply. Up to 1,200 characters."}</p>
      <label htmlFor="manual-action-condition">Condition or optionality <span>(optional)</span></label><input id="manual-action-condition" maxLength={600} value={condition} onChange={e => onChange({ condition: e.target.value })} placeholder="e.g. Only if you plan to attend" />
      <p className="field-hint">Set and confirm any date in Review details after adding the action.</p>
    </fieldset>
    {error && <p className="error-message" role="alert">{error}</p>}
    <p id="manual-action-readiness" className="manual-action-readiness" role="status">{readiness}</p>
    <div className="manual-form-buttons"><button className="primary-button" type="submit" disabled={!ready} aria-describedby="manual-action-readiness"><Plus size={15} /> Add for review</button><button className="text-button" type="button" onClick={onClose}>Close without adding</button></div>
    <p className="field-hint">Closing keeps this draft in this tab. Replacing or rescanning the notice clears it. Review-file downloads do not include unfinished form entries.</p>
  </form>;
}
