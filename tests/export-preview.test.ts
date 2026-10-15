import test from "node:test";
import assert from "node:assert/strict";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarText, checklistText, planExports, reviewedDateText, type ReceiptMeta } from "../lib/export.ts";
import { editAction, type ReviewedAction } from "../lib/receipt.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";

const source = "Register for the workshop by May 3, 2032. Submit your report by May 4, 2032 at 5 pm UTC-10:00. Email the coordinator by next Friday.";
const extracted = extractLocally(source);
const meta: ReceiptMeta = { mode: "local", title: "Workshop notice", receiptId: "preview-test", createdAt: new Date("2026-10-15T00:00:00.000Z"), notes: extracted.notes, attention: extracted.attention };
function ready(index = 0): ReviewedAction { return { ...extracted.actions[index], approved: true, dateConfirmed: true }; }
const unfold = (text: string) => text.replace(/\r\n /g, "");

test("the preview plan and both serializers include exactly the same mixed review items", () => {
  const a = ready(); const b = ready(1); const c = { ...ready(2), dateConfirmed: false };
  const excluded = [
    { ...a, id: "unapproved", title: "UNAPPROVED TITLE", approved: false },
    { ...a, id: "omitted", title: "OMITTED TITLE", omitted: true },
    { ...a, id: "unsupported", title: "UNSUPPORTED TITLE", evidenceValid: false },
    { ...a, id: "blank", title: " " },
  ];
  const actions = [a, b, c, ...excluded]; const before = JSON.stringify(actions);
  const plan = planExports(actions); const checklist = checklistText(actions, meta); const calendar = unfold(calendarText(actions, meta));
  assert.deepEqual(plan.checklist.map(a => a.id), [a.id, b.id, c.id]); assert.deepEqual(plan.calendar.map(a => a.id), [a.id, b.id]);
  assert.equal(plan.notInChecklist.length, 4); assert.equal(plan.notInCalendar.length, 5);
  assert.equal((checklist.match(/^- \[ \]/gm) ?? []).length, plan.checklist.length);
  assert.equal((calendar.match(/^BEGIN:VEVENT\r?$/gm) ?? []).length, plan.calendar.length);
  for (const title of ["UNAPPROVED TITLE", "OMITTED TITLE", "UNSUPPORTED TITLE"]) { assert.ok(!checklist.includes(title)); assert.ok(!calendar.includes(title)); }
  assert.match(plan.notInChecklist[0].reason, /not been approved/); assert.match(plan.notInChecklist[1].reason, /Omitted/); assert.match(plan.notInChecklist[2].reason, /quotation/); assert.match(plan.notInChecklist[3].reason, /wording is empty/);
  assert.equal(JSON.stringify(actions), before);
});
test("calendar exclusions explain each missing date, time, offset or confirmation without dropping checklist tasks", () => {
  const cases: [Partial<ReviewedAction>, RegExp][] = [
    [{ date: "" }, /complete, valid date/], [{ date: "2032-02-30" }, /complete, valid date/],
    [{ requiresTime: true, time: "" }, /valid cutoff time/],
    [{ requiresTime: true, time: "17:00", utcOffset: "" }, /valid UTC offset/],
    [{ requiresTime: true, time: "17:00", utcOffset: "+14:01" }, /valid UTC offset/],
    [{ dateConfirmed: false }, /confirm the date in Review details/],
    [{ requiresTime: true, time: "17:00", utcOffset: "-10:00", dateConfirmed: false }, /confirm the date, time and UTC offset/],
  ];
  for (const [patch, reason] of cases) {
    const action = { ...ready(), ...patch }; const plan = planExports([action]);
    assert.equal(plan.checklist.length, 1); assert.equal(plan.calendar.length, 0); assert.match(plan.notInCalendar[0].reason, reason);
  }
});
test("new edits immediately revoke preview eligibility and remove the task from both downloads", () => {
  const action = ready(); assert.equal(planExports([action]).calendar.length, 1);
  const edited = editAction(action, { date: "2032-05-02" }); const plan = planExports([edited]);
  assert.equal(plan.checklist.length, 0); assert.equal(plan.calendar.length, 0); assert.match(plan.notInCalendar[0].reason, /not been approved/);
  assert.ok(!checklistText([edited], meta).includes("- [ ]")); assert.ok(!calendarText([edited], meta).includes("BEGIN:VEVENT"));
});
test("reopened review files remain excluded in preview until the current reviewer approves again", () => {
  const loaded = openReviewFile(saveReviewFile({ source, actions: [ready(), ready(1)], meta })); const plan = planExports(loaded.actions);
  assert.equal(plan.checklist.length, 0); assert.equal(plan.calendar.length, 0); assert.equal(plan.notInChecklist.length, 2);
  assert.ok(plan.notInCalendar.every(item => /not been approved/.test(item.reason)));
});
test("invalid confirmed values never appear as a confirmed reviewed date in preview or checklist", () => {
  const action = { ...ready(), date: "2032-02-30", dateConfirmed: true };
  assert.match(reviewedDateText(action), /Unresolved/); assert.match(checklistText([action], meta), /Reviewed date: Unresolved/);
  assert.ok(!calendarText([action], meta).includes("BEGIN:VEVENT"));
});
test("timed preview labels retain the chosen offset while the calendar uses the same instant in UTC", () => {
  const action = ready(1); assert.equal(planExports([action]).calendar.length, 1);
  assert.equal(reviewedDateText(action), "2032-05-04 17:00 UTC-10:00");
  assert.match(unfold(calendarText([action], meta)), /DTSTART:20320505T030000Z/);
});
