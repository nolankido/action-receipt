import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { extractLocally } from "../lib/local-extraction.ts";
import { calendarEligible, canConfirmDate } from "../lib/receipt.ts";

const cases = [
  { id: "separate-and-relative", source: "Register for the astronomy lab by February 5, 2032. Pay the equipment deposit by February 7, 2032. If you need accessible transport, email the coordinator by next Friday.", expectedDates: ["2032-02-05", "2032-02-07", ""] },
  { id: "conflict-and-waiver", source: "Apply using the library form by March 8, 2032 or March 11, 2032. Pay the deposit by March 6, 2032 unless you have a waiver. You do not need to pay a membership fee.", expectedDates: ["", "2032-03-06"] },
  { id: "timed-cutoff", source: "Upload the lab budget by April 2, 2032 at 5:00 pm. Bring your photo ID on April 4, 2032. The training session is optional.", expectedDates: ["2032-04-02", "2032-04-04"] },
  { id: "abbreviated-dates", source: "Register for the film lab by Thu., Sept. 2, 2032. Pay the equipment deposit by 4 Sep. 2032. If you need accessible transport, email the coordinator by next Monday.", expectedDates: ["2032-09-02", "2032-09-04", ""] },
  { id: "weekday-conflict", source: "Submit the film list by Friday, Sep. 6, 2032. Bring your student ID on Sep. 7, 2032.", expectedDates: ["", "2032-09-07"] },
  { id: "24-hour-cutoff", source: "Upload the astronomy budget by April 2, 2032 at 17:00 UTC-10:00. Bring your photo ID on April 4, 2032.", expectedDates: ["2032-04-02", "2032-04-04"] },
  { id: "invalid-cutoff", source: "Submit the astronomy budget by April 2, 2032 at 24:00 UTC-10:00.", expectedDates: ["2032-04-02"] },
  { id: "invalid-offset", source: "Pay the astronomy deposit by April 2, 2032 at 17:00 UTC-10:00:30 and GMT+09.", expectedDates: ["2032-04-02"] },
];
const observations = cases.map(c => {
  const result = extractLocally(c.source);
  assert.deepEqual(result.actions.map(a => a.date), c.expectedDates);
  assert.ok(result.actions.every(a => a.evidenceValid && !a.approved && !a.dateConfirmed && a.origin === "rules"));
  if (c.id === "conflict-and-waiver") assert.match(result.actions[1].condition, /unless you have a waiver/);
  if (c.id === "timed-cutoff") assert.equal(result.actions[0].utcOffset, "");
  if (c.id === "weekday-conflict") assert.ok(result.attention.some(item => /Weekday\/date conflict/.test(item.reason)));
  if (c.id === "24-hour-cutoff") { assert.equal(result.actions[0].time, "17:00"); assert.equal(result.actions[0].utcOffset, "-10:00"); assert.equal(canConfirmDate(result.actions[0]), true); assert.equal(calendarEligible(result.actions[0]), false); }
  if (c.id === "invalid-cutoff") { assert.equal(result.actions[0].time, ""); assert.equal(result.actions[0].sourceRequiresTime, true); assert.equal(canConfirmDate(result.actions[0]), false); assert.equal(calendarEligible({ ...result.actions[0], approved: true, dateConfirmed: true }), false); }
  if (c.id === "invalid-offset") { assert.equal(result.actions[0].time, "17:00"); assert.equal(result.actions[0].utcOffset, ""); assert.equal(result.actions[0].sourceRequiresTime, true); assert.equal(canConfirmDate(result.actions[0]), false); assert.equal(calendarEligible({ ...result.actions[0], approved: true, dateConfirmed: true }), false); }
  return { ...c, actual: result, automatic_checks: "passed", human_review: "not_reviewed" };
});
const report = { engine: "local English text rules, no AI model", runtime_network_calls: 0, interpretation: "Fresh synthetic notice contract checks, not a usability study or proof of complete language understanding.", cases: observations };
await writeFile("devpost/local-smoke.json", JSON.stringify(report, null, 2) + "\n");
console.log(`${observations.length} fresh local notice checks passed. Report saved; human review remains pending. No API calls were made.`);
