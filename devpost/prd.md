---
doc: prd
status: approved
---
# Action Receipt Product Requirements

Source: `scope.md > The Core Loop`, `scope.md > The Unique Kernel`.

## The Core Journey
1. Open the workspace and paste a notice, or load a clearly labeled synthetic sample.
2. Run local text rules in the browser. No notice is sent to a model or server. Sample walkthroughs use saved example results and say so.
3. Review proposed actions, their conditions, date wording, matching source passages and unresolved issues.
4. Edit action wording or supply an explicit date. User edits remain distinguishable from automatic proposals and invalidate prior approval.
5. Approve each action after review.
6. Download a checklist containing only approved actions, preserving unresolved wording and provenance. Download calendar entries only for approved items with confirmed complete dates.

## Screens and Layout
One main workspace. Header with product identity and a concise explanation. Three sample choices. Left panel for source text and source highlighting. Right panel for action cards, review status and exports. Mobile stacks the panels with accessible disclosure controls on cards. A small method/about dialog explains processing and limitations.

## Look and Feel
Carry forward the accepted calm workspace, high contrast, source-left/actions-right layout and explicit labels. Forest green, warm paper and dark ink are implementation choices within that direction. No confidence scores, ornamental dashboards or generated imagery.

## Features and Behavior

### Notice Entry
Accept 30 to 15,000 characters of plain text. Source edits clear results and approvals; asynchronous responses for an old source cannot replace current results. No local or server notice history.

### Evidence Review
Every action and date may have separate exact quotations. Match them against immutable source text. Missing action evidence blocks approval. Missing date evidence blocks a source-derived date proposal; the user may still supply and confirm a date with user provenance. Repeated matches are all highlighted and flagged for contextual review instead of inventing a unique location. Selecting evidence highlights the actual source passage. Source matching does not certify semantic correctness.

### Dates and Conditions
Display original date wording. Explicit full dates can be proposed, but every date needs human confirmation. Relative dates, missing years, incomplete times/zones, invalid dates and conflicts require clarification. Optional or conditional instructions keep those qualifications visible. The user may keep an action undated for checklist use. Calendar export requires a confirmed calendar date; timed source deadlines require a confirmed time and UTC offset. No guessed dates, durations or reminders.

### Corrections and Approval
Each action can be edited, omitted or approved. A missed action can be added from an exact supporting source passage, with an optional condition and explicit user provenance. This works without AI. It begins with an unresolved date and no approval; the same date and export gates apply. Receipts hold at most 20 actions. Changing an action, date or condition revokes its approval. A user-supplied date is labeled as such. All actions start unapproved. An unresolved action may be approved for checklist use with the issue retained; it stays ineligible for calendar export.

### Export
Export an evidence-bearing Markdown checklist and an iCalendar file from the current reviewed state. Buttons show eligible counts and are disabled when empty. Calendar export explicitly reports omitted approved-but-unresolved items. Include evidence and user corrections in descriptions. Export performs no network write or automatic calendar insertion.

## States and Boundaries
- Empty: actionable guidance and synthetic samples.
- Processing: progress label and disabled duplicate submissions; source remains editable.
- No actions: explain that nothing actionable was identified and suggest checking the notice.
- Unsupported wording: explain the rule engine's limited coverage and offer manual source-backed additions.
- Invalid input/schema/evidence checks: report failure without fabricating success or silently using samples.
- New source: previous approvals and results cleared.
- Refresh/close: session text and actions disappear. No provider processing exists in this version.

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
