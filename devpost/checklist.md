---
doc: checklist
status: approved
---
# Build Checklist

Build mode: fast, based on the learner's explicit request to delegate implementation. One coherent small-app slice; hands-on review follows the runnable deployment. No hands-on activity is presumed completed.

## Slices

- [x] **1. Review a notice with evidence, resolve dates, approve and export**
  Becomes usable: The complete source-to-reviewed-receipt workflow, with clearly labeled walkthroughs and a live endpoint that reports configuration honestly.
  Why now: The evidence/uncertainty kernel appears in the first usable build; exports close the same small loop.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Features and Behavior`
  Spec ref: `spec.md > Components`, `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: Implement the interface, validator, live endpoint, synthetic examples, review rules and local downloads.
  Verify (mechanical): Run built-in contract/export/API tests, TypeScript, production build and supported browser QA when available. Live model verification remains unchecked until a real service call succeeds.
  Learner check: Open the hosted app, try the sample and a fresh notice, inspect evidence, resolve a date and export; report what is confusing or broken.
  Commit: `Build source-linked notice review and approved exports`

## Hands-on Checkpoints
- [ ] Early usable behavior explored, combined with final review for this small integrated build
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review
- [ ] Live model extraction verified on fresh source text
- [ ] Final review complete: feedback resolved and learner confirms ready to ship

## Code Tour and App Map
- [ ] Learning activity complete: trace a deadline from source through validation to export
- [ ] Optional edit and transfer reflection addressed
- [x] `devpost/app-map.html` generated from finished code, checked and shown

Activity and evidence: 29 automated tests, TypeScript and the production build pass. Implementation checkpoint commit: 777eaa1. Actual learner review remains pending; do not substitute agent tests.
Route and stops: reference-only route in app-map.html: ActionCard, calendarEligible, calendarText. It has not been toured with the learner.
Edit outcome: not yet offered.
Reflection: not yet offered; private answer must stay in the ignored profile.
Activity mode: pending.

## Revisions

- Standard Sites scaffolding was generated separately and copied alongside the installed curriculum because the setup helper requires an empty directory. No application code from another project was reused.
- Selected pnpm from the managed starter and retained the unused npm lock outside active inputs.
- Independent review added a missed-cutoff control and identical correction provenance in both download formats; regression tests cover both.
- Browser control is unavailable, so managed preview and browser QA were skipped as required by the hosting workflow. Live inference remains unverified.
