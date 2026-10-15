import { MAX_NOTICE_LENGTH, MIN_NOTICE_LENGTH, explicitDates, mentionsTime, validateExtraction, validOffset, validTime, type Extraction, type RawAction, type ReviewedAction } from "./receipt.ts";

const verbs = "register|pay|bring|submit|upload|email|contact|complete|apply|return|sign|fill|send|book|reserve|confirm|check|download|print|prepare|attend|arrive|ask|use";
const instruction = new RegExp(`^(?:(?:please|then|also)\\s+|(?:you\\s+)?(?:must|should|need to|are required to|have to|can|may)\\s+)?(${verbs})\\b`, "i");
const negated = /\b(?:do not|don't|does not|doesn't|must not|should not|no longer|not required|not necessary|need not|no need to|not need to|withdrawn|cancelled|canceled|waived)\b/i;
const relative = /\b(?:next|this|coming)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month)|\b(?:today|tomorrow|tonight|yesterday)|\bwithin\b|\bin\s+(?:\d+|one|two|three|four|five|six|seven|ten)\s+(?:days?|weeks?)\b/i;
const deadlineMarker = /\b(?:by|before|within|no later than|due|deadline|cutoff|until)\b/i;
const multipleInstructions = new RegExp(`(?:\\band\\b|\\bthen\\b|;)\\s+(?:please\\s+)?(?:${verbs})\\b`, "i");
const months = "january|february|march|april|may|june|july|august|september|october|november|december";
const fullDate = `(?:\\d{4}-\\d{2}-\\d{2}|(?:${months})\\s+\\d{1,2}(?:st|nd|rd|th)?[,]?\\s+\\d{4}|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${months})[,]?\\s+\\d{4})`;
const temporalDate = new RegExp(`\\b(?:by|before|no later than|on or before|due(?:\\s+on)?|until)\\s+(?:the\\s+)?${fullDate}\\b`, "i");
const scheduledDate = new RegExp(`\\bon\\s+${fullDate}\\b`, "i");

function passages(source: string): string[] {
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  return source.split(/\r?\n/).flatMap(line => [...segmenter.segment(line)].map(s => s.segment.trim())).filter(Boolean);
}
function clock(text: string): string | null {
  const twelve = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
  if (twelve) {
    const hour = Number(twelve[1]); if (hour < 1 || hour > 12) return null;
    const value = `${String(hour % 12 + (/^p/i.test(twelve[3]) ? 12 : 0)).padStart(2, "0")}:${twelve[2] ?? "00"}`;
    return validTime(value) ? value : null;
  }
  if (/\bnoon\b/i.test(text)) return "12:00";
  // Midnight can mean the beginning or end of a day, so it requires manual clarification.
  return null;
}
function offset(text: string): string | null {
  const value = text.match(/\b(?:UTC|GMT)\s*([+-]\d{2}:\d{2})\b/i)?.[1] ?? "";
  return validOffset(value) ? value : null;
}

/** Deliberately bounded English pattern matching. No network, model, clock-date inference or saved-result lookup. */
export function extractLocally(source: string, revision = 1): { actions: ReviewedAction[]; notes: string[] } {
  if (source.trim().length < MIN_NOTICE_LENGTH || source.length > MAX_NOTICE_LENGTH) throw new Error(`Paste ${MIN_NOTICE_LENGTH} to ${MAX_NOTICE_LENGTH.toLocaleString()} characters.`);
  const actions: RawAction[] = [];
  const unmatchedDates: string[] = [];
  let skippedLong = false; let skippedNegation = negated.test(source); let capped = false;
  const segments = passages(source);
  for (const [index, quote] of segments.entries()) {
    const clean = quote.replace(/^(?:[-*•]|\d+[.)])\s+/, "");
    let body = clean; let condition: string | null = null;
    const conditional = clean.match(/^((?:only if|if|unless|when|for those who)\b[^,]+),\s*(.+)$/i);
    if (conditional) { condition = conditional[1]; body = conditional[2]; }
    const optional = body.match(/^(optional\s*:\s*)(.+)$/i);
    if (optional) { condition = [condition, optional[1].trim()].filter(Boolean).join("; "); body = optional[2]; }
    const trailingCondition = body.match(/\b(?:only if|unless|if|provided that|as long as)\b.+$/i)?.[0].replace(/[.!?]+$/, "");
    if (trailingCondition) condition = [condition, trailingCondition].filter(Boolean).join("; ");
    const match = instruction.exec(body);
    if (!match || (/^contact\b/i.test(body) && /questions\?\s*$/i.test(segments[index - 1] ?? ""))) {
      if (explicitDates(quote).length || /\bdeadline\b/i.test(quote)) unmatchedDates.push(quote);
      continue;
    }
    if (negated.test(quote)) { skippedNegation = true; continue; }
    const following = segments[index + 1] ?? "";
    if (/^(?:(?:this|that)\s+|the\s+(?:above|previous|earlier)\s+)/i.test(following) && /\b(?:cancelled|canceled|withdrawn|rescinded|waived|no longer required)\b/i.test(following)) { skippedNegation = true; continue; }
    if (quote.length > 1200 || (condition?.length ?? 0) > 600) { skippedLong = true; continue; }
    if (actions.length >= 20) { capped = true; continue; }
    const issues = ["Found by local English text rules. Check meaning, conditions and the complete notice."];
    if (/^(?:you\s+)?(?:can|may|should)\b/i.test(body)) condition = [condition, body.match(/^(?:you\s+)?(?:can|may|should)\b/i)![0] + ": check whether this is optional or recommended"].filter(Boolean).join("; ");
    if ((condition?.length ?? 0) > 600) { skippedLong = true; continue; }
    const many = multipleInstructions.test(body);
    const dates = explicitDates(quote);
    const hasDateContext = dates.length > 0 || relative.test(quote) || deadlineMarker.test(quote) || mentionsTime(quote);
    const clearRole = temporalDate.test(quote) || (/^(?:bring|attend|arrive|return)$/i.test(match[1]) && scheduledDate.test(body));
    const status: RawAction["deadline"]["status"] = !hasDateContext ? "missing" : dates.length === 1 && clearRole && !relative.test(quote) && !many ? "explicit" : "ambiguous";
    if (many) issues.push("This passage may contain several actions. Split or correct it manually before approval; no date is assigned automatically.");
    if (dates.length && !clearRole) issues.push("A date appears in the passage, but its role as this action's deadline is not established. Check it manually.");
    const time = clock(quote); const utcOffset = offset(quote);
    if (mentionsTime(quote) && (!time || !utcOffset)) issues.push("A timed instruction needs a confirmed cutoff and UTC offset. Ambiguous clock wording must be resolved manually.");
    let title = body.slice(match[0].length - match[1].length).replace(/[.!?]+$/, "").trim();
    const cutoff = title.search(temporalDate);
    if (cutoff > 0) title = title.slice(0, cutoff).trim();
    if (title.length > 240) { title = title.slice(0, 239) + "…"; issues.push("The action wording was shortened. Read its full source passage."); }
    actions.push({ title, condition, evidence: [quote], deadline: { text: "", evidence: hasDateContext ? [quote] : [], date: status === "explicit" ? dates[0] : null, time, utcOffset, status }, issues });
  }
  const notes: string[] = ["Local English text rules generated these proposals. They can miss instructions or misunderstand scope. Read every part of the notice and add missed actions manually.", "Dates are linked only within the same passage. No dates are inferred from today's date or borrowed from a different sentence."];
  if (unmatchedDates.length) notes.push(`Date/deadline passages without a matched instruction need manual review: ${unmatchedDates.slice(0, 2).map(p => `“${p.slice(0, 180)}${p.length > 180 ? "…" : ""}”`).join("; ")}`);
  if (skippedNegation) notes.push("The notice contains negation or cancellation. Local rules skip negated passages and instructions immediately followed by an explicit withdrawal referring back. Check other cross-sentence changes and qualifications manually.");
  if (skippedLong) notes.push("A long passage was skipped because it exceeded the evidence limit. Add its separate instructions manually with shorter exact quotations.");
  if (capped) notes.push("The 20-action limit was reached. Review the remaining source text for additional instructions.");
  const reviewed = validateExtraction(source, { actions, notes } satisfies Extraction, revision);
  return { actions: reviewed.actions.map(a => ({ ...a, origin: "rules" })), notes: reviewed.notes };
}
