import type { ReviewedAction } from "./receipt.ts";
import type { DecisionInput } from "./source-review.ts";

export type SourceReviewFields = { kind: DecisionInput["kind"]; actionId: string; note: string; title: string; quote: string; condition: string };
export type SourceEditorMode = "decision" | "create";

// Explain the existing UI gates. Recording still goes through domain validation
// and never grants action approval or calendar confirmation.
export function planSourceReviewForm(mode: SourceEditorMode, fields: SourceReviewFields, passage: string, actions: readonly ReviewedAction[]) {
  const candidates = actions.filter(a => !a.omitted && a.evidenceValid && a.title.trim());
  const quoteTooLong = fields.quote.trim().length > 1200;
  const exact = Boolean(fields.quote.trim() && !quoteTooLong && passage.includes(fields.quote.trim()));
  const problems: string[] = [];
  if (mode === "create") {
    if (actions.length >= 20) problems.push("This receipt already has 20 actions. Review existing actions or record a decision instead.");
    if (!fields.title.trim()) problems.push("Write the missing action in your own words.");
    if (quoteTooLong) problems.push("Choose an exact excerpt of 1,200 characters or fewer. Your full paste is kept in the field.");
    else if (!exact) problems.push("Use an exact excerpt from this flagged passage, including any applicable conditions.");
  } else if (fields.kind === "linked" && !candidates.some(a => a.id === fields.actionId)) {
    problems.push(candidates.length ? "Choose the source-backed action that addresses this passage." : "No active action with matched evidence is available to link. Create one from this passage, or choose another decision.");
  }
  if (!fields.note.trim()) problems.push(mode === "create" ? "Explain how the new action addresses this flag." : "Explain your decision in your own words.");
  return { candidates, quoteTooLong, exact, ready: problems.length === 0, message: problems[0] ?? "Ready to record. Action approval and calendar-date checks remain separate." };
}
