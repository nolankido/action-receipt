# Action Receipt design work

## Authorized scope

Improve design, user interface and appearance during the nine-hour window ending October 15, 2026 at 08:56:24 Pacific/Honolulu (18:56:24 UTC). Hackathon submission and account work are reserved for the next day. Follow-up sessions are separate scheduled passes, not uninterrupted execution. Check the actual time before changes and publication. At or after the deadline, use read-only verification and report completed work.

Initial public source: `e5b3ae1eb923ae9aa8c9e880f1a203f670e5cae2`, v0.15.0. Use current refs before continuing. This record travels with its source commit; the final publication identity is reported by the source and deployment operations rather than guessed here.

## Initial pass: v0.16.0

The inherited interface had accumulated overlapping CSS overrides, several repeated status summaries, a separate file-opening disclosure and an independently scrolling action list. The first pass consolidates the visual system and the main review path.

- Preserve the existing paper background, forest-green identity and serif introduction. Use one spacing/type system, clearer borders, readable body text and restrained status colors. Use system fonts and existing vector icons with no remote assets.
- Make the introduction more compact and bring the primary new-notice action into clearer focus. Keep the invented practice disclosure prominent; move optional extra walkthroughs below the main workspace.
- Add three ordinary navigation controls for the source, actions and download preview. These describe the current review and move focus; they never grant approval or claim completeness.
- Put explicit review-file opening and downloading together. Keep memory-only saving and recovery limits visible, with the full file behavior in an optional disclosure. Remove the invisible file-input tab stop while preserving its accessible name and visible opening button.
- Use page scrolling for actions. Keep the original source in a bounded sticky pane on wide screens and ordinary stacked flow on narrower screens. Make the source text keyboard-focusable. Source-inspection focus and exact quotations remain intact.
- Separate the action's review badge from its calendar readiness. An undated action can be reviewed for the checklist without its primary badge implying that calendar clarification is mandatory. Calendar problems remain visible with text, dates, times and offsets.
- Keep omitted cards readable and visibly labeled. Conditions, exceptions, source provenance and explicit approval controls stay attached to each action.
- Give export and clarification dialogs a fixed header/footer and a separately scrolling body. Native dialog semantics, names, close controls, exact-content inspection and disabled download gates remain.
- Add consistent focus rings, pressed states for source-view controls, responsive form sizing, reduced-motion treatment and restrained print styling.

No extraction, evidence validation, approval, date, export, import or recovery domain logic changed. No new dependency, browser persistence, runtime network request, paid service, GitHub Action, server cron job or account was added.

## Executed verification

- All 170 existing automated tests passed.
- TypeScript checking passed.
- The supported static build helper passed. The self-contained HTML retains embedded assets and `connect-src 'none'`.
- All 14 fresh synthetic notice checks passed.
- The production-domain rehearsal passed: three proposals, one source-backed repair, four checklist tasks and two calendar markers. Its source hashes were refreshed. Scripted choices remain explicitly labeled.
- A temporary Vite SSR check rendered six synthetic states: initial workspace, unapproved preview, approved preview, clarification sheet, unsaved current work and unsaved recovery work. Structural inspection checked unique IDs, label and description targets, named buttons, unchanged notice text, initially unchecked approvals, disabled download states and dialog header/body/footer placement. This does not execute browser controls or downloads.
- Eleven specified normal-text color/background pairs calculated at 5.03:1 contrast or above. This is a calculation for those pairs, not a complete accessibility audit.
- `git diff --check` passed.

The portable archive was regenerated with 34 members and verified content hashes after the final source/build/rehearsal state. Publication must use that checked state and preserve the current private audience. Record returned commit and deployment identities in the continuation receipt or actual final report; do not infer them from a URL.

## Verification limits

The required control-browser skill is unavailable in this managed Sites environment. The Sites workflow therefore requires skipping browser QA, rather than installing a browser, starting a different preview server or substituting another browser path. No screenshots, browser interaction, measured viewport fit, keyboard navigation, screen-reader checks, actual downloaded-file opening or user testing are claimed. Source inspection and server rendering do not establish those results.

The existing 2:42 technical video predates this redesign and does not show the browser interface. It remains historical supporting material. No Devpost form, video account, personal declaration or submission was changed.

## Continue from actual evidence

1. Read current source, this record and any active work before choosing a change. Preserve this visual direction; do not start another wholesale restyle.
2. If a supported browser becomes available, inspect actual desktop/mobile rendering and keyboard/source/dialog behavior first. Otherwise use honest code/structural checks and state the limit.
3. Review long and mixed-state notices, expanded action fields, pending clarification, imported/recovered work and empty/error views for concrete usability defects. Consider concise filtering or disclosure only when it helps a real review task and preserves focus and state.
4. Keep the offline HTML, rehearsal and distribution archive current. Recheck GitHub refs and preserve concurrent work. Use the existing Sites identity and private audience.
5. Stop writes at the authorized deadline. Consolidate actual progress without claiming that scheduled sessions ran continuously or that incomplete submission work is finished.

## Stable action views: v0.17.0

Verified starting state: public commit `8e9d5519ef7a785d9eb1be483fd7368825fdd655`, Sites source `d96f5a7c772f3b9bd46cd321a8a12653ad7fe14d`, matching tree `375e61cb0a1d4b01323a7f4f3ce969f60c16e73b`. The prior private publication succeeded as deployment `appgdep_6ad0a85f559c8191b9b6a0a59f161974`. No open public PRs or source divergence were present at this pass's start. The current source was reopened through the supported Sites helper after workspace maintenance removed the previous local checkout.

### Problem and change

Longer receipts had no way to concentrate on unchecked actions or revisit omitted ones without working through the full mixed list. The new All actions, Needs review, Approved and Omitted views use counts based on the same checklist eligibility as downloads. An approved undated task stays in Approved; invalid evidence cannot qualify just because a flag says approved.

A selected view holds a stable set of action IDs while the user works. Editing an approved action or checking an unchecked one therefore does not hide the card mid-input. Status counts update immediately and a visible note explains when the view needs refreshing. Refresh view, or selecting a view again, deliberately applies the new membership. Cards remain mounted with the native hidden attribute rather than being unmounted, retaining their open-detail state. No automatic focus jump or approval is introduced by a status change.

The guide, source-action links, excluded-download links and newly added manual actions reveal their target before the existing card-focus effect runs. Opening, rescanning, replacing or recovering a notice resets to All actions. Filter selection is transient presentation state, excluded from review files, recovery snapshots and save-change detection. Exports always examine all actions, and the interface says so beside the view controls. No source flag, approval, date confirmation or receipt content is changed by choosing or refreshing a view.

The existing paper/forest appearance is preserved. Buttons wrap on narrow screens, selected states use both text/counts and pressed semantics, empty views provide a path back to all actions, and the refresh control remains present while a filtered view is active.

### Executed checks and limits

- All 176 automated tests passed, including six new behavioral checks for eligibility partitions, undated/corrupt-evidence cases, stable membership after approval/edit/omission, hidden-target reveal and unchanged receipt/export eligibility.
- TypeScript checking passed.
- The static build, all 14 synthetic notice checks and the production-domain rehearsal passed. The rehearsal fingerprint list now includes the new control component and automatically includes the new view helper.
- Seven actual SSR markup states passed structural checks: full workspace, four mixed-status views, empty Approved and a changed review batch. Checks covered unique IDs, named buttons, label/description targets, pressed states, action-list control targets, current counts, explicit refresh guidance, unchanged notice text and initial unchecked approvals.
- Four specified new text/background pairs calculated between 5.44:1 and 8.26:1 contrast. This is a calculation for those pairs, not a full accessibility audit.
- Browser layout, interaction, keyboard focus, retained native input state and assistive-technology behavior remain unverified. SSR and unit tests do not establish those results. The required browser skill remains unavailable; no alternative browser path was used.

Distribution is regenerated from the checked source. The publication operations and Git commit metadata identify the final source and deployment; a commit must not claim an unreturned deployment result. No submission or account work was performed.

Next useful work: inspect supported browser behavior if that capability becomes available; otherwise review actual long-source navigation, source-flag forms and recoverable error states for a concrete UI defect. Preserve the stable view behavior and shared export gates rather than adding another visual theme or changing extraction scope.
