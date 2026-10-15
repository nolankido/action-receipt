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
type DateMatch = { date: string; start: number; end: number };
function dateMatches(text: string): DateMatch[] {
  const dates: DateMatch[] = [];
  const record = (match: RegExpMatchArray, date: string) => { if (validDate(date)) dates.push({ date, start: match.index!, end: match.index! + match[0].length }); };
  for (const match of text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)) record(match, match[1]);
  for (const match of text.matchAll(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(\\d{4})\\b`, "gi"))) {
    record(match, `${match[3]}-${String(months.indexOf(match[1].slice(0, 3).toLowerCase()) + 1).padStart(2, "0")}-${match[2].padStart(2, "0")}`);
  }
  for (const match of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})[,]?\\s+(\\d{4})\\b`, "gi"))) {
    record(match, `${match[3]}-${String(months.indexOf(match[2].slice(0, 3).toLowerCase()) + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`);
  }
  return dates;
}
export function explicitDates(text: string): string[] { return [...new Set(dateMatches(text).map(item => item.date))]; }

/** Check only weekdays immediately attached to complete valid dates. Never choose which part is correct. */
export function weekdayConflicts(text: string): string[] {
  const issues = new Set<string>();
  for (const item of dateMatches(text)) {
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
