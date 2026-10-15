---
doc: spec
status: approved
---
# Action Receipt Technical Spec

## How This Works, In Plain Language
The browser reads a pasted notice using bounded English text patterns. Ordinary code checks quotation presence and dates. The user checks meaning, fixes omissions/uncertainty and approves items. The browser creates download files. No server, API key, model download or notice database is required.

## The Core Journey Through the System
`standalone/main.tsx` renders the React workspace. Current text goes to `extractLocally`, then through the evidence/date validator to review cards and approved-only exports. The rule engine never imports saved sample results. Saved walkthroughs use the same validator but remain explicitly labeled.

## Stack
React 19, TypeScript and Vite for a static browser app. Zod validates proposal structures. Node's built-in runner checks rules, evidence, review transitions and exports. No runtime service or GitHub Actions. Retained Sites/Vinext scaffolding is unused by the active static entry and disclosed in third-party notices.

## Where It Runs and How Someone Tries It
Open `release/action-receipt.html` in a current desktop browser, including while offline. No installation is required for the built file. Source development uses Node 22.13+, `npx pnpm@11.25.0 install --frozen-lockfile` and `npm run dev`. Run `npm test`, `npm run typecheck`, `node --experimental-strip-types scripts/smoke-local.ts` and `npm run build`. Supported browser-control availability still governs managed preview QA. The public repository includes the runnable file; the existing private Sites review URL is optional.

## Look and Feel
Implement `prd.md > Look and Feel` with warm paper backgrounds, white document surfaces, dark ink, forest green primary controls, amber issue labels, readable system sans text and a restrained serif display headline. Clear focus rings, semantic labels and reduced motion. Responsive two-column workspace.

## Components

### Workspace
`app/page.tsx` and `app/receipt-workspace.tsx` implement `prd.md > Notice Entry`, `Evidence Review`, `Corrections and Approval` and all normal/error/empty states. Memory only. The current source revision invalidates old responses. A compact manual action form accepts a title, exact source passage and optional condition. User-added items are labeled visibly, begin unapproved with unresolved dates, and share all approval/export rules.

### Local Rule Engine
`lib/local-extraction.ts` implements a deliberately bounded English pattern matcher. It segments exact source passages, recognizes selected action words, retains prefix/trailing conditions, matches explicit full dates only with a temporal link, and leaves relative/numeric/multiple/unclear dates unresolved. It skips negated passages and an instruction immediately followed by a cancellation referring back. It does not reliably resolve other cross-sentence changes. No fetch, tools, API or current-date inference. SourceReviewItem records exact evidence and reasons for unlinked or skipped passages, with an 80-item bound and reported overflow. Date matching excludes conditions and later semicolon clauses; cutoff proposals require a recognized temporal tail, and conflicting clocks/offsets stay unresolved. Missing actions are added manually with exact evidence.

### Validation and Review Rules
`lib/receipt.ts` implements `prd.md > Evidence Review` and `Dates and Conditions`. Treat proposal fields as untrusted; cap counts and lengths; locate exact quotations locally; preserve issue codes and conditions. A complete explicit date is required for calendar eligibility; date confirmation is distinct from approval. Code confirms quotation presence only, not the truth or completeness of extraction.

`lib/dates.ts` shares bounded full-date patterns between the rule engine and validator. English month names and common abbreviations work in either written order with an explicit four-digit year. Immediately attached full/abbreviated weekdays are checked using UTC calendar arithmetic; contradictions block source date proposals and create visible source-review context. User clarification can resolve calendar eligibility while original warnings persist. A same-length internal substitution protects abbreviation periods during sentence segmentation; quotations and positions always come from the original unchanged source. Missing years, ambiguous numeric formats, relative wording and uncertain date roles remain unresolved.

`lib/times.ts` shares time/offset validation, conservative clock-like text detection and bounded parsing. Exclude UTC/GMT offsets before scanning clocks. Accept explicit `HH:MM`, AM/PM and noon; keep seconds, fractional minutes, malformed clocks, bare single-digit clocks, midnight wording, mixed clock families and conflicting values unresolved. Malformed numeric clock text still sets the source cutoff guard. Existing action-clause and condition boundaries remain in force. `canConfirmDate` also checks that conversion to UTC has a four-digit year; preview, exports and clarification prompts share the resulting eligibility. Range errors remain checklist-only with an explicit reason. Review-file restore independently recomputes the broader cutoff guard from source.

### Guided Source Review
`app/source-review-queue.tsx` presents one identified flag at a time, with pending/all filters, source inspection and a decision explanation. `lib/source-review.ts` owns pure decision transitions, source-backed repair and progress/status computation. A decision is linked to an action, not an obligation, or awaiting clarification. Linking is explicitly a user association, with no inferred date. It never approves an action or confirms a date. New repairs require a matched excerpt within the flagged passage, respect the action/evidence limits, start undated/unapproved, and open their action details for review.

Each flag keeps its original reason and exact evidence. A decision records kind, explanation, optional action ID and user/imported provenance. Current-session confirmation and an ephemeral action-content snapshot control whether a link is addressed. Changed meaning, omitted/unavailable action or revoked approval makes it need attention again; imported decisions always need rechecking. Addressed counts describe identified flags only and never certify complete extraction or date resolution. Flag identifiers are unique even when several reasons apply to one passage. Workspace revision tracking includes committed decision changes so a late file read cannot overwrite them.

### Next-step Guidance
`lib/review-guide.ts` derives a navigation target from typed source-review statuses and the shared export eligibility plan. `app/review-guide.tsx` shows the next target, counts and waiting-clarification disclosure. Loaded decisions always return to recheck; changed/unavailable links return to their exact flag; a pending linked approval routes to its action. User-recorded clarification stays pending but does not block navigation to other actions or download preview. Calendar review is optional. Guidance never changes evidence, decisions, approvals or date confirmation. Explicit navigation opens the target details and moves focus; state changes alone do not move focus. Excluded preview items close the dialog and open the relevant action/date field.

### Exports
`lib/export.ts` implements `prd.md > Export`. Export only approved items. Escape iCalendar content lines, fold UTF-8 lines, use stable per-action UIDs, represent date-only entries as all-day markers and timed deadlines as zero-duration instants with explicit offsets. Never invent an event length. Omit unresolved calendar items visibly. Preserve notice notes and source-review flags as context in both download formats, without creating additional tasks or events.

`app/export-preview.tsx` provides an optional modal preview for both formats. `planExports` shares the exact checklist/calendar eligibility selectors used by serializers and workspace counts, and provides exclusion reasons. `reviewedDateText` reports only valid confirmed dates as confirmed. Read-only action summaries show conditions and time/offset wording, alongside context disclosure and the exact serialized file text. Download the same displayed string. Mount the preview only while open to avoid serializing files during ordinary editing. The dialog uses native focus handling, accessible labels and plain format buttons; source text renders as escaped React text. It makes no network request and changes no review state.

### Clarification Sheet
`lib/clarification.ts` derives optional drafts from active source-backed actions with incomplete date/time/offset fields and current-user confirmed clarification notes. Complete-but-unconfirmed dates do not produce questions. User notes replace generic prompts for the same exact action passage. Re-match quotes against current source; exclude omitted/invalid actions and unverified imported clarification choices. Each draft has an ephemeral basis containing the whole current source and relevant context/fields. Editing clears selection; changed source/context or duplicate/unknown selected IDs block serialization. Questions are bounded to 600 characters.

`app/clarification-sheet.tsx` provides a native modal with editable drafts, source inspection, explicit unchecked-by-default selection and exact Markdown preview. Download the displayed string. The serializer includes only selected questions and their own context, conditions, source quotes and provenance; preserve quoted line breaks and escape Markdown. It never invokes task/event serializers or changes review trust. Entry points appear in guidance, export preview and the export area, including when no actions qualify. Closing discards component-local drafts/selections; disclose this before the form. Existing version-2 review files are unchanged. No clipboard, network or external messaging integration is needed.

### Samples
`lib/samples.ts` holds three synthetic notices and explicitly saved walkthrough results: multiple deadlines, ambiguity, and conflicting dates/conditional instructions. Always label this mode and its generated exports.

### Temporary Workspace Recovery
`lib/workspace-recovery.ts` defines a curated workspace snapshot and detached structured copies. `shouldCheckpoint` protects reviewed source edits/rescans and nonempty bulk replacements, preserving the pre-edit copy during continuous typing and a first unreviewed scan. `recoverWorkspace` re-matches evidence, clears every action/date approval and source-decision confirmation/snapshot, preserves real user/rule/imported provenance and stable receipt/action IDs, and returns a detached outgoing snapshot as the next copy. It adds no warnings or persisted history.

`app/recovery-banner.tsx` offers restore and discard, with the source notice name and replacement reason. The parent owns one memory-only copy. Recovery invalidates scan and file-load IDs and increments the workspace revision before applying the snapshot; stale asynchronous results cannot replace it. Clear modal/focus/form state through the ordinary source reset. Recovering never fabricates a file import or silently restores trust. Discard returns focus to the workspace. Downloads and review files receive only current state, so the copy and unfinished child-form entries are excluded. Refresh/tab closure clears all memory.

### Local Review Files
`lib/review-file.ts` implements `prd.md > Save and Resume a Review`. Write bounded version-2 JSON and retain version-1 read compatibility. Preserve flag IDs and decision choices/explanations/action links. Exclude approval, date confirmation, decision confirmation, provenance and ephemeral action snapshots from serialized trust. Strict Zod schemas reject unknown trust fields, duplicate IDs, dangling links and unsupported versions. Enforce a 1 MB UTF-8 byte limit before parsing. Re-match every quotation and independently derive cutoff protection from exact matching local-rule evidence; unfamiliar passages use a conservative clock check. Never trust a saved flag to disable a source cutoff. Imported interpretations, original-field metadata, decisions and prior mode remain unverified. Preserve edits, omissions, context and stable IDs, but reset approvals/date confirmations and require explicit decision rechecking. Workspace revision checks discard stale file reads. No autosave, external file service or new dependency.

## Data Model
An immutable source string and revision; proposal mode/origin; candidate actions with title, condition, action evidence, date evidence, literal deadline, proposed ISO date, time and offset, issues; reviewed actions with edited values, date confirmation, user-change provenance, action origin (extracted/rules/user/imported), approval and omission. Receipt mode distinguishes saved samples, local proposals and manual review, with a restored flag for unverified imported metadata. Everything lives in browser memory, with one detached temporary recovery copy; no database or persistent history. A new extraction resets approvals. All application state and processing are local. Refreshing clears session state; explicit JSON review downloads allow continuation with fresh approval.

## File Structure
- `standalone/`, `vite.static.config.ts`: static browser entry.
- `app/receipt-workspace.tsx`, `app/review-guide.tsx`, `app/source-review-queue.tsx`, `app/export-preview.tsx`, `app/clarification-sheet.tsx`, `app/recovery-banner.tsx`, `app/globals.css`: review UI.
- `lib/local-extraction.ts`, `lib/dates.ts`, `lib/times.ts`, `lib/review-guide.ts`, `lib/clarification.ts`, `lib/workspace-recovery.ts`, `lib/receipt.ts`, `lib/export.ts`, `lib/review-file.ts`, `lib/samples.ts`: rules, calendar syntax, validation, downloads, local review continuation and examples.
- `lib/demo-scenario.ts`: short explicitly invented launch fixture. The workspace initializes it with a lazy call to `extractLocally`, never a saved result. Extra saved examples/harder fresh practice and save/open tools use native secondary disclosures. Recovery and file status messages stay outside collapsed controls.
- `scripts/rehearse-demo.ts`: reproducible production-domain integration checks and conspicuously labeled scripted reference artifacts in `devpost/demo/`. Covers scan, exact evidence, repair, decisions, separate approval/date gates, serializers, UTC conversion, edit invalidation and review-file reopen; hashes its production source inputs and outputs. Does not test browser controls or human use.
- `scripts/build-static.mjs`: inlines JavaScript/styles/icons and license notices into the distribution, adds a network-blocking policy, rejects external runtime asset references.
- `release/action-receipt.html`: committed standalone app.
- `tests/`, `devpost/`: behavioral checks, Skill Pack evidence and technical plan.

## External Services and Dependencies
No external runtime services. Development dependencies are listed in package/lock files. Source and optional static hosting use the existing GitHub/Sites integration. The main deliverable works without hosting. No new paid service, credentials, API credits or background jobs. Static hosting manifest preserves the existing project ID and sets `static.directory` to `dist`.

## Important Failure Modes
- Unsupported or implicit wording: the rule engine may miss instructions; require full source review and permit manual evidence-backed additions.
- Dates in other sentences or uncertain date roles: do not link automatically.
- Relative wording, multiple dates or incomplete clocks/offsets: retain uncertainty; calendar stays blocked until user clarification.
- Negation and cancellations: local patterns cover only bounded forms, not complete cross-sentence semantics.
- Source changes during scan: discard stale results and clear old approvals. Rescanning is explicitly labeled as replacing current review.
- Refresh: clear memory; downloaded receipts and explicit review files remain with the user.
- Invalid or stale review file: report the failure and keep the current workspace. Imported dates and interpretations require fresh review; no trust flags are restored.

## What Was Simplified and Why
The learner explicitly required no new spending. A single-file ordinary browser app avoids API bills, model downloads, hardware-specific inference setup and hosting dependence. Manual source-backed repair covers bounded-parser omissions while preserving the original evidence/approval kernel.

## Decisions and Open Issues
The cost-free runtime is the learner's decision. No successful live model extraction is required or claimed. Historical failed API reports remain as history. One hundred twenty-eight automated tests, seven fresh local smoke checks and a static build establish narrow mechanical behavior. The formative trial kit in `devpost/usability/` is prepared with three synthetic notices and a blank observation template. No sessions, participant comments or outcomes are claimed. Actual browser interaction, learner review and the public demo/answers/submission remain pending.

Date resolution retains original warnings. A confirmed user-supplied date can become calendar-eligible while original ambiguity remains in exports. Exact action evidence is always mandatory. Saved examples, local rules and user additions retain distinct provenance.

## Input integrity and accessible review implementation

`noticeInputState` in `lib/receipt.ts` provides one readiness policy: 30 trimmed characters minimum and 15,000 total characters maximum. Workspace scan/manual/save controls and next-step guidance use this state; automatic extraction and manual-action construction also enforce it independently. Notice and supporting-quote textareas deliberately omit native `maxLength` caps so an oversized paste is not silently truncated. The full draft remains visible while actions are blocked. Quote forms independently require an exact, at-most-1,200-character excerpt; domain validation retains the same bound. Existing review-file size/source limits remain in force. Recovery retains oversized unscanned drafts exactly and clears trust on restoring a review.

Source marks are programmatically focusable. An explicit inspection signal supports repeated focus of the same passage. Named action articles and specific checkbox names distinguish repeated controls. Compact cutoff labels include UTC offset or an unresolved-field explanation; proposed dates remain visibly unconfirmed. Narrow-screen input text is 16 pixels. Browser interaction remains unverified in this environment.
