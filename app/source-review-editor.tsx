"use client";

import type { FormEvent, RefObject } from "react";
import type { ReviewedAction, SourceReviewItem } from "../lib/receipt.ts";
import { planSourceReviewForm, type SourceEditorMode, type SourceReviewFields } from "../lib/source-review-form.ts";

export default function SourceReviewEditor({ item, actions, mode, fields, disabled, error, formRef, onChange, onSubmit, onCancel }: {
  item: SourceReviewItem; actions: ReviewedAction[]; mode: SourceEditorMode; fields: SourceReviewFields; disabled: boolean; error: string;
  formRef: RefObject<HTMLFormElement | null>; onChange: (patch: Partial<SourceReviewFields>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void;
}) {
  const plan = planSourceReviewForm(mode, fields, item.evidence.quote, actions);
  const prefix = `${item.id}-editor`;
  return <form id={prefix} ref={formRef} className="queue-form" onSubmit={onSubmit} aria-describedby={`${prefix}-boundary`}>
    <fieldset disabled={disabled}>
      <legend>{mode === "create" ? "Create a source-backed action" : "Record your source decision"}</legend>
      <p className="queue-required">All fields are required unless marked optional. Drafts stay only while this passage's card is open; changing passages discards unfinished entries.</p>
      {mode === "create" ? <>
        <label htmlFor={`${prefix}-title`}>Action wording</label><input id={`${prefix}-title`} required maxLength={240} value={fields.title} onChange={e => onChange({ title: e.target.value })} />
        <label htmlFor={`${prefix}-quote`}>Exact supporting excerpt</label><textarea id={`${prefix}-quote`} required rows={3} aria-invalid={plan.quoteTooLong || Boolean(fields.quote.trim() && !plan.exact)} aria-describedby={`${prefix}-quote-hint`} value={fields.quote} onChange={e => onChange({ quote: e.target.value })} />
        <p id={`${prefix}-quote-hint`} className="field-hint">{plan.quoteTooLong ? "The full paste is kept, but this excerpt is over 1,200 characters. Choose a shorter exact excerpt that keeps its applicable conditions, dates and times." : item.evidence.quote.length > 1200 ? "Copy a shorter exact excerpt from the passage above, up to 1,200 characters." : "Keep any conditions that apply. The quotation must be an exact excerpt from this passage."}{fields.quote.trim() && !plan.quoteTooLong && !plan.exact ? " This excerpt does not match." : ""}</p>
        <label htmlFor={`${prefix}-condition`}>Condition or optionality (optional)</label><input id={`${prefix}-condition`} maxLength={600} value={fields.condition} onChange={e => onChange({ condition: e.target.value })} />
      </> : <>
        <label htmlFor={`${prefix}-kind`}>How are you addressing this flag?</label><select id={`${prefix}-kind`} value={fields.kind} onChange={e => onChange({ kind: e.target.value as SourceReviewFields["kind"] })}><option value="linked">Link to an existing action</option><option value="not_action">This is not an obligation</option><option value="clarify">I need clarification</option></select>
        {fields.kind === "linked" && <><label htmlFor={`${prefix}-action`}>Choose an action</label><select id={`${prefix}-action`} required value={fields.actionId} aria-describedby={!plan.candidates.length ? `${prefix}-no-actions` : undefined} onChange={e => onChange({ actionId: e.target.value })}><option value="">Select an action</option>{plan.candidates.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select>{!plan.candidates.length && <p id={`${prefix}-no-actions`} className="field-hint">No active action has matched evidence and nonempty wording. Cancel to create an action from this passage, or choose a different decision above.</p>}</>}
      </>}
      <label htmlFor={`${prefix}-note`}>{mode === "create" ? "How does this action address the flag?" : "Explain your decision"}</label><textarea id={`${prefix}-note`} required maxLength={600} rows={2} value={fields.note} onChange={e => onChange({ note: e.target.value })} placeholder={fields.kind === "clarify" && mode !== "create" ? "What do you still need to ask or check?" : "Record your reasoning in your own words."} />
      <p id={`${prefix}-boundary`} className="field-hint">Recording a decision does not approve an action, confirm a date or transfer a deadline. The original warning stays in the receipt.</p>
      {error && <p className="error-message" role="alert">{error}</p>}
      <p id={`${prefix}-readiness`} className={`queue-form-readiness ${plan.ready ? "is-ready" : ""}`} role="status">{plan.message}</p>
      <div className="queue-form-buttons"><button className="primary-button" type="submit" disabled={!plan.ready} aria-describedby={`${prefix}-readiness`}>{mode === "create" ? "Add action and record link" : "Record checked decision"}</button><button className="text-button" type="button" onClick={onCancel}>Cancel</button></div>
    </fieldset>
  </form>;
}
