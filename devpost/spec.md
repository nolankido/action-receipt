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

### Exports
`lib/export.ts` implements `prd.md > Export`. Export only approved items. Escape iCalendar content lines, fold UTF-8 lines, use stable per-action UIDs, represent date-only entries as all-day markers and timed deadlines as zero-duration instants with explicit offsets. Never invent an event length. Omit unresolved calendar items visibly. Preserve notice notes and source-review flags as context in both download formats, without creating additional tasks or events.

### Samples
`lib/samples.ts` holds three synthetic notices and explicitly saved walkthrough results: multiple deadlines, ambiguity, and conflicting dates/conditional instructions. Always label this mode and its generated exports.

## Data Model
An immutable source string and revision; proposal mode/origin; candidate actions with title, condition, action evidence, date evidence, literal deadline, proposed ISO date, time and offset, issues; reviewed actions with edited values, date confirmation, user-change provenance, action origin (extracted/user), approval and omission. Receipt mode distinguishes saved samples, live proposals and manual review. Everything lives in browser memory; no database. A new extraction resets approvals. All application state and processing are local. Refreshing clears session state.

## File Structure
- `standalone/`, `vite.static.config.ts`: static browser entry.
- `app/receipt-workspace.tsx`, `app/globals.css`: review UI.
- `lib/local-extraction.ts`, `lib/receipt.ts`, `lib/export.ts`, `lib/samples.ts`: rules, validation, downloads and examples.
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
- Refresh: clear memory; downloaded receipts remain with the user.

## What Was Simplified and Why
The learner explicitly required no new spending. A single-file ordinary browser app avoids API bills, model downloads, hardware-specific inference setup and hosting dependence. Manual source-backed repair covers bounded-parser omissions while preserving the original evidence/approval kernel.

## Decisions and Open Issues
The cost-free runtime is the learner's decision. No successful live model extraction is required or claimed. Historical failed API reports remain as history. Forty-five automated tests, fresh local smoke checks and a static build establish narrow mechanical behavior; actual browser interaction, learner review and the public demo/answers/submission remain pending.

Date resolution retains original warnings. A confirmed user-supplied date can become calendar-eligible while original ambiguity remains in exports. Exact action evidence is always mandatory. Saved examples, local rules and user additions retain distinct provenance.
