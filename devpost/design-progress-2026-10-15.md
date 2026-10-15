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

## Source-inspection return path: v0.18.0

Verified starting state: public main `890f6530fa2d05a7b8ec6b21914f86289bfb479d`, Sites source `a3756b9614dd913d196a5663887151a07cfdebec`, shared tree `3e9692c6fade65f2a92a309bbaaba60108fab117`. The preceding private deployment succeeded as `appgdep_6ad0b4c157b88191ac2199ee09867567` for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_d94000edb90c8191b95570078fc835b2`. Current public main, recent commits, open PRs, the source checkout and this record were checked before work. No open PR or observable concurrent writer was found. The existing source was synchronized with the supported Sites helper. Access remains custom owner-only, with no additional visitors.

### Problem and change

Inspecting evidence moved focus to the original notice but left no direct route back to the action or source flag. The small highlight count also sat below the entire source, making it harder to find with long notices.

The source now has a compact inspection bar above the notice, styled within the existing paper/forest system. It shows the number of exact matches and, for actions, the originating action number and wording. A contextual Back to action or Back to flagged passage control returns to the actual clicked evidence button when it is still mounted. This includes date and additional-evidence buttons inside open details. The trigger is taken from the click event rather than the browser's possibly unrelated active element.

If a view hides the action while its evidence is being inspected, returning reveals it before restoring focus. If the original button was removed, existing guided navigation opens the current action or flag instead. Stale action and flag identities are rejected separately. Clearing highlights also returns to review rather than leaving focus on a removed control. Back retains the exact highlight for reference and manual excerpt reuse. Source replacement and rescanning clear the return context.

The inspection bar is sticky within the source area, wraps its controls, truncates only the contextual action label and is excluded from printing. All original source text, matching excerpts, warning content and review gates remain unchanged. Return navigation is presentation state only, excluded from review files, recovery snapshots, save-change detection and exports. No new runtime dependency or persistence was added.

### Executed checks and limits

- All 178 automated tests passed. Two new behavioral tests cover reveal-before-return, stable visible views, stale identities and distinct action/flag namespaces.
- TypeScript checking passed.
- The supported static build, all 14 fresh synthetic notice checks and the source-hashed production-domain rehearsal passed. The fingerprint list includes the new inspection component and the new library helper.
- Six actual SSR states passed structural checks: initial workspace, action return, repeated matches, long action label, flag return and a missing/stale origin. Checks covered unique IDs, label/description targets, contextual control names, singular/plural match wording, no inspection controls before selection and initial unchecked approvals. Rendering the bar independently does not exercise the workspace focus effects.
- Two specified new foreground/background pairs calculated at 7.60:1 and 9.24:1 contrast. These calculations are not a complete accessibility audit.
- The required control-browser skill remains unavailable. No browser rendering, actual sticky positioning, viewport fit, focus restoration, keyboard interaction, screen-reader behavior or real download was tested. Those remain explicit review items.

The checked portable archive is regenerated from the final source/build/rehearsal state and its member hashes verified. Exact final source, public commit, saved-version and deployment identities are provided by the publication results and public commit metadata, not inferred from a URL. Submission, personal declarations, entry copy, video and account work remain untouched.

Next useful task: with a supported browser, test long-source round trips from action evidence, date evidence and source flags at desktop/mobile widths. Also check hidden-view return and a source flag whose card changes while inspecting. If browser access remains unavailable, inspect actual recoverable file/error and source-flag form flows for a bounded defect; do not add another theme or broaden extraction.

### Verified publication receipt

The v0.18.0 application publication completed on October 15, 2026 at 12:04 UTC. Public main was advanced without force from its expected previous head and reread successfully as `93cd2a0458ce19259269afec0ea7b07712583c45`. Its complete 206-file tree `45bd78a2bc05bea84d985f1c5fa15e8f7cf78e7d` exactly matched Sites source commit `46fba035a7e900516eeb8243f24105682db62ddb`. All 14 changed blobs were hash-verified before advancing main.

Private deployment `appgdep_6ad0c145d84081918bfb72164c126c6f` returned succeeded for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_410d7c979db8819186c9b0b2a22f445f` at the existing preview URL. Application SHA-256: `1c8a049b2d70c59d3a3cc52a457f0dc36acea8889ee031e616170526fd9d64b6`. Portable archive SHA-256: `bc81fff6f9bb3c67f9d52102365c99e45bb426683d02fb6b1ee44ff8af26b8e3`. Post-publication read-only verification confirmed 34 archive members, all recorded member/source hashes, identical built and committed HTML, and a clean checkout.

This receipt is a documentation-only follow-up to that returned publication. It does not alter the application, rehearsal inputs or portable archive. Its own source/public identities are in the corresponding commit metadata; the application identities above refer to the already verified feature publication.

## Clear, actionable review-file feedback: v0.19.0

Verified starting state: public main `bf3913fb60cda8cab98eb8ba60da480ab84d563d`, Sites source `ce43ceb6681fe3faad12ac521bd1d9966e96558d`, shared tree `653cb7ef2134ae9f56f138e5ca3ddc746db1674b`. The previous documentation follow-up was published privately as `appgdep_6ad0c1cf27a881919e4245b8646dd560` for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_4ca25010d94c819192a474ec925bbcbe`. Current main, recent commits, open PRs, repository instructions and actual local source were checked. There were no open PRs, AGENTS.md files, uncommitted changes or observable competing writer. The existing source was opened and synchronized through the Sites helper. The current audience is custom owner-only, with no additional visitors.

### Reproduced source defect and change

The existing save failure handler set only an error string and left the previous success message intact. Both could therefore render together after a failed save. A successful download message also continued to describe the current version after later edits, although that previous request could not include them. These state/render paths were reproduced by source inspection; no browser execution is claimed.

One discriminated feedback state now represents a file error, a download request, an opened file or a recovered workspace. A new operation clears previous feedback, and a failure replaces it instead of leaving competing messages. A failed save attempt also clears the previous requested-download indicator without changing the saved-content baseline.

The feedback panel uses explicit headings and preserved validation messages. An opening error offers Choose another review file and explains that the expected file is the app's review JSON, not its checklist or calendar. Saving errors offer Try download again when the existing save gates permit it. Continue reviewing moves to the action heading. Dismiss and retry handlers move focus to stable toolbar controls when the temporary feedback controls may disappear. Error copy uses an alert region and other copy uses a status region; the action buttons remain outside the live copy.

A download request stores only an in-memory content comparison stamp. If notice content, actions, approvals or other committed review data change, its panel explicitly says the earlier request does not include these changes and offers Download current review. An exact return to the requested content is treated as current again. No browser save is claimed to have succeeded: the user must still confirm the file reached their device. Review-file exclusions, fresh-review gates and the separate recovery-copy boundary remain visible. The existing paper/forest design is preserved with restrained error and changed-content treatments, wrapping controls and print exclusion.

No extraction, serializer, validation, approval, date, import trust or recovery trust logic changed. No runtime network request, browser persistence, dependency, account or submission work was added.

### Executed checks and limits

- All 180 automated tests passed, including two new behavioral checks for current versus changed-content requests, real title/approval/note edits, exact-content reversion, operation-specific recovery actions and unmodified validation messages.
- TypeScript checking and `git diff --check` passed.
- The supported static build, all 14 fresh synthetic notice scans and the source-hashed production-domain rehearsal passed. The rehearsal fingerprint includes the new feedback component and library helper.
- Nine actual SSR markup states passed structural checks: initial workspace, open error, save error, current request, changed-content request, opened review, recovered workspace and both disabled retry variants. Checks included unique IDs, named controls, valid labels/descriptions, one appropriate live-copy region, retry presence/disabled states, no initial feedback, unchanged source text and initial unchecked approvals.
- Three specified text/background pairs calculated at 7.40:1, 7.68:1 and 5.93:1 contrast. These are selected calculations, not a full accessibility audit.
- The Sites skill requires skipping browser QA because the required control-browser skill remains unavailable. Actual viewport fit, focus restoration, live announcements, file selection and operating-system downloads remain unverified. No screenshots or user studies were fabricated.

The portable archive is regenerated and its member hashes verified from the final checked source/build/rehearsal state. Publication receipts record returned identities separately; do not infer them from the preview URL. Submission and video work remain reserved for Nolan.

Next useful task: when supported browser QA becomes available, test invalid review files, a failed download, editing after a requested download, retry/dismiss focus and mobile wrapping. Otherwise inspect the actual source-flag decision form's error and cancellation paths for a concrete usability issue. Keep notice review central and preserve the existing visual direction.

### Verified publication receipt

The v0.19.0 application publication completed on October 15, 2026 at 13:07 UTC. Public main was advanced without force from its expected head and reread as `9b516725a8638c41f468cdea0895763b608139f2`. All 14 changed blobs and the complete 209-file tree `2d276e2a2b4656b253334b23f05d6e04871b7797` were hash-matched to Sites source `e544b11e8c294672928d39bd06b382c433240d78` before main advanced.

Private deployment `appgdep_6ad0d0078d408191af3ba6a6b5a52a4b` returned succeeded for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_57caa8fad2c48191843b5ca6edd67f68` at the existing preview URL. Application SHA-256: `a79b82288c15324fd0c5aa859044adc677499643484bd7c6679810f466b4f809`. Portable archive SHA-256: `762565010c9fe65a7d354280b43d9b4c0dddcb26041bc3363a3455424d226c6d`. Read-only post-publication checks verified identical built/committed HTML, current rehearsal source fingerprints and all 34 archive members.

This receipt is a documentation-only follow-up. Application, rehearsal inputs and portable archive are unchanged. Its own source/public identities are recorded in the corresponding commit metadata; the identities above identify the verified feature publication.

## Guided source-flag forms: v0.20.0

Verified starting state: public main `5214f9338098bc6336d7a33e6164c7e36b974e86`, Sites source `4534e42478d00017d4f9f8511fe4a1759841ed85`, shared tree `0e0b2fc9b9897acded149b122e95dfc30e132f99`. The previous documentation follow-up succeeded privately as deployment `appgdep_6ad0d07464e48191969f991273c90602` for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_96fd01284ee4819188441deeac1b11b9`. Current public main, recent commits, open PRs, repository instructions, this record and actual local source were read before choosing the change. No AGENTS.md file, open PR, dirty checkout or observable concurrent writer was found. Source was reopened through the Sites helper. Access remains custom owner-only with no additional visitors.

### Source-inspected problem and change

The source-flag editor could disable its submit button without explaining the missing requirement. When no active action with valid evidence existed, its default Link to an existing action choice led to an empty selector and an unexplained disabled button. Opening and cancelling an editor also had no explicit focus path. These are source-inspected UI paths, not observed browser-test results.

The editor now has a clear fieldset legend, explicit label/input associations and readable 14-pixel field text. A visible readiness message explains the first unmet requirement using the same existing UI gates: action wording, exact bounded excerpt, eligible link, explanation or action capacity. It changes to a separate-approval reminder when the form is ready. When there is no eligible link, a local hint explains how to create an action from the passage or choose another decision. At the 20-action cap, visible copy explains why creating another action is unavailable, including the fact that omitted actions count toward the cap.

Create and decision controls expose expanded state. Opening an editor focuses its first field; cancelling or closing it returns to the initiating control. Successful recording keeps the existing queue or newly created action navigation rather than applying cancellation focus. Exact domain error messages remain visible in an alert. Full overlong pasted excerpts remain in the field instead of being truncated. The source passage, warning, conditions and distinct action/date approval boundaries stay intact.

The editor also states its existing draft limit: changing to another passage discards unfinished entries. No cross-passage storage or persistence was added. Existing draft prefilling and committed decision behavior are preserved. Form readiness is a presentation helper; recording and creation still go through the unchanged domain validators. No extraction, approval, date, export, import or recovery scope was expanded.

### Executed checks and limits

- All 183 automated tests passed. Three new behavioral checks exercise absent/invalid link candidates, clarification without an action, exact/oversized/missing excerpts, missing wording/explanation, the action cap and parity with actual recording/creation gates. They verify that recording does not grant action approval or date confirmation and does not mutate linked actions.
- TypeScript and `git diff --check` passed.
- The supported static build, all 14 fresh synthetic scans and the source-hashed production-domain rehearsal passed. The rehearsal fingerprints include the extracted editor component and its presentation helper.
- Twelve actual SSR markup states passed structural checks: initial workspace, empty create form, mismatched excerpt, oversized excerpt, ready creation, missing link, no candidates, ready link, clarification, not-an-obligation, exact domain error and disabled form. Checks included unique IDs, fieldset legend, explicit labels, valid description targets, readiness/disabled parity, preserved full paste, source warnings and initial unchecked approvals. These states do not execute the focus effects.
- The existing paper/forest form styling and previously checked text/background treatments were reused. No new illustration, remote font or dependency was introduced.
- The Sites skill requires skipping browser QA because the required control-browser skill remains unavailable. Actual mobile fit, form opening/cancellation focus, live-region announcements, keyboard and assistive-technology behavior remain unverified. No browser screenshots or user testing are claimed.

The portable archive is regenerated and verified against the final checked source, standalone HTML and rehearsal hashes. The publication receipt records returned identities separately. Submission, video, personal declarations and account work remain untouched.

Next useful task: when supported browser QA is available, test the source editor's first-field focus, cancel return, error announcement, empty eligible-link state and long excerpts at narrow widths. Otherwise inspect the real export-preview exclusion and clarification flow for one concrete usability defect; preserve the current design and conservative review gates.

### Verified publication receipt

The v0.20.0 application publication completed on October 15, 2026 at 14:02 UTC. Public main was advanced without force from its expected head and reread as `715f303fceb1d9301ed46d472ad05f04e8ad06f8`. All 13 changed blobs and the complete 212-file tree `ac437de7e4dc1f0bd448b54b6c6da40f76943460` were hash-matched to Sites source `fb7b2ecdf5753b0fabb85c04e78d631876112b81` before main advanced.

Private deployment `appgdep_6ad0dcec9a3c819193e4ad28254cd3ae` returned succeeded for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_d1def61d08d48191b810bc10578ea01a` at the existing preview URL. Application SHA-256: `5770d78c43ecf4d1d8e751b7c124cf157eb9b2f4631bffd74ea3b31b84176008`. Portable archive SHA-256: `f0ef7c5bc9289890d8b3b2ef7106b6d6f287be59d0bed00b76f22718597ebfc0`. Read-only post-publication checks verified identical built/committed HTML, current rehearsal fingerprints and all 34 archive members.

This receipt is a documentation-only follow-up. Application, rehearsal inputs and portable archive are unchanged. Its own source/public identities are recorded in the corresponding commit metadata; the identities above identify the verified feature publication.

## In-dialog download feedback: v0.21.0

Verified starting state: public main `6d5d9c704ab4e2187b5007c64fc0852b02dac8c1`, Sites source `24b5941525fe846e5756ac59fe803a85b39f26c2`, shared tree `06ccdd0fa645ecf071a7160f9bc2f81f2872cf13`. The previous documentation follow-up succeeded privately as deployment `appgdep_6ad0dd55f66c8191aec16f5aa633640d` for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_65b8992cbf7c8191a7d22a8760bb0dda`. Current main, recent commits, open PRs, repository instructions, this record and actual source were read. No AGENTS.md file, open PR, dirty checkout or observable concurrent writer was found. Source was opened and synchronized through the Sites helper. Audience remains custom owner-only with no additional visitors.

### Source-inspected problem and change

The checklist/calendar preview and clarification dialog requested downloads through callbacks that updated a workspace announcement outside the open modal. Neither dialog showed a local request result, and exceptions from the browser-download callback were not caught there. The workspace wording also said Downloaded although a browser request cannot verify a filesystem save. These paths were identified from actual source, not from browser execution.

Both dialogs now use a small shared request boundary and an in-dialog feedback region. It reports a browser download request, names the requested task/entry/question count and explicitly asks the user to confirm the file saved. Browser callback exceptions produce local, preserved error details with a retry instruction. Review data and question drafts remain available. Empty content or nonpositive counts are rejected before invoking the callback, supplementing the existing disabled-button gates without changing export eligibility.

The request captures exact format, serialized content and count. If the format or question content/selection changes later, feedback says the earlier request covers a different preview and asks for a fresh check and request. Returning to exactly the requested output restores the current-request message. The component keeps an initially empty live region within the modal body, with atomic status/error copy. A request scrolls that region into view without moving focus away from the retained Download control. Actual scrolling and announcements still require browser verification.

The fixed dialog header/footer and existing source/context disclosures remain. Request feedback is transient modal state, not part of review files, recovery data or save tracking. The serializers, source evidence, approval/date gates, question selection and offline download mechanism are unchanged. No network access, dependency, persistence, account or submission work was added.

### Executed checks and limits

- All 186 automated tests passed. Three new behavioral tests verify exact serialized-content forwarding once, isolated request snapshots, preserved action trust, caught callback exceptions, empty-selection rejection and stale-output detection across format/content/count changes and exact reversion.
- TypeScript and `git diff --check` passed.
- The supported static build, all 14 fresh synthetic scans and the source-hashed production-domain rehearsal passed. The rehearsal fingerprints include the new feedback component and request helper.
- Ten actual SSR markup states passed structural checks: approved/unapproved preview, unselected clarification sheet, empty feedback, three format-specific requested states, request error, changed format and changed questions. Checks covered unique IDs, valid labels/descriptions, named controls, live regions inside the actual dialog body, retained disabled-download gates, unselected initial questions, local error/retry copy and request-versus-save wording. Requested feedback states were synthetic, not actual browser downloads.
- Existing paper/forest status, changed-content and error colors were reused from previously calculated contrast pairs. No visual rendering or complete accessibility audit is claimed.
- The Sites skill requires skipping browser QA because the required control-browser skill remains unavailable. Native downloads, dialog scrolling/focus, screen-reader announcements and actual viewport fit remain unverified. No screenshots or user tests were fabricated.

The portable archive is regenerated and verified against the final source, standalone HTML and rehearsal hashes. Returned publication identities are recorded in the publication receipt. Submission and video work remain untouched.

Next useful task: use supported browser QA when available to test request/error announcements and scroll positioning inside both dialogs, unchanged download-button focus and edited-question stale feedback. Without that capability, inspect actual first-use, manual-action and empty-source paths for a concrete defect rather than adding more interface sections.

### Verified publication receipt

The v0.21.0 application publication completed on October 15, 2026 at 15:02 UTC. Public main was advanced without force from its expected head and reread as `28c7a07d73510d0ce55134140e07621c76a9906f`. All 15 changed blobs and the complete 215-file tree `35b48a49c0582c831e2c39f51ec21d4e6d93da09` were hash-matched to Sites source `62f556356d054926f94d20bcbe6d100ce5fafdbb` before main advanced.

Private deployment `appgdep_6ad0eafa7474819182057be58857f308` returned succeeded for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_900052f534188191bcfd8b46450e6ff5` at the existing preview URL. Application SHA-256: `4dbce6349bcadbca234c56bdc901e2bb3107018f5ae5742979394229b902fa3c`. Portable archive SHA-256: `bbd89b9eaeca0e84d68b465dc963e133de8924046d95931ded8cc3c0b423be96`. Read-only post-publication checks verified identical built/committed HTML, current rehearsal fingerprints and all 34 archive members.

This receipt is a documentation-only follow-up. Application, rehearsal inputs and portable archive are unchanged. Its own source/public identities are recorded in the corresponding commit metadata; the identities above identify the verified feature publication.

## Optional calendar disclosure: v0.22.0

Verified starting state: public main `5ab1c4a3d9c83d0d343a29d7439aea56e989ff5e`, Sites source `d58f65229830073769298ac8ef7511cd63602a63`, shared tree `7481be717b300d7b73d06b5faf709294da34ded8`. The previous documentation follow-up succeeded privately as deployment `appgdep_6ad0eb785d5081918b76c7b1dc72a15b` for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_06eb0ba29f048191ae7eb44ce85302af`. Current main, recent commits, open PRs, repository instructions, this record and actual source were read. No AGENTS.md file, open PR, dirty checkout or observable concurrent writer was found. Existing source was synchronized through the Sites helper. Audience remains custom owner-only with no additional visitors.

### Source-inspected problem and change

Review details placed the entire optional calendar form in the main wording/source review flow: date, cutoff controls, offset, validation help, confirmation and provenance. That made a checklist-only review work through optional form content before reaching the remaining warnings and approval area. The existing interface already says calendar export is optional; its hierarchy now reflects that distinction.

Calendar controls are grouped inside a native Optional calendar details disclosure. The summary always states whether details need checking, are ready for a date check or are confirmed. Oversized time/offset drafts have an explicit save-blocking message in the summary even when collapsed. No date is inferred or confirmed by opening the disclosure.

The action's existing deadline summary, conditions, source/date quotations and original review flags remain outside the optional calendar control group. Action approval remains separate. Guided date-review links open both action details and this calendar disclosure before the existing date-field focus runs. Ordinary wording review does not force the calendar open. The disclosure state is held with the card, so existing stable action views do not replace it or serialize it into review files.

The existing date/time/offset validators, field IDs, full overlong drafts, source-required cutoff protection, confirmation gates, provenance copy and edit invalidation were retained in the extracted component. Confirmation still clears action approval. Collapsing uses native details behavior rather than removing inputs from the DOM. No extraction, export or trust logic changed, and no new dependency, runtime network request or persistence was added.

### Executed checks and limits

- All 186 existing tests passed. No test count increase was needed for this presentation refactor.
- TypeScript and `git diff --check` passed.
- The supported static build, all 14 fresh synthetic scans and the source-hashed production-domain rehearsal passed. The rehearsal fingerprint includes the extracted calendar component.
- Nine actual SSR markup states passed structural checks: initial workspace, closed/open undated controls, ready dated controls, closed confirmed controls, timed controls, invalid offset, closed oversized draft and omitted action. Checks included unique IDs, valid labels/descriptions, native summary/open state, retained input values, confirmation gates, optionality wording and initial unchecked approvals.
- Temporary direct component-handler checks verified that toggling calls only the presentation callback, editing a date still clears approval and date confirmation, confirming a date still clears approval, and the original action object remains unchanged. These checks invoke component props, not DOM events in a browser.
- Existing paper/forest form styling and colors were reused. The Sites skill requires skipping browser QA because the required control-browser skill remains unavailable. Native disclosure interaction, guided date focus, screen-reader behavior, viewport fit and actual appearance remain unverified. No screenshots or browser test results are claimed.

The portable archive is regenerated and verified against the final source, standalone HTML and rehearsal hashes. Returned publication identities are recorded separately. Submission, video and account work remain untouched.

Next useful task: with supported browser QA, verify the shorter checklist-only review, native summary keyboard behavior, guided date opening/focus, hidden-view return and oversized-draft warning. If browser access remains unavailable, review the existing interface for a reproduced issue; do not manufacture another release just to fill time.

### Verified publication receipt

The v0.22.0 application publication completed on October 15, 2026 at 16:00 UTC. Public main was advanced without force from its expected head and reread as `d1bc150b910f2750d9e3ad372f2729dd3773a324`. All 10 changed blobs and the complete 216-file tree `7e829a293e9a030edd23d1bc46d41b37f6154b86` were hash-matched to Sites source `2037aac37bbf94e43551c254ed461e1f22c09a01` before main advanced.

Private deployment `appgdep_6ad0f8acd01c819194685dfd56998089` returned succeeded for saved version `appgprj_6ad019944618819198aced54007cfee8~appgver_6c7cfa3099988191959984668c73bf4c` at the existing preview URL. Application SHA-256: `3571e639377b7c920a9d7a052154b171265cb6253078cf0ff7d74f1c510379b8`. Portable archive SHA-256: `ca5d0e710cc9a443b180cbbed73f3a3855618464d6a6fa601e0d09db43b42549`. Read-only post-publication checks verified identical built/committed HTML, current rehearsal fingerprints and all 34 archive members.

This receipt is a documentation-only follow-up. Application, rehearsal inputs and portable archive are unchanged. Its own source/public identities are recorded in the corresponding commit metadata; the identities above identify the verified feature publication.
