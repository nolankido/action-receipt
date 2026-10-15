import { explicitDates, locateEvidence, mentionsTime, noticeInputState, validateExtraction, type Extraction, type RawAction, type ReviewedAction, type SourceReviewItem } from "./receipt.ts";
import { dateProblems, datedWeekdayPattern, protectDateAbbreviations, weekdayConflicts, weekdayPattern } from "./dates.ts";
import { explicitOffset, parseClock } from "./times.ts";

const verbs = "register|pay|bring|submit|upload|email|contact|complete|apply|return|sign|fill|send|book|reserve|confirm|check|download|print|prepare|attend|arrive|ask|use";
const instructionPrefix = "(?:(?:please|then|also)\\s+|(?:you\\s+)?(?:must|should|need to|are required to|have to|can|may)\\s+)?";
const instruction = new RegExp(`^${instructionPrefix}(${verbs})\\b`, "i");
// Preserve the complete exception marker. Starting at an inner "if" would
// reverse "except if"; dropping "only after" would remove a prerequisite.
const qualification = "except(?:\\s+(?:if|when|for))?|excluding|other than|even if|only (?:if|when|after|for|once)|unless|if|when|provided that|as long as|subject to|depending on";
const prefixCondition = new RegExp(`^(?:${qualification}|for those who)\\b`, "i");
const trailingQualification = new RegExp(`\\b(?:${qualification})\\b.+$`, "i");
const negated = /\b(?:do not|don't|does not|doesn't|must not|should not|no longer|not required|not necessary|need not|no need to|not need to|withdrawn|cancelled|canceled|waived)\b/i;
const relative = new RegExp(`\\b(?:next|this|coming)\\s+(?:${weekdayPattern}|week|month)\\b|\\b(?:today|tomorrow|tonight|yesterday)|\\bwithin\\b|\\bin\\s+(?:\\d+|one|two|three|four|five|six|seven|ten)\\s+(?:days?|weeks?)\\b`, "i");
const deadlineMarker = /\b(?:by|before|within|no later than|due|deadline|cutoff|until)\b/i;
const multipleInstructions = new RegExp(`(?:\\b(?:and|or|then|otherwise|alternatively|also)\\b|[;&])\\s*,?\\s*${instructionPrefix}(?:${verbs})\\b`, "i");
const temporalDate = new RegExp(`\\b(?:by|before|no later than|on or before|due(?:\\s+on)?|until)\\s+(?:the\\s+)?${datedWeekdayPattern}\\b`, "i");
const scheduledDate = new RegExp(`\\bon\\s+${datedWeekdayPattern}\\b`, "i");

function passages(source: string): string[] {
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  return source.split(/\r?\n/).flatMap(line => [...segmenter.segment(protectDateAbbreviations(line))].map(s => line.slice(s.index, s.index + s.segment.length).trim())).filter(Boolean);
}
/** Deliberately bounded English pattern matching. No network, model, clock-date inference or saved-result lookup. */
export function extractLocally(source: string, revision = 1): { actions: ReviewedAction[]; notes: string[]; attention: SourceReviewItem[] } {
  const input = noticeInputState(source);
  if (!input.ready) throw new Error(input.message);
  const actions: RawAction[] = [];
  const attention: SourceReviewItem[] = []; let attentionOverflow = 0;
  function flag(index: number, quote: string, reason: string) {
    if (attention.length >= 80) { attentionOverflow++; return; }
    attention.push({ id: `review-r${revision}-p${index + 1}-f${attention.length + 1}`, evidence: locateEvidence(source, quote), reason });
  }
  const unmatchedDates: string[] = [];
  let skippedLong = false; let skippedNegation = negated.test(source); let capped = false;
  const segments = passages(source);
  for (const [index, quote] of segments.entries()) {
    const clean = quote.replace(/^(?:[-*•]|\d+[.)])\s+/, "");
    let body = clean; let condition: string | null = null;
    if (prefixCondition.test(clean)) {
      for (const comma of clean.matchAll(/,\s*/g)) {
        const remainder = clean.slice(comma.index + comma[0].length);
        if (instruction.test(remainder) || /^optional\s*:/i.test(remainder)) { condition = clean.slice(0, comma.index); body = remainder; break; }
      }
    }
    const optional = body.match(/^(optional\s*:\s*)(.+)$/i);
    if (optional) { condition = [condition, optional[1].trim()].filter(Boolean).join("; "); body = optional[2]; }
    const trailingMatch = body.match(trailingQualification);
    const trailingCondition = trailingMatch?.[0].replace(/[.!?]+$/, "");
    if (trailingCondition) condition = [condition, trailingCondition].filter(Boolean).join("; ");
    const actionContent = body.slice(0, trailingMatch?.index ?? body.length).split(";")[0].trim();
    const match = instruction.exec(body);
    if (!match || (/^contact\b/i.test(body) && /questions\?\s*$/i.test(segments[index - 1] ?? ""))) {
      if (negated.test(quote)) flag(index, quote, "Negation or cancellation: no action was created. Check its scope and any changes to other instructions.");
      else if (dateProblems(quote).length) flag(index, quote, "Date needs clarification: " + dateProblems(quote).slice(0, 2).join(" "));
      else if (explicitDates(quote).length || relative.test(quote) || deadlineMarker.test(quote) || mentionsTime(quote)) {
        unmatchedDates.push(quote); flag(index, quote, "Date or cutoff not linked to an action. Decide what it applies to; no cross-sentence date was assigned.");
      } else if (prefixCondition.test(quote) || /\b(?:must|shall|need(?:s)? to|required|mandatory|obligatory|responsible for|please|optional|recommended)\b/i.test(quote)) flag(index, quote, "Possible instruction or qualification outside the supported patterns. Inspect it and add an action manually if needed.");
      continue;
    }
    if (negated.test(quote)) { skippedNegation = true; flag(index, quote, "Negation or cancellation: no action was created. Check whether any positive instruction still applies."); continue; }
    const following = segments[index + 1] ?? "";
    if (/^(?:(?:this|that)\s+|the\s+(?:above|previous|earlier)\s+)/i.test(following) && /\b(?:cancelled|canceled|withdrawn|rescinded|waived|no longer required)\b/i.test(following)) { skippedNegation = true; flag(index, quote, "The following passage appears to withdraw this instruction. No action was created; inspect both passages."); continue; }
    if (quote.length > 1200 || (condition?.length ?? 0) > 600) { skippedLong = true; flag(index, quote, "Long passage or condition exceeds the review limit. Add its instructions manually using shorter exact quotations."); continue; }
    if (actions.length >= 20) { capped = true; flag(index, quote, "The 20-action limit was reached before this instruction. It is not included in the proposed actions."); continue; }
    const issues = ["Found by local English text rules. Check meaning, conditions and the complete notice."];
    if (/^(?:you\s+)?(?:can|may|should)\b/i.test(body)) condition = [condition, body.match(/^(?:you\s+)?(?:can|may|should)\b/i)![0] + ": check whether this is optional or recommended"].filter(Boolean).join("; ");
    if ((condition?.length ?? 0) > 600) { skippedLong = true; flag(index, quote, "Long condition exceeds the review limit. Add this instruction manually with its qualifications."); continue; }
    const many = multipleInstructions.test(body);
    const dates = explicitDates(actionContent);
    const dateIssues = dateProblems(actionContent);
    issues.push(...dateIssues.slice(0, 3));
    const hasDateContext = dates.length > 0 || dateIssues.length > 0 || relative.test(actionContent) || deadlineMarker.test(actionContent) || mentionsTime(actionContent);
    const linkedDate = temporalDate.exec(actionContent) ?? (!deadlineMarker.test(actionContent) && /^(?:bring|attend|arrive|return)$/i.test(match[1]) ? scheduledDate.exec(actionContent) : null);
    const linkedDates = linkedDate ? explicitDates(linkedDate[0]) : [];
    const clearRole = linkedDates.length === 1 && dates.length === 1 && linkedDates[0] === dates[0];
    const weekdayIssues = weekdayConflicts(actionContent);
    const status: RawAction["deadline"]["status"] = weekdayIssues.length ? "conflict" : !hasDateContext ? "missing" : dates.length === 1 && clearRole && !dateIssues.length && !relative.test(actionContent) && !many ? "explicit" : "ambiguous";
    if (weekdayIssues.length) flag(index, quote, "Weekday/date conflict: " + weekdayIssues[0]);
    if (dateIssues.length) flag(index, quote, "Date needs clarification: " + dateIssues.slice(0, 2).join(" "));
    if (condition && dateProblems(condition).length) flag(index, quote, "Date in a condition needs clarification: " + dateProblems(condition).slice(0, 2).join(" "));
    if (condition && (explicitDates(condition).length || relative.test(condition) || mentionsTime(condition))) issues.push("A date or time appears in the condition. It was kept as a qualification, not used as this action's deadline.");
    if (many) {
      issues.push("This passage may contain several actions or alternatives. Split or correct it manually before approval; no date is assigned automatically.");
      flag(index, quote, "Several actions or alternatives share this passage. Check which instructions apply and preserve their conditions when splitting them; no deadline was assigned automatically.");
    } else if (body.includes(";")) flag(index, quote, "This passage has several clauses. Details after the semicolon were not linked as a deadline; inspect any additional instructions manually.");
    if (dates.length && !clearRole) issues.push("A date appears in the passage, but its role as this action's deadline is not established. Check it manually.");
    const timeTail = linkedDate ? actionContent.slice(linkedDate.index + linkedDate[0].length) : "";
    const linkedClock = !many && /^\s*,?\s*(?:at\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b|\d{1,2}:\d{2}\b|noon\b|midnight\b)/i.test(timeTail);
    const time = linkedClock ? parseClock(timeTail) : null; const utcOffset = linkedClock ? explicitOffset(timeTail) : null;
    if (mentionsTime(actionContent) && !linkedClock) issues.push("A time appears outside a recognized deadline clause. No cutoff was assigned; clarify its role and any required time manually.");
    if (mentionsTime(actionContent) && (!time || !utcOffset)) issues.push("A timed instruction needs a valid cutoff and UTC offset. Invalid, conflicting or unsupported clock wording must be clarified manually.");
    let title = body.slice(match[0].length - match[1].length).replace(/[.!?]+$/, "").trim();
    const actionTitle = actionContent.slice(match[0].length - match[1].length);
    const cutoff = actionTitle.search(temporalDate);
    if (!many && cutoff > 0) title = actionTitle.slice(0, cutoff).trim();
    if (title.length > 240) { title = title.slice(0, 239) + "…"; issues.push("The action wording was shortened. Read its full source passage."); }
    actions.push({ title, condition, evidence: [quote], deadline: { text: "", evidence: hasDateContext ? [actionContent] : [], date: status === "explicit" ? dates[0] : null, time, utcOffset, status }, issues });
  }
  const notes: string[] = ["Local English text rules generated these proposals. They can miss instructions or misunderstand scope. Read every part of the notice and add missed actions manually.", "Dates are linked only within the same passage. No dates are inferred from today's date or borrowed from a different sentence."];
  if (attention.length) notes.push(`Source passages flagged for review: ${attention.length}${attentionOverflow ? ` shown; ${attentionOverflow} more omitted from the review list, so read the full source` : ""}. This list is not exhaustive.${unmatchedDates.length ? ` Unlinked dates include: ${unmatchedDates.slice(0, 2).map(p => `“${p.slice(0, 140)}${p.length > 140 ? "…" : ""}”`).join("; ")}` : ""}`);
  if (skippedNegation) notes.push("The notice contains negation or cancellation. Local rules skip negated passages and instructions immediately followed by an explicit withdrawal referring back. Check other cross-sentence changes and qualifications manually.");
  if (skippedLong) notes.push("A long passage was skipped because it exceeded the evidence limit. Add its separate instructions manually with shorter exact quotations.");
  if (capped) notes.push("The 20-action limit was reached. Review the remaining source text for additional instructions.");
  const reviewed = validateExtraction(source, { actions, notes } satisfies Extraction, revision);
  return { actions: reviewed.actions.map(a => ({ ...a, origin: "rules" })), notes: reviewed.notes, attention };
}
