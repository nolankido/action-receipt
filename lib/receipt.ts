import { z } from "zod";
import { explicitDates, validDate, weekdayConflicts } from "./dates.ts";
import { cutoffFitsCalendar, mentionsTime, validOffset, validTime } from "./times.ts";
export { explicitDates, validDate } from "./dates.ts";
export { mentionsTime, validOffset, validTime } from "./times.ts";

export const MAX_NOTICE_LENGTH = 15_000;
export const MIN_NOTICE_LENGTH = 30;
export function noticeInputState(source: string): { ready: boolean; kind: "empty" | "short" | "long" | "ready"; message: string } {
  if (source.length > MAX_NOTICE_LENGTH) {
    const extra = source.length - MAX_NOTICE_LENGTH;
    return { ready: false, kind: "long", message: `This notice is ${extra.toLocaleString("en-US")} ${extra === 1 ? "character" : "characters"} over the 15,000-character limit. The full text is still here. Shorten it before scanning, adding actions or saving a review.` };
  }
  const length = source.trim().length;
  if (!length) return { ready: false, kind: "empty", message: "Paste the complete notice: 30 to 15,000 characters. Include its dates and conditions." };
  if (length < MIN_NOTICE_LENGTH) return { ready: false, kind: "short", message: `Add at least ${MIN_NOTICE_LENGTH - length} more characters before continuing. Notices need 30 to 15,000 characters; surrounding spaces do not count toward the minimum.` };
  return { ready: true, kind: "ready", message: "Full text kept. Check that the notice includes all its dates and conditions before scanning." };
}
export const deadlineSchema = z.object({
  text: z.string().max(600),
  evidence: z.array(z.string().min(1).max(1200)).max(4),
  date: z.string().max(10).nullable(),
  time: z.string().max(5).nullable(),
  utcOffset: z.string().max(6).nullable(),
  status: z.enum(["explicit", "ambiguous", "missing", "conflict"]),
}).strict();
export const extractionSchema = z.object({
  actions: z.array(z.object({
    title: z.string().min(1).max(240),
    condition: z.string().max(600).nullable(),
    evidence: z.array(z.string().min(1).max(1200)).min(1).max(4),
    deadline: deadlineSchema,
    issues: z.array(z.string().min(1).max(500)).max(10),
  }).strict()).max(20),
  notes: z.array(z.string().min(1).max(600)).max(6),
}).strict();
export type Extraction = z.infer<typeof extractionSchema>;
export type RawAction = Extraction["actions"][number];
export type Evidence = { quote: string; starts: number[] };
export type SourceDecision = {
  kind: "linked" | "not_action" | "clarify";
  note: string;
  actionId: string | null;
  origin: "user" | "imported";
  confirmed: boolean;
  actionSnapshot: string | null;
};
export type SourceReviewItem = { id: string; evidence: Evidence; reason: string; decision?: SourceDecision };
export type ReviewedAction = {
  id: string;
  originalTitle: string;
  title: string;
  originalCondition: string;
  condition: string;
  evidence: Evidence[];
  dateEvidence: Evidence[];
  deadlineText: string;
  originalDate: string;
  date: string;
  time: string;
  utcOffset: string;
  originalTime: string;
  originalUtcOffset: string;
  sourceRequiresTime: boolean;
  requiresTime: boolean;
  dateConfirmed: boolean;
  dateOrigin: "source proposal" | "user supplied" | "review file" | "unresolved";
  evidenceValid: boolean;
  approved: boolean;
  omitted: boolean;
  origin: "extracted" | "rules" | "user" | "imported";
  issues: string[];
};

export function locateEvidence(source: string, quote: string): Evidence {
  const starts: number[] = [];
  let from = 0;
  while (quote && from <= source.length) {
    const index = source.indexOf(quote, from);
    if (index < 0) break;
    starts.push(index);
    from = index + quote.length;
  }
  return { quote, starts };
}

export function validateExtraction(source: string, input: unknown, revision = 1): { actions: ReviewedAction[]; notes: string[] } {
  const raw = extractionSchema.parse(input);
  const actions = raw.actions.map((item, index): ReviewedAction => {
    const evidence = item.evidence.map(q => locateEvidence(source, q));
    const dateEvidence = item.deadline.evidence.map(q => locateEvidence(source, q));
    const evidenceValid = evidence.length > 0 && evidence.every(e => e.starts.length > 0);
    const dateQuotesValid = dateEvidence.length > 0 && dateEvidence.every(e => e.starts.length > 0);
    const issues = [...item.issues];
    if (!evidenceValid) issues.push("An action quotation could not be matched to the notice. Approval is blocked.");
    if (dateEvidence.some(e => !e.starts.length)) issues.push("A deadline quotation could not be matched. Resolve the date yourself.");
    const literalDeadline = item.deadline.text && source.includes(item.deadline.text) ? item.deadline.text : dateEvidence.filter(e => e.starts.length).map(e => e.quote).join(" | ");
    if (item.deadline.text && !source.includes(item.deadline.text)) issues.push("The proposed deadline wording was not verbatim. The source quotations are preserved instead.");
    if ([...evidence, ...dateEvidence].some(e => e.starts.length > 1)) issues.push("A quotation appears more than once. Review all matching passages in context.");
    const quotedDates = explicitDates(dateEvidence.filter(e => e.starts.length).map(e => e.quote).join("\n"));
    const weekdayIssues = [...new Set(dateEvidence.filter(e => e.starts.length).flatMap(e => weekdayConflicts(e.quote)))];
    issues.push(...weekdayIssues.slice(0, 3));
    const explicit = item.deadline.status === "explicit" && dateQuotesValid && !weekdayIssues.length && quotedDates.length === 1 && item.deadline.date === quotedDates[0];
    const proposedDate = explicit && validDate(item.deadline.date ?? "") ? item.deadline.date! : "";
    if (weekdayIssues.length || item.deadline.status === "conflict" || quotedDates.length > 1) issues.push("The notice gives conflicting date information. Choose a date only after clarifying it.");
    else if (item.deadline.status === "ambiguous") issues.push("The deadline is ambiguous. A date needs your clarification.");
    else if (!proposedDate) issues.push(item.deadline.text ? "A complete, unambiguous date was not established from the quoted text." : "No deadline was stated for this action.");
    const timeContext = literalDeadline + " " + dateEvidence.filter(e => e.starts.length).map(e => e.quote).join(" ");
    const sourceRequiresTime = mentionsTime(timeContext);
    const requiresTime = sourceRequiresTime || Boolean(item.deadline.time);
    return {
      id: `r${revision}-a${index + 1}`, originalTitle: item.title, title: item.title,
      originalCondition: item.condition ?? "", condition: item.condition ?? "", evidence, dateEvidence,
      deadlineText: literalDeadline, originalDate: proposedDate, date: proposedDate,
      time: validTime(item.deadline.time ?? "") ? item.deadline.time! : "",
      utcOffset: validOffset(item.deadline.utcOffset ?? "") ? item.deadline.utcOffset! : "",
      originalTime: validTime(item.deadline.time ?? "") ? item.deadline.time! : "",
      originalUtcOffset: validOffset(item.deadline.utcOffset ?? "") ? item.deadline.utcOffset! : "",
      sourceRequiresTime,
      requiresTime, dateConfirmed: false, dateOrigin: proposedDate ? "source proposal" : "unresolved",
      evidenceValid, approved: false, omitted: false, origin: "extracted", issues: [...new Set(issues)],
    };
  });
  return { actions, notes: raw.notes };
}

export function canConfirmDate(action: ReviewedAction): boolean {
  return validDate(action.date) && (!action.requiresTime || cutoffFitsCalendar(action.date, action.time, action.utcOffset));
}
export function manualAction(source: string, title: string, quote: string, condition: string, id: number): ReviewedAction {
  const input = noticeInputState(source);
  if (!input.ready) throw new Error(input.message);
  title = title.trim(); quote = quote.trim(); condition = condition.trim();
  if (!title || title.length > 240) throw new Error("Write a short action, up to 240 characters.");
  if (!quote || quote.length > 1200 || !source.includes(quote)) throw new Error("Paste an exact supporting passage from this notice, up to 1,200 characters.");
  if (condition.length > 600) throw new Error("Keep the condition under 600 characters.");
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("The action identifier is invalid.");
  const result = validateExtraction(source, { actions: [{ title, condition: condition || null, evidence: [quote], deadline: { text: "", evidence: [quote], date: null, time: null, utcOffset: null, status: "ambiguous" }, issues: [] }], notes: [] }).actions[0];
  return { ...result, id: `manual-${id}`, origin: "user", dateOrigin: "unresolved", issues: ["Added by you from source text. Check its meaning, condition and any date or time before approving.", ...result.issues] };
}
export function nextManualNumber(actions: ReviewedAction[]): number {
  const ids = new Set(actions.map(a => a.id));
  let id = 1;
  while (ids.has(`manual-${id}`)) id++;
  return id;
}
export function calendarEligible(action: ReviewedAction): boolean {
  return checklistEligible(action) && action.dateConfirmed && canConfirmDate(action);
}
export function checklistEligible(action: ReviewedAction): boolean {
  return action.approved && canApprove(action);
}
export function canApprove(action: ReviewedAction): boolean {
  return action.evidenceValid && !action.omitted && Boolean(action.title.trim());
}
export function editAction(action: ReviewedAction, patch: Partial<Pick<ReviewedAction, "title" | "condition" | "date" | "time" | "utcOffset" | "requiresTime" | "omitted">>): ReviewedAction {
  const dateChanged = ["date", "time", "utcOffset", "requiresTime"].some(key => key in patch && patch[key as keyof typeof patch] !== action[key as keyof ReviewedAction]);
  const requiresTime = action.sourceRequiresTime || (patch.requiresTime ?? action.requiresTime);
  return {
    ...action, ...patch, requiresTime, approved: false,
    ...(!requiresTime && patch.requiresTime === false ? { time: "", utcOffset: "" } : {}),
    dateConfirmed: dateChanged ? false : action.dateConfirmed,
    dateOrigin: dateChanged ? "user supplied" : action.dateOrigin,
  };
}
export function resultIsCurrent(request: number, current: number, source: string, currentSource: string): boolean {
  return request === current && source === currentSource;
}
export function displayDate(value: string): string {
  if (!validDate(value)) return "Date needs clarification";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));
}
