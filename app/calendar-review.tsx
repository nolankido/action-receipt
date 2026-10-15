"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { MAX_CALENDAR_DRAFT_LENGTH, canConfirmDate, dateConfirmationIssues, editAction, validDate, validOffset, validTime, type ReviewedAction } from "../lib/receipt.ts";

export default function CalendarReview({ action, open, onOpenChange, onChange }: {
  action: ReviewedAction; open: boolean; onOpenChange: (open: boolean) => void; onChange: (action: ReviewedAction) => void;
}) {
  const eligible = action.dateConfirmed && canConfirmDate(action);
  const issues = dateConfirmationIssues(action);
  const oversizedDraft = action.time.length > MAX_CALENDAR_DRAFT_LENGTH || action.utcOffset.length > MAX_CALENDAR_DRAFT_LENGTH;
  const prefix = action.id;
  const change = (patch: Parameters<typeof editAction>[1]) => onChange(editAction(action, patch));
  return <details className="calendar-editor" open={open} onToggle={event => onOpenChange(event.currentTarget.open)}>
    <summary><CalendarDays size={17} aria-hidden="true" /><span><strong>Optional calendar details</strong><small>{oversizedDraft ? "Time or offset draft too long to save" : eligible ? "Date details confirmed" : issues.length ? `${issues.length} ${issues.length === 1 ? "detail" : "details"} to check` : "Ready for your date check"}</small></span><ChevronDown size={15} aria-hidden="true" /></summary>
    <div className="calendar-editor-body">
      <p className="field-hint calendar-optional-note">An approved action can stay checklist-only. Open and check these details only if you want a calendar entry.</p>
      <label htmlFor={`${prefix}-date`}>Calendar date <span className="optional-label">confirm after checking</span></label><input type="date" id={`${prefix}-date`} min="1000-01-01" max="9999-12-31" aria-invalid={Boolean(action.date) && !validDate(action.date)} aria-describedby={`${prefix}-calendar-help`} value={action.date} onChange={e => change({ date: e.target.value })} />
      {!action.sourceRequiresTime && <label className="check-row timed-cutoff-toggle"><input type="checkbox" checked={action.requiresTime} onChange={e => change({ requiresTime: e.target.checked })} /><span>This action has a timed cutoff.</span></label>}
      {action.requiresTime && <div className="time-fields"><div><label htmlFor={`${prefix}-time`}>Cutoff time</label><input type="time" id={`${prefix}-time`} step={60} aria-invalid={Boolean(action.time) && !validTime(action.time)} aria-describedby={`${prefix}-calendar-help`} value={action.time} onChange={e => change({ time: e.target.value })} /></div><div><label htmlFor={`${prefix}-offset`}>UTC offset on that date</label><input id={`${prefix}-offset`} placeholder="e.g. -10:00" aria-invalid={Boolean(action.utcOffset) && !validOffset(action.utcOffset)} aria-describedby={`${prefix}-calendar-help`} value={action.utcOffset} onChange={e => change({ utcOffset: e.target.value })} /></div></div>}
      <p className="field-hint">{action.requiresTime ? "Confirm the cutoff and UTC offset for this specific date. Daylight saving time can change offsets." : "Calendar export creates an all-day deadline marker. No cutoff time or reminder is inferred."}</p>
      <div id={`${prefix}-calendar-help`} className={`calendar-review-help ${issues.length ? "needs-details" : ""}`}><strong>{issues.length ? "Calendar is optional. These details still need checking:" : eligible ? "Date details confirmed." : "Complete details, ready for your date check."}</strong>{issues.length > 0 && <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}{action.requiresTime && action.time && !validTime(action.time) && <p>Time value needing review: <code>{action.time}</code></p>}<p>{action.requiresTime ? "Use HH:MM and an explicit signed UTC offset, such as -10:00 or +05:30. The full offset paste is kept; unsupported formats are not shortened." : "Keep the action undated for checklist-only use if its deadline is unknown. Never guess a date to finish."}</p>{oversizedDraft && <p className="error-message">A time or offset draft is over 64 characters. The full value is kept, but shorten it before saving a review file.</p>}</div>
      <label className="check-row date-confirm"><input type="checkbox" aria-label={`Confirm ${action.requiresTime ? "date, time and UTC offset" : "date"} for: ${action.title || "untitled action"}`} checked={action.dateConfirmed} disabled={!canConfirmDate(action) || action.omitted} onChange={e => onChange({ ...action, dateConfirmed: e.target.checked, approved: false })} /><span>I confirmed this date{action.requiresTime ? ", time, and UTC offset" : ""}.</span></label>
      <p className="provenance">{action.dateOrigin === "user supplied" ? "Date or time edited by you. Original wording and warnings stay in the receipt." : action.dateOrigin === "review file" ? "Date or time loaded from a review file. Check it against the source and confirm again." : "Dates are proposals until you confirm them."}</p>
    </div>
  </details>;
}
