/** Bounded English calendar syntax. No locale, current-year or relative-date inference. */
export const monthPattern = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";
export const weekdayPattern = "(?:sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday|s)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)\\.?";
export const fullDatePattern = `(?:\\d{4}-\\d{2}-\\d{2}|${monthPattern}\\s+\\d{1,2}(?:st|nd|rd|th)?[,]?\\s+\\d{4}|\\d{1,2}(?:st|nd|rd|th)?\\s+${monthPattern}[,]?\\s+\\d{4})`;
export const datedWeekdayPattern = `(?:${weekdayPattern},?\\s+)?${fullDatePattern}`;
const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y < 1000 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
type DateMatch = { date: string; literal: string; valid: boolean; start: number; end: number };
function dateMatches(text: string): DateMatch[] {
  const dates: DateMatch[] = [];
  const record = (match: RegExpMatchArray, date: string) => dates.push({ date, literal: match[0], valid: validDate(date), start: match.index!, end: match.index! + match[0].length });
  for (const match of text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)) record(match, match[1]);
  for (const match of text.matchAll(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(\\d{4})\\b`, "gi"))) {
    record(match, `${match[3]}-${String(months.indexOf(match[1].slice(0, 3).toLowerCase()) + 1).padStart(2, "0")}-${match[2].padStart(2, "0")}`);
  }
  for (const match of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})[,]?\\s+(\\d{4})\\b`, "gi"))) {
    record(match, `${match[3]}-${String(months.indexOf(match[2].slice(0, 3).toLowerCase()) + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`);
  }
  return dates;
}
const dateExtension = (text: string, end: number) => text.slice(end).match(/^(?:[-/.]\d+)+/)?.[0];
export function explicitDates(text: string): string[] { return [...new Set(dateMatches(text).filter(item => item.valid && !dateExtension(text, item.end)).map(item => item.date))]; }

/** Keep questionable date wording visible even when another date is valid. */
export function dateProblems(text: string): string[] {
  const readings = dateMatches(text);
  const problems = readings.filter(item => !item.valid).map(item => `The written date “${item.literal}” is invalid or outside the supported calendar range. Clarify it before confirming a date.`);
  for (const item of readings) {
    const extension = dateExtension(text, item.end);
    if (extension) {
      const literal = item.literal + extension;
      problems.push(`Extended date wording “${literal.length > 64 ? literal.slice(0, 61) + "..." : literal}” has no supported interpretation here. Clarify the complete date instead of using its prefix.`);
    }
  }
  const partials = [
    new RegExp(`\\b${monthPattern}\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`, "gi"),
    new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${monthPattern}(?=$|[\\d\\s,.;!?])`, "gi"),
  ];
  for (const pattern of partials) for (const match of text.matchAll(pattern)) {
    if (readings.some(item => match.index! >= item.start && match.index! + match[0].length <= item.end)) continue;
    problems.push(`The partial written date “${match[0]}” does not establish a supported complete date with a year. Clarify it without borrowing another date's year.`);
  }
  const numeric = /\b(?:\d{1,2}([/.-])\d{1,2}\1\d{2,4}|\d{4}([/.-])\d{1,2}\2\d{1,2})\b/g;
  for (const match of text.matchAll(numeric)) {
    // A complete YYYY-MM-DD token is handled by the ordinary calendar check.
    if (readings.some(item => item.start === match.index && item.end === match.index! + match[0].length)) continue;
    problems.push(`Numeric date wording “${match[0]}” has no supported interpretation here. Clarify it without choosing a date locale.`);
  }
  return [...new Set(problems)];
}

/** Check only weekdays immediately attached to complete valid dates. Never choose which part is correct. */
export function weekdayConflicts(text: string): string[] {
  const issues = new Set<string>();
  for (const item of dateMatches(text)) {
    if (!item.valid) continue;
    const before = text.slice(0, item.start).match(new RegExp(`\\b(${weekdayPattern})\\s*,?\\s*$`, "i"));
    const after = text.slice(item.end).match(new RegExp(`^\\s*(?:\\(\\s*(${weekdayPattern})\\s*\\)|(?:,\\s*|\\s+)(${weekdayPattern})(?=$|[\\s,.;!?]))`, "i"));
    const actual = weekdays[new Date(item.date + "T12:00:00Z").getUTCDay()];
    for (const written of [before?.[1], after?.[1] ?? after?.[2]]) {
      if (written && written.slice(0, 3).toLowerCase() !== actual.slice(0, 3).toLowerCase()) {
        issues.add(`The written weekday ${written.replace(/\.$/, "")} does not match ${item.date} (${actual}). Clarify the deadline before confirming a date.`);
      }
    }
  }
  return [...issues];
}

/** Same UTF-16 length as input, used only to find sentence boundaries. Quotations always come from the original text. */
export function protectDateAbbreviations(text: string): string {
  const abbreviation = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|sun|mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat";
  return text.replace(new RegExp(`\\b(?:${abbreviation})\\.(?=\\s*,?\\s*(?:\\d|${monthPattern}\\s+\\d))`, "gi"), match => match.slice(0, -1) + "\u2060");
}
