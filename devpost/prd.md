---
doc: prd
status: approved
---
# Action Receipt Product Requirements

Source: `scope.md > The Core Loop`, `scope.md > The Unique Kernel`.

## The Core Journey
1. Open the workspace with a short explicitly synthetic notice freshly scanned by the actual local rules. Nothing starts approved. Paste your own notice, restart short practice, or open secondary saved walkthroughs/harder practice.
2. Run local text rules in the browser. No notice is sent to a model or server. Sample walkthroughs use saved example results and say so.
3. Review proposed actions, their conditions, date wording, matching source passages and unresolved issues.
4. Edit action wording or supply an explicit date. User edits remain distinguishable from automatic proposals and invalidate prior approval.
5. Approve each action after review.
6. Download a checklist containing only approved actions, preserving unresolved wording and provenance. Download calendar entries only for approved items with confirmed complete dates.

## Screens and Layout
One main workspace. Header with product identity and a concise explanation. A short fresh-rule practice is the default; three saved walkthroughs and harder practice sit in a secondary disclosure. Save/open controls use their own disclosure; file feedback and recovery remain visible outside it. Left panel for source text and source highlighting. Right panel for next-step guidance, action cards, review status and exports. The source and guidance begin beside one another on desktop. Core notice/action text is sized for readable review. Mobile stacks the panels with accessible disclosure controls on cards. A small method/about dialog explains processing and limitations. Actual browser/usability verification is still pending.

## Look and Feel
Carry forward the accepted calm workspace, high contrast, source-left/actions-right layout and explicit labels. Forest green, warm paper and dark ink are implementation choices within that direction. No confidence scores, ornamental dashboards or generated imagery.

## Features and Behavior

### Notice Entry
Accept 30 to 15,000 characters of plain text. Source edits clear results and approvals; asynchronous responses for an old source cannot replace current results. No persistent local or server notice history. One temporary recovery copy protects replaced work in the current tab.

### Evidence Review
Every action and date may have separate exact quotations. Match them against immutable source text. Missing action evidence blocks approval. Missing date evidence blocks a source-derived date proposal; the user may still supply and confirm a date with user provenance. Repeated matches are all highlighted and flagged for contextual review instead of inventing a unique location. Selecting evidence highlights the actual source passage. Source matching does not certify semantic correctness. A visible source-review list links unassigned dates, unsupported obligations, negations, extra clauses and skipped passages back to exact source text. Up to 80 items are shown with an explicit overflow note. It does not claim exhaustive coverage.

### Guided Source Review
Turn identified source flags into a one-at-a-time queue. Show the exact quote and original reason, then let the user create an action with prefilled evidence, link an existing action, record that it is not an obligation, or leave it awaiting clarification. Require an explanation for each recorded decision. New actions need normal approval and date review. Show addressed/pending counts only for identified flags, never a completeness or safety score. A linked decision needs rechecking when its action meaning changes, and remains pending while the action is unapproved or omitted. Preserve original flags and current decisions in previews, exports and saved reviews. Imported decisions remain unverified until explicitly rechecked. No decision automatically approves tasks or confirms dates.

### Next-step Guidance
A compact panel derives the next review target from the current state. Navigate to undecided, imported or stale flags; then unchecked actions; then preview approved downloads. A linked action awaiting approval points to the action. A recorded clarification stays pending without trapping the user or preventing other review. Treat calendar confirmation as optional and allow approved checklist-only items. Never imply completeness, approve an action, or infer a date through navigation. Excluded items in download preview link back to the relevant action or date fields.

### Clarification Sheet
Offer optional question drafts for incomplete calendar fields and source passages the current user explicitly marked as needing clarification. A recorded note takes precedence over a generic date question for the same exact passage. Show context, conditions and exact supporting quotations. Let the user edit each question and deliberately select it after checking; no question starts selected, and editing clears its selection. Preview/download only selected questions with their own context, without unrelated notice notes or flags. Complete unconfirmed dates stay in normal date review. Imported clarification decisions need rechecking before becoming question notes. No question is sent, no date is inferred, and no action approval or source decision changes. Warn before editing that closing discards question drafts and selections; review files do not preserve them. This remains part of the single-notice workflow.

### Dates and Conditions
Display original date wording. Explicit full dates can be proposed, but every date needs human confirmation. Relative dates, missing years, incomplete times/zones, invalid dates and conflicts require clarification. Optional or conditional instructions keep those qualifications visible. The user may keep an action undated for checklist use. Calendar export requires a confirmed calendar date; timed source deadlines require a confirmed time and UTC offset. No guessed dates, durations or reminders.

Recognize full and common abbreviated English month names in month-first or day-first dates with explicit four-digit years. Preserve periods in abbreviations as source text, not sentence boundaries. An immediately adjacent written weekday may qualify a date; if the weekday contradicts the calendar date, leave the date unresolved and show an exact-source conflict flag. Do not choose which part is correct. This is a bounded syntax check, not exhaustive language interpretation.

Recognize explicit 24-hour `HH:MM` cutoffs, AM/PM and noon only within the established action deadline clause. UTC offsets are separate from clock times. Keep malformed clock-like text timed and unresolved; it must not silently qualify as an all-day marker. Seconds/fractional precision, bare single-digit clocks, midnight wording, mixed formats and conflicting times require clarification. A timed entry must also fit a four-digit UTC calendar year after conversion. Show a specific exclusion and clarification reason when that conversion cannot be represented.

### Corrections and Approval
Each action can be edited, omitted or approved. A missed action can be added from an exact supporting source passage, including by reusing the currently highlighted passage in the manual form, with an optional condition and explicit user provenance. This works without AI. It begins with an unresolved date and no approval; the same date and export gates apply. Receipts hold at most 20 actions. Changing an action, date or condition revokes its approval. A user-supplied date is labeled as such. All actions start unapproved. An unresolved action may be approved for checklist use with the issue retained; it stays ineligible for calendar export.

### Export
Export an evidence-bearing Markdown checklist and an iCalendar file from the current reviewed state. Buttons show eligible counts and are disabled when empty. Calendar export explicitly reports omitted approved-but-unresolved items. Include evidence, user corrections, notice-level notes and source-review context in both formats. Context flags never become extra checklist tasks or calendar events. Export performs no network write or automatic calendar insertion.

An optional download preview shows the included actions and per-action exclusion reasons for each format. Explain missing approval, evidence, wording, date, cutoff, UTC offset or date confirmation. Show the exact serialized file text and allow its download without altering approvals. Reveal the amount and type of source context in the files, including context that may mention unapproved instructions. Keep the preview useful even when nothing qualifies, with a return to review. Direct download remains available.

### Recover Replaced Work
Keep one detached in-memory copy before replacing a current review through source edits or rescans, and before replacing a nonempty notice with a sample, practice notice or valid review file. Continuous typing and the first scan of unreviewed replacement text must not overwrite the pre-edit review. Invalid/stale file loads do not replace work or its copy. Recover source, committed action/condition/date edits, omissions, notes, source decisions, modes, provenance and stable IDs. Re-match evidence and reset all approvals, date confirmations and source-decision confirmations. Retain the outgoing workspace as the next copy so recovery itself is reversible. Cancel pending scans/file loads when restoring. Offer explicit discard and disclose that refresh/tab closure clears the copy; no persistent storage or download includes it. Unfinished form entries are excluded.

### Save and Resume a Review
Explicitly download a JSON review file containing the full source, action edits, omissions, evidence, notes and flagged context, including unapproved items. No autosave or remote history. Unfinished manual-form entries are not included. Opening replaces the current workspace only after validating the file; a failure keeps current work. Limit files to 1 MB and preserve existing source/action bounds. Recompute quotation positions and cutoff safeguards from source. Reset all approvals and date confirmations, and label imported interpretation and metadata as unverified. Do not attribute imported changes to the current reviewer. Preserve receipt/action IDs for stable calendar UIDs. Changes made while a file is being read must not be overwritten by its late result.

## States and Boundaries
- Empty: actionable guidance and synthetic samples.
- Processing: progress label and disabled duplicate submissions; source remains editable.
- No actions: explain that nothing actionable was identified and suggest checking the notice.
- Unsupported wording: explain the rule engine's limited coverage and offer manual source-backed additions.
- Invalid input/schema/evidence checks: report failure without fabricating success or silently using samples.
- New source: previous approvals and results cleared.
- Refresh/close: session text and actions disappear unless explicitly downloaded as a review file first. No provider processing exists in this version.

## Product Decisions
The learner accepted the narrow text workflow, evidence links, explicit ambiguity, manual approval and exports in the displayed proposal. They authorized routine implementation decisions. Test samples, a method explanation, responsive layout and button labels implement those choices. Actual user feedback and broad language coverage remain unestablished.

## What We're Building
The complete single-notice loop above, with inspectable source, uncertainty and controlled export.

## Deferred From the POC
Inbox connections, multiple documents, background reminders, cloud history, PDF/OCR and collaborative workflows.

## Open Questions
The learner required no new spending. The API architecture was removed in favor of local text rules and a standalone offline file. Fresh local contract checks are required; model access and credits are no longer completion gates. Public source is available at https://github.com/nolankido/action-receipt. The entrant's hands-on review and final written answers remain pending. These do not justify simulated live-extraction claims.

## Budget Revision
The downloadable file runs without hosting, credentials or a model download. The local engine handles selected English action words and same-passage explicit date links; it does not infer cross-sentence dates. Preserve conditional/optional wording, flag multiple instructions/dates and support manual repair. Clearly distinguish local rules from AI at runtime, and built-with-AI development from the finished product.

## Pre-submission Improvement Pass
Deadline matching excludes prefix/trailing conditions and later semicolon clauses. Clock/offset matching is limited to a recognized deadline tail; conflicting values remain unresolved. Compound instructions stay visible in action wording. Collapsed cards display a cutoff only when the reviewed item is timed. Rescan labels disclose that review state is replaced.
