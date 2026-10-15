import { validDate } from "./dates.ts";

// Consume the whole zone token, including unsupported seconds/fractions. A
// valid-looking prefix of a malformed token must never become an offset.
const offsetPattern = /\b(?:UTC|GMT)\b(?:[ \t]*[+\-−][^\s,;!?()[\]{}"'“”‘’]*)?/gi;
const withoutOffsets = (text: string) => text.replace(offsetPattern, "");
// Recognize malformed clock-like text as a cutoff to review, not a date-only
// instruction. Validity and interpretation are separate checks.
const colonClock = /\b(\d+):(\d+)(?::(\d+)(?:\.\d+)?)?\s*(a\.?m\.?|p\.?m\.?)?\b/gi;
const hourClock = /\b(\d+)\s*(a\.?m\.?|p\.?m\.?)\b/gi;

export function validTime(value: string): boolean { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
export function validOffset(value: string): boolean {
  if (!/^[+-]\d{2}:\d{2}$/.test(value) || value === "-00:00") return false;
  const [h, m] = value.slice(1).split(":").map(Number);
  return h <= 14 && m <= 59 && (h !== 14 || m === 0);
}
export function mentionsTime(text: string): boolean {
  return /\b\d+(?::\d+)?\s*(?:a\.?m\.?|p\.?m\.?)\b|\b\d+:\d+\b|\b(?:noon|midnight|end of day|close of business)\b/i.test(withoutOffsets(text));
}
/** One bounded clock interpretation. No zone inference, seconds truncation or mixed-format choice. */
export function parseClock(text: string): string | null {
  const input = withoutOffsets(text);
  if (/\b(?:midnight|end of day|close of business)\b/i.test(input)) return null;
  if (/\b\d+:\d+[:.]\d+/.test(input)) return null; // Do not truncate seconds or fractional minutes.
  const values = new Set<string>(); const families = new Set<"12" | "24">();
  function twelve(hour: string, minute: string, suffix: string): boolean {
    const h = Number(hour);
    if (hour.length > 2 || h < 1 || h > 12 || !/^\d{2}$/.test(minute) || Number(minute) > 59) return false;
    values.add(`${String(h % 12 + (/^p/i.test(suffix) ? 12 : 0)).padStart(2, "0")}:${minute}`); families.add("12"); return true;
  }
  for (const token of input.matchAll(colonClock)) {
    if (token[3] !== undefined) return null; // Seconds require manual clarification.
    if (token[4]) { if (!twelve(token[1], token[2], token[4])) return null; }
    else {
      const value = `${token[1]}:${token[2]}`;
      if (!validTime(value)) return null; // HH:MM only; a bare 5:00 is still ambiguous.
      values.add(value); families.add("24");
    }
  }
  const remaining = input.replace(colonClock, "");
  for (const token of remaining.matchAll(hourClock)) if (!twelve(token[1], "00", token[2])) return null;
  if (/\bnoon\b/i.test(remaining)) { values.add("12:00"); families.add("12"); }
  return values.size === 1 && families.size === 1 ? [...values][0] : null;
}
export function explicitOffset(text: string): string | null {
  const mentions = [...text.matchAll(offsetPattern)];
  const values = mentions.map(m => m[0].replace(/^(?:UTC|GMT)[ \t]*/i, "").replace(/\.+$/, ""));
  const continued = mentions.some(m => /^,\d/.test(text.slice(m.index + m[0].length)));
  return !continued && values.length && values.every(validOffset) && new Set(values).size === 1 ? values[0] : null;
}
/** iCalendar DATE-TIME requires a four-digit UTC year after offset conversion. */
export function cutoffFitsCalendar(date: string, time: string, offset: string): boolean {
  if (!validDate(date) || !validTime(time) || !validOffset(offset)) return false;
  const instant = new Date(`${date}T${time}:00${offset}`); const year = instant.getUTCFullYear();
  return Number.isFinite(instant.getTime()) && year >= 1 && year <= 9999;
}
