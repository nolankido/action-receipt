import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { demoScenario } from "../lib/demo-scenario.ts";
import { extractLocally } from "../lib/local-extraction.ts";
import { canApprove, canConfirmDate, editAction, type ReviewedAction, type SourceReviewItem } from "../lib/receipt.ts";
import { createActionFromFlag, recordSourceDecision, sourceReviewState, sourceReviewSummary } from "../lib/source-review.ts";
import { calendarText, checklistText, escapeICS, planExports, type ReceiptMeta } from "../lib/export.ts";
import { openReviewFile, saveReviewFile } from "../lib/review-file.ts";

// Runs production domain functions, not a browser simulation or a participant session.
// All approvals below are scripted contract checks and are labeled in every artifact.
const disclaimer = "AUTOMATED SYNTHETIC REHEARSAL. Approvals, date checks and source decisions are scripted contract checks, not human review or usability findings.";
const result = extractLocally(demoScenario.source);
let actions = result.actions;
let attention = result.attention;
const stages: { stage: string; checklist: number; calendar: number; pendingFlags: number }[] = [];
function checkpoint(stage: string, checklist: number, calendar: number) {
  const plan = planExports(actions);
  assert.equal(plan.checklist.length, checklist, stage);
  assert.equal(plan.calendar.length, calendar, stage);
  stages.push({ stage, checklist, calendar, pendingFlags: sourceReviewSummary(attention, actions).pending });
}
function matchedEvidence(current: ReviewedAction[], flags: SourceReviewItem[]) {
  for (const evidence of [...current.flatMap(a => [...a.evidence, ...a.dateEvidence]), ...flags.map(f => f.evidence)]) {
    assert.ok(evidence.starts.length > 0);
    for (const start of evidence.starts) assert.equal(demoScenario.source.slice(start, start + evidence.quote.length), evidence.quote);
  }
}
assert.equal(actions.length, 3);
assert.equal(attention.length, 2);
assert.ok(actions.every(a => a.origin === "rules" && !a.approved && !a.dateConfirmed));
assert.deepEqual(actions.map(a => a.date), ["2032-11-05", "2032-11-08", ""]);
assert.match(actions[2].condition, /If you need accessible transport/);
assert.ok(!actions.some(a => /membership fee/.test(a.evidence[0].quote)));
matchedEvidence(actions, attention);
checkpoint("Fresh local scan: no automatic approval", 0, 0);

const consent = attention.find(f => f.evidence.quote === "Participants must attach a signed consent form.")!;
const fee = attention.find(f => f.evidence.quote === "You do not need to pay a separate membership fee.")!;
assert.ok(consent && fee);
const repair = createActionFromFlag(demoScenario.source, consent, {
  title: "Attach a signed consent form", quote: consent.evidence.quote, condition: "",
  note: "Automated fixture decision: this is a separate required document; no deadline is stated.",
}, actions);
actions = [...actions, repair.action];
attention = attention.map(f => f.id === consent.id ? repair.item : f);
assert.equal(repair.action.origin, "user");
assert.equal(repair.action.date, "");
assert.equal(repair.action.approved, false);
assert.equal(repair.action.dateConfirmed, false);
assert.equal(sourceReviewState(repair.item, actions).code, "approval");
checkpoint("Repair from exact source: still unapproved and undated", 0, 0);

attention = attention.map(f => f.id === fee.id ? recordSourceDecision(f, {
  kind: "not_action", actionId: null,
  note: "Automated fixture decision: the notice explicitly says this separate fee is not required.",
}, actions) : f);
actions = actions.map(a => { assert.ok(canApprove(a)); return { ...a, approved: true }; });
checkpoint("Scripted action checks without date confirmation", 4, 0);
assert.deepEqual(sourceReviewSummary(attention, actions), { total: 2, addressed: 2, pending: 0 });

actions = actions.map(a => ({ ...a, dateConfirmed: canConfirmDate(a) }));
checkpoint("Scripted confirmation of only the two complete dates", 4, 2);
assert.ok(actions.slice(2).every(a => a.date === "" && !a.dateConfirmed));
assert.equal(actions[1].time, "17:00");
assert.equal(actions[1].utcOffset, "-10:00");
matchedEvidence(actions, attention);
const meta: ReceiptMeta = {
  mode: "local", title: "AUTOMATED REHEARSAL FIXTURE: " + demoScenario.title,
  createdAt: new Date("2026-10-15T00:00:00Z"), receiptId: "automated-demo-contract",
  notes: [disclaimer, ...result.notes], attention,
};
const markdown = checklistText(actions, meta);
const calendar = calendarText(actions, meta);
const unfolded = calendar.replace(/\r\n /g, "");
assert.equal((markdown.match(/^- \[ \] /gm) ?? []).length, 4);
assert.equal((calendar.match(/BEGIN:VEVENT/g) ?? []).length, 2);
assert.match(unfolded, /DTSTART;VALUE=DATE:20321105/);
assert.match(unfolded, /DTSTART:20321109T030000Z/);
assert.ok(!unfolded.includes("SUMMARY:email the coordinator") && !unfolded.includes("SUMMARY:Attach a signed consent form"));
assert.ok(markdown.includes(disclaimer) && unfolded.includes(escapeICS(disclaimer)));
assert.match(markdown, /next Friday/);
assert.match(markdown, /If you need accessible transport/);
assert.match(markdown, /no calendar entry/);
assert.ok(!/(^|[^\r])\n/.test(calendar));
for (const line of calendar.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);

// A later change and a file reopen must remove trust, even after a successful export.
const edited = actions.map((a, i) => i === 1 ? editAction(a, { time: "16:00" }) : a);
assert.equal(edited[1].approved, false);
assert.equal(edited[1].dateConfirmed, false);
assert.equal(planExports(edited).calendar.length, 1);
const reopened = openReviewFile(saveReviewFile({ source: demoScenario.source, actions, meta }));
assert.ok(reopened.actions.every(a => !a.approved && !a.dateConfirmed));
assert.equal(planExports(reopened.actions).checklist.length, 0);
assert.equal(planExports(reopened.actions).calendar.length, 0);
assert.ok(reopened.meta.attention?.every(f => f.decision && !f.decision.confirmed));

const files = [
  "app/receipt-workspace.tsx", "app/globals.css", "app/review-guide.tsx", "app/source-review-queue.tsx", "app/source-review-editor.tsx", "app/export-preview.tsx",
  "app/clarification-sheet.tsx", "app/download-feedback.tsx", "app/recovery-banner.tsx", "app/review-save-status.tsx", "app/review-file-feedback.tsx", "app/action-view-controls.tsx", "app/source-inspection-bar.tsx", "standalone/main.tsx", "vite.static.config.ts",
  "scripts/build-static.mjs", "scripts/rehearse-demo.ts", "package.json", "pnpm-lock.yaml",
  ...(await readdir("lib")).filter(n => n.endsWith(".ts")).map(n => "lib/" + n),
].sort();
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const sourceFiles = Object.fromEntries(await Promise.all(files.map(async path => [path, sha256(await readFile(path))])));
const report = {
  kind: "Automated synthetic domain-workflow rehearsal", status: "passed", disclaimer,
  scope: "Production extraction, evidence, repair, decisions, approval/date eligibility, serializers and review-file parser. Does not exercise browser controls, downloads or calendar import.",
  human_review: "not_conducted", browser_interaction: "not_conducted", video: "not_recorded",
  fixture: demoScenario, fixture_sha256: sha256(demoScenario.source),
  deterministic_export_timestamp: meta.createdAt.toISOString(), stages,
  assertions: ["Exact source positions", "Separate registration and timed payment deadlines", "Missing consent instruction repaired without inferred date", "Waived fee remains context, not a task", "Conditional relative deadline stays unresolved", "4 checklist tasks and 2 calendar markers", "Timed cutoff converts to 2032-11-09 03:00 UTC", "UTF-8 75-byte iCalendar folding and CRLF", "Edits clear approval and date checks", "Reopening requires fresh review"],
  source_files_sha256: sourceFiles,
  artifacts: { "automated-checklist.md": sha256(markdown), "automated-calendar.ics": sha256(calendar) },
};
await mkdir("devpost/demo", { recursive: true });
await writeFile("devpost/demo/automated-checklist.md", markdown);
await writeFile("devpost/demo/automated-calendar.ics", calendar);
await writeFile("devpost/demo/rehearsal.json", JSON.stringify(report, null, 2) + "\n");
console.log("Synthetic workflow rehearsal passed: 3 proposals + 1 repair; 4 checklist tasks, 2 calendar markers. Artifacts explicitly label scripted approvals. Browser and human review remain pending.");
