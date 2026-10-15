import { z } from "zod";
import { MAX_NOTICE_LENGTH, MIN_NOTICE_LENGTH, locateEvidence, mentionsTime, type ReviewedAction, type SourceReviewItem } from "./receipt.ts";
import type { ReceiptMeta } from "./export.ts";
import { extractLocally } from "./local-extraction.ts";

export const MAX_REVIEW_BYTES = 1_000_000;
const importWarning = "Loaded from a review file. Its interpretation and metadata are unverified. Check the source again; approvals and date confirmations were reset.";
const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
const quote = z.string().min(1).max(1200);
const savedAction = z.object({
  id: identifier, title: z.string().max(240), originalTitle: z.string().min(1).max(240),
  condition: z.string().max(600), originalCondition: z.string().max(600),
  evidence: z.array(quote).min(1).max(4), dateEvidence: z.array(quote).max(4), deadlineText: z.string().max(5000),
  date: z.string().max(10), originalDate: z.string().max(10), time: z.string().max(5), originalTime: z.string().max(5),
  utcOffset: z.string().max(6), originalUtcOffset: z.string().max(6), requiresTime: z.boolean(), omitted: z.boolean(),
  origin: z.enum(["extracted", "rules", "user", "imported"]), issues: z.array(z.string().min(1).max(600)).max(24),
}).strict();
const decisionSchema = z.object({ kind: z.enum(["linked", "not_action", "clarify"]), note: z.string().trim().min(1).max(600), actionId: identifier.nullable() }).strict().refine(d => d.kind === "linked" ? d.actionId !== null : d.actionId === null);
const reviewFields = {
  format: z.literal("action-receipt-review"),
  source: z.string().max(MAX_NOTICE_LENGTH).refine(s => s.trim().length >= MIN_NOTICE_LENGTH),
  title: z.string().max(120), mode: z.enum(["sample", "local", "manual"]), receiptId: identifier,
  createdAt: z.string().regex(/^[1-9]\d{3}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/).refine(value => { try { return new Date(value).toISOString() === value; } catch { return false; } }),
  actions: z.array(savedAction).max(20), notes: z.array(z.string().min(1).max(600)).max(6),
};
const flagFields = { quote: z.string().min(1).max(MAX_NOTICE_LENGTH), reason: z.string().min(1).max(600) };
const reviewSchema = z.discriminatedUnion("version", [
  z.object({ ...reviewFields, version: z.literal(1), attention: z.array(z.object(flagFields).strict()).max(80) }).strict(),
  z.object({ ...reviewFields, version: z.literal(2), attention: z.array(z.object({ ...flagFields, id: identifier, decision: decisionSchema.nullable() }).strict()).max(80) }).strict(),
]).refine(file => new Set(file.actions.map(a => a.id)).size === file.actions.length)
  .refine(file => file.version === 1 || (new Set(file.attention.map(i => i.id)).size === file.attention.length && file.attention.every(i => !i.decision?.actionId || file.actions.some(a => a.id === i.decision!.actionId))));
export type SavedReview = { source: string; actions: ReviewedAction[]; meta: ReceiptMeta };
const invalid = () => new Error("This is not a supported Action Receipt review file. Your current review has not been changed.");
function checkSize(text: string) {
  if (new TextEncoder().encode(text).byteLength > MAX_REVIEW_BYTES) throw new Error("Review files must be 1 MB or smaller. Your current review has not been changed.");
}
export function saveReviewFile(review: SavedReview): string {
  const { source, actions, meta } = review;
  const data = reviewSchema.safeParse({
    format: "action-receipt-review", version: 2, source, title: meta.title, mode: meta.mode, receiptId: meta.receiptId, createdAt: meta.createdAt.toISOString(),
    actions: actions.map(a => ({
      id: a.id, title: a.title, originalTitle: a.originalTitle, condition: a.condition, originalCondition: a.originalCondition,
      evidence: a.evidence.map(e => e.quote), dateEvidence: a.dateEvidence.map(e => e.quote), deadlineText: a.deadlineText,
      date: a.date, originalDate: a.originalDate, time: a.time, originalTime: a.originalTime, utcOffset: a.utcOffset, originalUtcOffset: a.originalUtcOffset,
      requiresTime: a.requiresTime, omitted: a.omitted, origin: a.origin, issues: a.issues.filter(issue => issue !== importWarning),
    })), notes: meta.notes, attention: (meta.attention ?? []).map(item => ({ id: item.id, quote: item.evidence.quote, reason: item.reason, decision: item.decision ? { kind: item.decision.kind, note: item.decision.note, actionId: item.decision.actionId } : null })),
  });
  if (!data.success) throw new Error("The review could not be saved. Check the notice and action field lengths first.");
  const text = JSON.stringify(data.data, null, 2) + "\n"; checkSize(text); return text;
}
export function openReviewFile(text: string): SavedReview {
  checkSize(text);
  let json: unknown;
  try { json = JSON.parse(text.replace(/^\uFEFF/, "")); } catch { throw invalid(); }
  if (json && typeof json === "object" && "format" in json && json.format === "action-receipt-review" && "version" in json && json.version !== 1 && json.version !== 2) throw new Error("This review file uses an unsupported version. Your current review has not been changed.");
  const parsed = reviewSchema.safeParse(json); if (!parsed.success) throw invalid();
  const file = parsed.data;
  if (new Set(file.actions.map(a => a.id)).size !== file.actions.length) throw invalid();
  function matched(value: string) {
    const evidence = locateEvidence(file.source, value);
    if (!evidence.starts.length) throw new Error("A source quotation does not match the saved notice. Your current review has not been changed.");
    return evidence;
  }
  // Derive cutoff protection independently of editable file metadata. Match the
  // complete quote set so condition-only clocks keep the local engine's scope.
  let localActions: ReviewedAction[] = [];
  try { localActions = extractLocally(file.source).actions; } catch { /* Unrecognized passages use the conservative quote check below. */ }
  const quoteKey = (quotes: string[]) => JSON.stringify([...quotes].sort());
  const actions = file.actions.map((item): ReviewedAction => {
    const evidence = item.evidence.map(matched); const dateEvidence = item.dateEvidence.map(matched);
    const deadlineText = item.deadlineText && file.source.includes(item.deadlineText) ? item.deadlineText : dateEvidence.map(e => e.quote).join(" | ");
    const candidates = localActions.filter(a => quoteKey(a.evidence.map(e => e.quote)) === quoteKey(item.evidence));
    const evidenceRequiresTime = candidates.length === 1 ? candidates[0].sourceRequiresTime : mentionsTime(evidence.map(e => e.quote).join(" "));
    const sourceRequiresTime = evidenceRequiresTime || mentionsTime(deadlineText + " " + dateEvidence.map(e => e.quote).join(" "));
    return {
      ...item, evidence, dateEvidence, deadlineText, sourceRequiresTime,
      requiresTime: sourceRequiresTime || item.requiresTime || Boolean(item.time || item.utcOffset),
      approved: false, dateConfirmed: false, dateOrigin: item.date || item.time || item.utcOffset ? "review file" : "unresolved", evidenceValid: true, origin: "imported",
      issues: [...new Set([...item.issues, importWarning])],
    };
  });
  const attention: SourceReviewItem[] = file.attention.map((item, i) => ({ id: "id" in item ? item.id : `loaded-review-${i + 1}`, evidence: matched(item.quote), reason: item.reason,
    ...("decision" in item && item.decision ? { decision: { ...item.decision, origin: "imported", confirmed: false, actionSnapshot: null } as const } : {}),
  }));
  return { source: file.source, actions, meta: { mode: file.mode, title: file.title, receiptId: file.receiptId, createdAt: new Date(file.createdAt), notes: file.notes, attention, restored: true } };
}
