import { calendarEligible, type ReviewedAction } from "./receipt.ts";

export type ReceiptMeta = { mode: "sample" | "live"; title: string; createdAt: Date; receiptId: string; notes: string[] };
const textLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const markdown = (value: string) => textLine(value).replace(/([\\`*_{}\[\]<>#|])/g, "\\$1");
export function checklistText(actions: ReviewedAction[], meta: ReceiptMeta): string {
  const out = [`# Action Receipt`, "", `Notice: ${markdown(meta.title)}`, `Created: ${meta.createdAt.toISOString()}`, `Mode: ${meta.mode === "sample" ? "Synthetic sample walkthrough; saved example results, not live AI extraction" : "Live AI proposals reviewed by the user"}`, "", "Source quotations show where text appeared. They do not certify correct interpretation or completeness.", ""];
  const approved = actions.filter(a => a.approved && !a.omitted && a.evidenceValid && a.title.trim());
  for (const a of approved) {
    out.push(`- [ ] ${markdown(a.title)}`);
    if (a.condition) out.push(`  - Condition: ${markdown(a.condition)}`);
    out.push(`  - Original deadline wording: ${markdown(a.deadlineText || "Not stated")}`);
    out.push(`  - Reviewed date: ${a.dateConfirmed ? a.date + (a.requiresTime ? ` ${a.time} UTC${a.utcOffset}` : " (day marker)") : "Unresolved / not confirmed; no calendar entry"}`);
    out.push(`  - Date provenance: ${a.dateOrigin}${a.dateConfirmed ? "; confirmed by user" : ""}`);
    if (a.title !== a.originalTitle) out.push(`  - Original proposed action: ${markdown(a.originalTitle)}; wording edited by user`);
    if (a.condition !== a.originalCondition) out.push(`  - Original condition: ${markdown(a.originalCondition || "None proposed")}; condition edited by user`);
    if (a.time !== a.originalTime || a.utcOffset !== a.originalUtcOffset) out.push(`  - Original proposed time/offset: ${a.originalTime || "Not proposed"} / ${a.originalUtcOffset || "Not proposed"}; time or offset edited by user`);
    for (const e of a.evidence) out.push(`  - Action source: “${markdown(e.quote)}”`);
    for (const e of a.dateEvidence) out.push(`  - Date source: “${markdown(e.quote)}”${e.starts.length ? "" : " (not matched)"}`);
    for (const issue of a.issues) out.push(`  - Original review flag: ${markdown(issue)}`);
    out.push("");
  }
  if (meta.notes.length) out.push("## Notice notes", ...meta.notes.map(n => `- ${markdown(n)}`), "");
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
      meta.mode === "sample" ? "SYNTHETIC SAMPLE WALKTHROUGH. Saved example results, not live AI extraction." : "AI proposal reviewed and approved by user.",
      `Notice: ${textLine(meta.title)}`, `Original deadline: ${a.deadlineText || "Not stated"}`,
      `Date provenance: ${a.dateOrigin}; confirmed by user.`,
      a.requiresTime ? "This entry marks the deadline instant; no event duration or reminder is inferred." : "This is an all-day deadline marker; no exact cutoff time or reminder is inferred.",
      ...(a.condition ? [`Condition: ${a.condition}`] : []),
      ...(a.title !== a.originalTitle ? [`Original proposed action: ${a.originalTitle}; wording edited by user.`] : []),
      ...(a.condition !== a.originalCondition ? [`Original condition: ${a.originalCondition || "None proposed"}; condition edited by user.`] : []),
      ...(a.time !== a.originalTime || a.utcOffset !== a.originalUtcOffset ? [`Original proposed time/offset: ${a.originalTime || "Not proposed"} / ${a.originalUtcOffset || "Not proposed"}; time or offset edited by user.`] : []),
      ...a.evidence.map(e => `Action source: ${e.quote}`), ...a.dateEvidence.map(e => `Date source: ${e.quote}`),
      ...a.issues.map(i => `Original review flag: ${i}`),
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
