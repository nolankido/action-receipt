import { canApprove, canConfirmDate, validDate, validTime, validOffset, type ReviewedAction, type SourceReviewItem } from "./receipt.ts";
import { modeDescription, type ReceiptMeta } from "./export.ts";

export type ClarificationCandidate = {
  id: string; basis: string; kind: "note" | "date"; context: string;
  condition: string; detail: string; origin: string; question: string; quotes: string[];
};
export type QuestionDraft = { id: string; basis: string; text: string; checked: boolean };
export const MAX_QUESTION_LENGTH = 600;
const matches = (source: string, quote: string) => Boolean(quote.trim() && source.includes(quote));
const origin = (a: ReviewedAction) => a.origin === "imported" ? "Imported action; interpretation unverified" : a.origin === "user" ? "Action added by user" : a.origin === "rules" ? "Local text-rule proposal" : "Saved synthetic sample proposal";

// Optional question drafts, never deadlines or obligations. Recheck quotations
// against the current source instead of trusting cached match positions.
export function clarificationCandidates(source: string, actions: ReviewedAction[], items: SourceReviewItem[]): ClarificationCandidate[] {
  const recorded = items.filter(item => item.decision?.kind === "clarify" && item.decision.confirmed && item.decision.origin === "user" && matches(source, item.evidence.quote));
  const candidates: ClarificationCandidate[] = recorded.map(item => {
    const data = { kind: "note" as const, context: "Source passage marked for clarification", condition: "", detail: item.reason,
      origin: "Clarification note recorded by user in this review", question: item.decision!.note, quotes: [item.evidence.quote] };
    return { id: `flag:${item.id}`, ...data, basis: JSON.stringify([source, data]) };
  });
  for (const a of actions) {
    if (!canApprove(a) || canConfirmDate(a) || !a.evidence.length || !a.evidence.every(e => matches(source, e.quote))) continue;
    // An explicit clarification note for this exact passage takes precedence
    // over a generic date prompt. Distinct user notes remain separate.
    if (recorded.some(item => a.evidence.some(e => e.quote === item.evidence.quote))) continue;
    const missing = [!validDate(a.date) ? "complete calendar date, including the year" : "", a.requiresTime && !validTime(a.time) ? "cutoff time" : "", a.requiresTime && !validOffset(a.utcOffset) ? "UTC offset on that date" : ""].filter(Boolean);
    const question = missing.length ? `Does this instruction have a deadline? If so, please confirm the ${missing.join(" and ")}${validDate(a.date) ? " and the applicable calendar date" : ""}. If no deadline applies, please say so.` : "Please check the calendar date, cutoff time and UTC offset. Their UTC conversion falls outside the supported calendar range.";
    const data = { kind: "date" as const, context: a.title, condition: a.condition,
      detail: `Original deadline wording: ${a.deadlineText || "Not stated"}`, origin: origin(a), question,
      quotes: [...new Set([...a.evidence, ...a.dateEvidence].filter(e => matches(source, e.quote)).map(e => e.quote))] };
    candidates.push({ id: `action:${a.id}`, ...data, basis: JSON.stringify([source, data, a.date, a.time, a.utcOffset, a.requiresTime]) });
  }
  return candidates;
}
export function questionDraft(candidate: ClarificationCandidate): QuestionDraft {
  return { id: candidate.id, basis: candidate.basis, text: candidate.question, checked: false };
}
export function editQuestionDraft(draft: QuestionDraft, text: string): QuestionDraft {
  return text === draft.text ? draft : { ...draft, text, checked: false };
}
export function selectedQuestions(candidates: ClarificationCandidate[], drafts: QuestionDraft[]) {
  const seen = new Set<string>();
  return drafts.filter(draft => draft.checked).map(draft => {
    const candidate = candidates.find(c => c.id === draft.id);
    if (!candidate || candidate.basis !== draft.basis || seen.has(draft.id)) throw new Error("A selected question's source or context changed. Close and reopen the sheet, then check it again.");
    seen.add(draft.id);
    if (!draft.text.trim() || draft.text.trim().length > MAX_QUESTION_LENGTH) throw new Error("Keep each selected question between 1 and 600 characters.");
    return { candidate, text: draft.text.trim(), edited: draft.text.trim() !== candidate.question.trim() };
  });
}
const markdown = (text: string) => text.replace(/([\\`*_{}\[\]<>#|])/g, "\\$1");
const line = (text: string) => markdown(text.replace(/[\r\n]+/g, " ").trim());
export function clarificationText(source: string, actions: ReviewedAction[], meta: ReceiptMeta, drafts: QuestionDraft[]): string {
  const selected = selectedQuestions(clarificationCandidates(source, actions, meta.attention ?? []), drafts);
  if (!selected.length) throw new Error("Check at least one question before downloading the sheet.");
  const out = ["# Action Receipt: clarification questions", "", `Notice: ${line(meta.title || "Untitled notice")}`,
    `Receipt created: ${meta.createdAt.toISOString()}`, `Mode: ${modeDescription(meta.mode, meta.restored)}`, "",
    "These questions were selected and checked by the user. They are not approved tasks or calendar entries. No question has been sent and no date has been resolved.", "",
    "Only selected questions and their supporting context are included. This is not the full notice or a completeness check. Quotations establish presence, not correct interpretation.", ""];
  selected.forEach(({ candidate: c, text, edited }, i) => {
    out.push(`## Question ${i + 1}`, "", line(text), "", `Context: ${line(c.context)}`);
    if (c.condition) out.push(`Condition: ${line(c.condition)}`);
    out.push(`Context origin: ${c.origin}`, `Original context: ${line(c.detail)}`,
      `Question wording: ${edited ? "Edited by user, then checked for this sheet" : c.kind === "note" ? "User's recorded clarification note, checked for this sheet" : "Local template, checked by user for this sheet"}`, "", "Supporting source:", "");
    for (const quote of c.quotes) out.push(...quote.split(/\r\n|\r|\n/).map(part => `> ${markdown(part)}`), "");
  });
  return out.join("\n");
}
