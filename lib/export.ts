import { calendarEligible, type ReviewedAction, type SourceReviewItem } from "./receipt.ts";

export type ReceiptMeta = { mode: "sample" | "local" | "manual"; title: string; createdAt: Date; receiptId: string; notes: string[]; attention?: SourceReviewItem[]; restored?: boolean };
const modeDescription = (mode: ReceiptMeta["mode"], restored = false) => (restored ? "Imported review file; declared prior mode (unverified): " : "") + (mode === "sample" ? "Synthetic sample walkthrough; saved example results, not live AI extraction" : mode === "manual" ? "Manual review; actions added by the user, no AI extraction" : "Local text rules; browser-only proposals, no AI model or API");
const actionOrigin = (action: ReviewedAction) => action.origin === "imported" ? "Imported review file; verify its interpretation" : action.origin === "user" ? "Added by user from source" : action.origin === "rules" ? "Local text rules" : "Saved sample proposal";
const textLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const markdown = (value: string) => textLine(value).replace(/([\\`*_{}\[\]<>#|])/g, "\\$1");
function corrections(a: ReviewedAction): string[] {
  const imported = a.origin === "imported";
  return [
    ...(a.title !== a.originalTitle ? [`${imported ? "Prior action metadata (unverified)" : "Original proposed action"}: ${a.originalTitle}; ${imported ? "wording differs from file metadata" : "wording edited by user"}`] : []),
    ...(a.condition !== a.originalCondition ? [`${imported ? "Prior condition metadata (unverified)" : "Original condition"}: ${a.originalCondition || "None proposed"}; ${imported ? "condition differs from file metadata" : "condition edited by user"}`] : []),
    ...(a.time !== a.originalTime || a.utcOffset !== a.originalUtcOffset ? [`${imported ? "Prior time/offset metadata (unverified)" : "Original proposed time/offset"}: ${a.originalTime || "Not proposed"} / ${a.originalUtcOffset || "Not proposed"}; ${imported ? "time or offset differs from file metadata" : "time or offset edited by user"}`] : []),
  ];
}
export function checklistText(actions: ReviewedAction[], meta: ReceiptMeta): string {
  const out = [`# Action Receipt`, "", `Notice: ${markdown(meta.title)}`, `Created: ${meta.createdAt.toISOString()}`, `Mode: ${modeDescription(meta.mode, meta.restored)}`, "", "Source quotations show where text appeared. They do not certify correct interpretation or completeness.", ""];
  const approved = actions.filter(a => a.approved && !a.omitted && a.evidenceValid && a.title.trim());
  for (const a of approved) {
    out.push(`- [ ] ${markdown(a.title)}`);
    out.push(`  - Action origin: ${actionOrigin(a)}`);
    if (a.condition) out.push(`  - Condition: ${markdown(a.condition)}`);
    out.push(`  - Original deadline wording: ${markdown(a.deadlineText || "Not stated")}`);
    out.push(`  - Reviewed date: ${a.dateConfirmed ? a.date + (a.requiresTime ? ` ${a.time} UTC${a.utcOffset}` : " (day marker)") : "Unresolved / not confirmed; no calendar entry"}`);
    out.push(`  - Date provenance: ${a.dateOrigin}${a.dateConfirmed ? "; confirmed by user" : ""}`);
    for (const correction of corrections(a)) out.push(`  - ${markdown(correction)}`);
    for (const e of a.evidence) out.push(`  - Action source: “${markdown(e.quote)}”`);
    for (const e of a.dateEvidence) out.push(`  - Date source: “${markdown(e.quote)}”${e.starts.length ? "" : " (not matched)"}`);
    for (const issue of a.issues) out.push(`  - Original review flag: ${markdown(issue)}`);
    out.push("");
  }
  if (meta.notes.length) out.push("## Notice notes", ...meta.notes.map(n => `- ${markdown(n)}`), "");
  if (meta.attention?.length) {
    out.push("## Source passages flagged for review", "", "These are context flags, not approved tasks. They may already have been addressed during your review. This list is not exhaustive.", "");
    for (const item of meta.attention) out.push(`- ${markdown(item.reason)}`, `  - Source: “${markdown(item.evidence.quote)}”`);
    out.push("");
  }
  return out.join("\n");
}
export function escapeICS(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  let part = "", length = 0;
  const out: string[] = [];
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (length + bytes > 75) { out.push(part); part = " "; length = 1; }
    part += char; length += bytes;
  }
  out.push(part);
  return out.join("\r\n");
}
function utcStamp(date: Date): string { return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }
export function calendarText(actions: ReviewedAction[], meta: ReceiptMeta): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Action Receipt//Reviewed notices//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const a of actions.filter(calendarEligible)) {
    const description = [
      meta.mode === "sample" && !meta.restored ? "SYNTHETIC SAMPLE WALKTHROUGH. Saved example results, not live AI extraction." : modeDescription(meta.mode, meta.restored),
      `Action origin: ${actionOrigin(a)}.`,
      `Notice: ${textLine(meta.title)}`, `Original deadline: ${a.deadlineText || "Not stated"}`,
      `Date provenance: ${a.dateOrigin}; confirmed by user.`,
      a.requiresTime ? "This entry marks the deadline instant; no event duration or reminder is inferred." : "This is an all-day deadline marker; no exact cutoff time or reminder is inferred.",
      ...(a.condition ? [`Condition: ${a.condition}`] : []),
      ...corrections(a),
      ...a.evidence.map(e => `Action source: ${e.quote}`), ...a.dateEvidence.map(e => `Date source: ${e.quote}`),
      ...a.issues.map(i => `Original review flag: ${i}`),
      ...meta.notes.map(n => `Notice note: ${n}`),
      ...(meta.attention?.length ? ["Other source passages flagged for review (context, not approved tasks; may already have been addressed):", ...meta.attention.map(item => `${item.reason}\nSource: ${item.evidence.quote}`)] : []),
      "Quotation matching does not certify interpretation or completeness.",
    ].join("\n");
    lines.push("BEGIN:VEVENT", `UID:${meta.receiptId}-${a.id}@actionreceipt.local`, `DTSTAMP:${utcStamp(meta.createdAt)}`);
    if (a.requiresTime) {
      lines.push(`DTSTART:${utcStamp(new Date(`${a.date}T${a.time}:00${a.utcOffset}`))}`);
    } else {
      const next = new Date(a.date + "T00:00:00Z"); next.setUTCDate(next.getUTCDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${a.date.replace(/-/g, "")}`);
      if (next.getUTCFullYear() <= 9999) lines.push(`DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`);
    }
    lines.push(`SUMMARY:${escapeICS(a.title)}`, `DESCRIPTION:${escapeICS(description)}`, "TRANSP:TRANSPARENT", "STATUS:CONFIRMED", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
