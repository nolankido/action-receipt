// Reproducible domain-output capture, not a browser recording or a human trial.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { demoScenario } from "../lib/demo-scenario.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { canConfirmDate, editAction } from "../lib/receipt.ts";
import { createActionFromFlag, recordSourceDecision } from "../lib/source-review.ts";
import { planExports, checklistText, calendarText } from "../lib/export.ts";
import { saveReviewFile, openReviewFile } from "../lib/review-file.ts";

const report = JSON.parse(await readFile("devpost/demo/rehearsal.json", "utf8"));
for (const [path, hash] of Object.entries(report.source_files_sha256)) {
  assert.equal(createHash("sha256").update(await readFile(path)).digest("hex"), hash, "Stale rehearsal input: " + path);
}
const initial = extractLocally(demoScenario.source);
const consent = initial.attention.find(f => f.evidence.quote.includes("consent form"));
const fee = initial.attention.find(f => f.evidence.quote.includes("membership fee"));
assert.ok(consent && fee);
const repair = createActionFromFlag(demoScenario.source, consent, {
  title: "Attach a signed consent form", quote: consent.evidence.quote, condition: "",
  note: "Automated technical walkthrough: separate required document, with no stated deadline.",
}, initial.actions);
let actions = [...initial.actions, repair.action];
let attention = initial.attention.map(f => f.id === consent.id ? repair.item : f);
attention = attention.map(f => f.id === fee.id ? recordSourceDecision(f, {
  kind: "not_action", actionId: null, note: "Automated technical walkthrough: the notice explicitly waives this separate fee.",
}, actions) : f);
const repaired = structuredClone({ actions, attention });
actions = actions.map(a => ({ ...a, approved: true }));
const actionCheckedCounts = { checklist: planExports(actions).checklist.length, calendar: planExports(actions).calendar.length };
actions = actions.map(a => ({ ...a, dateConfirmed: canConfirmDate(a) }));
const finalCounts = { checklist: planExports(actions).checklist.length, calendar: planExports(actions).calendar.length };
assert.deepEqual(finalCounts, { checklist: 4, calendar: 2 });
const meta = { mode: "local", title: "AUTOMATED TECHNICAL WALKTHROUGH: " + demoScenario.title,
  createdAt: new Date("2026-10-15T00:00:00Z"), receiptId: "automated-technical-walkthrough",
  notes: ["SCRIPTED SYNTHETIC CHECK. Approvals and date checks are automated, not a human review.", ...initial.notes], attention };
const markdown = checklistText(actions, meta);
const calendar = calendarText(actions, meta);
const edited = editAction(actions[1], { time: "16:00" });
assert.equal(edited.approved, false); assert.equal(edited.dateConfirmed, false);
const reopened = openReviewFile(saveReviewFile({ source: demoScenario.source, actions, meta }));
assert.equal(planExports(reopened.actions).checklist.length, 0);
assert.equal(planExports(reopened.actions).calendar.length, 0);
assert.ok(initial.actions.every(a => a.evidenceValid && !a.approved && !a.dateConfirmed));
const capture = {
  type: "Actual production-domain outputs, presented as a technical video; no browser interface footage",
  synthetic: true, all_review_choices_scripted: true, human_review: false,
  source: demoScenario.source, initial, repaired, actionCheckedCounts, finalCounts,
  finalActions: actions, markdown, calendar,
  editedCutoff: { approved: edited.approved, dateConfirmed: edited.dateConfirmed },
  reopenedCounts: { checklist: planExports(reopened.actions).checklist.length, calendar: planExports(reopened.actions).calendar.length },
  source_files_sha256: report.source_files_sha256,
  capture_script_sha256: createHash("sha256").update(await readFile("scripts/capture-technical-walkthrough.mjs")).digest("hex"),
};
await mkdir("outputs/video", { recursive: true });
await writeFile("outputs/video/domain-capture.json", JSON.stringify(capture, null, 2) + "\n");
await writeFile("outputs/video/technical-checklist.md", markdown);
await writeFile("outputs/video/technical-calendar.ics", calendar);
console.log("Captured real domain outputs: 3 proposals, 1 scripted repair, 4 checklist tasks, 2 calendar markers. No browser footage or human review claimed.");
