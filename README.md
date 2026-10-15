# Action Receipt

Review one notice with its source evidence, clarify dates, and export only actions you approve. Built with AI coding assistance and the official Devpost Learn Skill Pack. The finished app uses local English text rules and ordinary browser code, with no runtime AI model.

## Use without installation or payment

Open the [finished app file](https://github.com/nolankido/action-receipt/blob/main/release/action-receipt.html), select **Download raw file**, save it as `action-receipt.html`, and open it in a current desktop browser. A [direct download](https://raw.githubusercontent.com/nolankido/action-receipt/main/release/action-receipt.html) is also available. Download the HTML itself, not the GitHub source-view page.

The file contains its JavaScript, styles, icons and dependency license notices. It runs from a local file without a server, network connection, account, API key, credits or model download. No paid hosting is required. The [judge guide](devpost/judge-guide.md) gives exact review steps and expected exports.

On launch, the actual local rules scan a short, explicitly invented notice. Review three proposals, repair the missed consent instruction from its exact quotation, and keep an ambiguous date unresolved. Nothing starts approved. Extra saved walkthroughs and a harder fresh-rule notice are behind **More practice** below the workspace. **Download review file** and **Open review file** are together above the source and actions.

The interface keeps the paper-and-forest visual direction with a consistent type scale, stronger text contrast and quieter status surfaces. Three section controls move to the original notice, action review or download preview without approving anything. Action approval and optional calendar readiness have separate labels. Actions use the page scroll; the source stays within reach in its own bounded pane on wide screens, with a single-column layout on smaller screens. Download and clarification dialogs keep their header and footer outside the scrolling contents. Supported browser checks on the owner-authenticated production app verified that two successive scans leave exactly one source-review queue and one Create action control, and that the consent-action repair works. This is a focused agent check, not a complete accessibility review or participant study.

Action views let you work with **All actions**, **Needs review**, **Approved** or **Omitted**, with counts based on actual checklist eligibility. A selected view keeps its actions in place while you edit or approve them; **Refresh view** applies their new statuses when you are ready. Hidden cards remain mounted so their open details are retained. Guided review, source links and excluded-download links reveal their requested action before focusing it. Views change no approvals, source decisions, saved receipt content or download eligibility. Downloads always use the full receipt, including approved actions outside the selected view. Opening, rescanning or replacing a notice starts with All actions.

The optional hosted review site is https://action-receipt.huzzahoptimistically.chatgpt.site. It retains the owner's existing private audience. The downloadable app in this public repository is the judge-access route and does not depend on that site.

## Prepared entry pack

[Finish the entry](devpost/submission/READY-TO-SUBMIT.md) lists the remaining final-terms and submission steps. Devpost draft `1239349-action-receipt` has saved project fields and its cover; four of five steps are complete. Additional information is complete under the entrant's direction. The [public Vimeo demonstration](https://vimeo.com/1236353555) is saved in the draft. The finalization page has no missing-field warnings; its binding terms checkbox remains unchecked. Run `npm run check:submission` to detect stale package/source evidence and list recorded entry blockers. A verified preparation pack is not a completed entry.

[Download the submission-preparation ZIP](https://github.com/nolankido/action-receipt/blob/main/release/action-receipt-submission.zip), extract it, and open `START-HERE.html`. It includes the runnable offline app, judge instructions, generated planning documents, original 3:2 gallery cover, project facts, AI-assisted factual draft and planned silent-demo captions. The [asset guide](devpost/submission/README.md) records authorship and remaining account work. This is a preparation pack, not a submitted entry or completed video.

The entrant explicitly delegated drafting after the Learn pack's learner-authorship guidance was explained. Draft text discloses AI assistance and includes no invented personal learning, participant results or eligibility answers. The existing Devpost account is authenticated, the current form has been inspected, and its saved Additional info answers remain in Devpost rather than this public repository. A **158.01-second edited browser demonstration** uses 14 genuine browser screenshots arranged into 13 scenes, with disclosed offline computer narration and 33 measured caption cues. It is an edited sequence, not continuous screen recording. [Watch on Vimeo](https://vimeo.com/1236353555); [provenance](devpost/submission/browser-demo-manifest.json) and [captions](devpost/submission/browser-demo-captions.srt) are included. Vimeo Public and embeddable settings plus active playback were verified in the owner-authenticated browser; an independent signed-out check is not claimed. The video link is saved in Devpost; final binding terms and submission remain pending. No face or voice is required by the published rules.

To reproduce the archive after the normal build and `npm run rehearse:demo`, run `python scripts/package-submission.py`. It uses the standard library, checks current rehearsal hashes, validates caption timing and cover dimensions, packages an explicit allowlist, and verifies every archive member. The cover PNG was rendered from its editable SVG with an already-installed renderer. No image API or paid editor was used.

A separate **2:42 narrated technical walkthrough video** has been produced from actual domain-function outputs, with offline computer narration, measured spoken captions and scripted-review disclosure visible throughout. [Video provenance and reproduction](devpost/submission/README.md#technical-video-created) and [captured data](devpost/demo/technical-video-domain-data.json) are public. It is not browser-interface footage or the current [edited browser demonstration](https://vimeo.com/1236353555). An earlier local-file browser block was respected; the completed production-browser capture is separate. The technical video itself was provided separately, while the ZIP includes its manifest and captions.

## What the local rules do

- Keep complete pasted notices and supporting excerpts visible when they exceed processing limits. Show the exact notice overage, block scanning/manual additions/review-file saving until the source fits, and require deliberate shortening. Evidence excerpts above 1,200 characters stay visible but cannot create an action. Nothing is silently cut to fit.
- Recognize a bounded set of English action words such as register, pay, submit, upload, bring and email.
- Preserve exact supporting passages and visible qualifications, including complete exception wording such as “except if” and prerequisites such as “only after.” Conditions and exceptions are labeled on action cards and associated with their approval control.
- Keep both branches of recognized alternative or joined instructions, including “or” and “&”. Flag them for manual splitting or correction without assigning a shared deadline automatically. The rules remain bounded and can miss other phrasing.
- Show a source-linked review list for unlinked dates, unsupported obligations, cancellations and skipped passages. The manual form can reuse a highlighted quote. The list is bounded at 80 entries and reports overflow; it is not an exhaustive source review.
- Guide review of each identified flag. Create a missed action from its exact passage, link an existing action, mark it as not an obligation, or record what needs clarification. Explanations and original flags stay in the receipt. Links need rechecking after action edits; approval and date checks remain separate.
- Follow the next-step panel to the exact source flag or action that needs review, then to download preview. Recorded clarification requests stay unresolved while you continue reviewing other items. Calendar dates are optional; guidance never approves anything or asks you to guess a date.
- Propose complete dates only from the actual action clause with a recognized temporal link. Dates/times inside conditions and separate clauses are not borrowed as deadlines. Conflicting clocks/offsets need manual clarification. Relative dates, missing years, ambiguous numeric formats, several dates and uncertain roles require review.
- Flag impossible or unsupported written dates and mixed numeric date formats. A bad deadline cannot borrow a later event date from the same clause, and an extended date cannot contribute only its valid-looking prefix. Date problems inside conditions stay separate from an otherwise valid action deadline. Exact passages remain inspectable.
- Understand full or common abbreviated English month names with four-digit years, such as `Nov. 5, 2032` and `5 Nov 2032`. Keep exact source quotations and check immediately attached weekdays. A weekday/date contradiction stays unresolved with a source-linked flag.
- Reject a valid-looking prefix of an unsupported UTC/GMT offset. Seconds, decimal fractions, appended text, incomplete zone mentions and conflicting offsets remain unresolved. A valid offset cannot hide another malformed zone mention in the same cutoff context.
- Recognize explicit 24-hour `HH:MM` cutoffs as proposals, alongside AM/PM and noon. Keep malformed clock-like text timed and unresolved so it cannot silently become an all-day marker. Seconds, fractional precision, bare single-digit clocks, midnight wording and mixed/conflicting clock formats need clarification. Never infer a UTC offset.
- Explain every missing or invalid calendar detail next to its controls. The same validation drives date confirmation and calendar exclusion. Preserve full pasted UTC-offset values, including unsupported formats, with no six-character clipping. Review files can retain incomplete or invalid time/offset drafts up to 64 characters; they remain ineligible for calendar export.
- Show the cutoff time and explicit UTC offset together on action cards, with unresolved fields and unconfirmed dates labeled. Keyboard source-inspection links move focus to the highlighted quotation. Action/date checkboxes identify their particular action; small-screen form text stays readable.
- See whether committed review changes or a separate recovery copy still need a download. The review-file button stays visible. The browser can warn before leaving changed work; this is a best-effort warning, not automatic recovery. A download request does not prove the browser saved a file. Clean examples do not overwrite an unsaved recovery copy.
- Require separate action approval and date confirmation. Timed cutoffs also require a complete time and explicit UTC offset.
- Prepare an optional clarification sheet from incomplete date/time details and source flags explicitly marked as needing clarification. Edit and check each question, inspect exact source quotes and download only selected questions with their context. Clear but unconfirmed dates stay in normal review. No question is sent, no date is inferred and no action is approved. Question edits and selections are discarded when the sheet closes and are not saved in review files.
- Recover a replaced review from one temporary copy in this tab. Source edits, rescans, sample/practice switches and valid review-file opens keep the outgoing work. Continuous typing and a first scan of unreviewed replacement text preserve the pre-edit copy. Restoring clears all approvals, date confirmations and source-decision checks, while retaining committed edits, source, IDs and provenance. The outgoing workspace becomes the next recovery copy. Discard it explicitly; refresh/tab closure clears it. Downloads exclude the recovery copy and unfinished form entries are not recovered.
- Save a local review file and reopen it later with source, edits, omissions and context intact. Opening resets every action approval and date confirmation; imported interpretations stay visibly unverified.
- Export approved checklists and eligible calendar entries, retaining source quotations, warnings, notice-level notes, flagged source context, mode and user corrections. Source-review flags stay context; they do not create extra tasks or calendar events.
- Preview downloads before saving: see included actions, reasons for exclusions and the exact Markdown or iCalendar content. The preview uses the same eligibility rules and file generators as the downloads and changes no approvals. Each excluded item links back to its action or calendar-date fields.

These are text patterns, not semantic AI. They can miss unfamiliar wording, implicit instructions, cross-sentence context or cancellations. Read the complete source. Use **Add an action from the source** for omissions. A quotation match confirms presence, not interpretation or completeness. Twenty actions per receipt; 30 to 15,000 input characters.

Three synthetic walkthroughs have saved example results and are labeled accordingly. **Find actions locally** runs the actual rule engine on the current text, including edited or completely new notices. It never looks up sample results. Fresh rule proposals, saved examples and user additions remain distinct in exports. Rescanning explicitly clears the current review; edits also clear approvals.

**Restart short practice** scans the initial invented architecture-trip notice again with the actual rules. It exposes separate registration/payment deadlines, a missed consent instruction, a conditional relative date and a waived fee. After deliberate review, its expected exports are four checklist tasks and only two calendar entries. **Try harder notice** under **More practice** adds a weekday/date conflict. Source decisions never approve actions, assign dates or certify complete extraction. Counts cover identified flags only.

## Data handling

Notices and review decisions stay in browser memory, including one temporary recovery copy of replaced work. Refreshing clears both. Restoring the copy requires fresh action/date checks and source-decision rechecking; the outgoing workspace becomes the next copy. It can be discarded and is excluded from all downloads. There is no persistent history. A visible change status compares committed review content with initial/example/file-open state or the last review-file download request. Viewing source, opening a panel and receipt timestamp/ID updates do not count as review changes. The browser warning is attached only while the current review or recovery copy has unsaved changes, and cannot prevent every kind of closure. Download requests cannot verify the browser saved the file. Unfinished form entries are excluded. Use **Download review file** to download your work explicitly, then **Open review file** to resume. These JSON files contain the full notice, recorded decision explanations and added actions, including unapproved and omitted items; unfinished form entries are not saved. Opening a valid file replaces the current workspace, requires fresh approvals/date confirmation and marks loaded source decisions as unverified until rechecked. New files use version 2; version 1 remains readable. Current time/offset draft fields can retain up to 64 characters without treating them as valid dates or cutoffs. Older app builds may reject files containing these longer invalid drafts; use the current offline app. The footer displays its version and its download button gives the app a versioned filename. No automatic save or cloud history exists. Files are limited to 1 MB; unsupported versions, invalid structures and unmatched quotations are rejected without replacing current work. Cutoff protection is recomputed from source independently of saved flags.

There is no notice database, analytics, account system or automatic calendar integration. The offline build blocks network connections with a content security policy. Checklist/calendar exports include source quotations, notice notes and flagged passages, including context that is not an approved task; they may contain personal information from a notice. The export panel discloses this content.

## Build and check

For source development, use Node.js 22.13+ and the repository's pnpm version. Downloading the already-built HTML above requires neither.

```sh
npx pnpm@11.25.0 install --frozen-lockfile
npm run dev
npm test
npm run typecheck
node --experimental-strip-types scripts/smoke-local.ts
npm run rehearse:demo
npm run build
```

The build creates `dist/index.html`, `dist/action-receipt.html`, and the identical committed `release/action-receipt.html`. It embeds assets and license notices, rejects external script/style references, and adds `connect-src 'none'`. Source development uses Vite; the published output is static. No GitHub Actions or scheduled jobs are required or added.

Current verification: 186 automated tests, TypeScript and the static build pass. Fourteen fresh synthetic notice checks pass in `devpost/local-smoke.json`. The [synthetic demo rehearsal](devpost/demo/rehearsal.json) runs the production extraction, repair, source decisions, approval/date gates, serializers and review-file parser. It checks the four-task/two-marker outcome, exact quotes, UTC conversion, edit invalidation and fresh trust after reopening, with source and artifact hashes. Its reference files explicitly label every approval as scripted. Reproduce them with `npm run rehearse:demo`.

Supported production-browser checks now verify repeated scanning and consent-action repair after the sibling-key fix. Actual learner review and participant testing remain pending. These checks are not a user study or proof of complete language understanding. The [student trial guide](devpost/usability/facilitator-guide.md), [synthetic notices](devpost/usability/participant-notices.md) and [blank observation template](devpost/usability/observation-template.md) are prepared. No participant sessions or findings are claimed. A small trial is recommended for impact/usability evidence, not required by the contest rules.

## Project structure

- `standalone/`, `vite.static.config.ts`: static React entry and configuration.
- `app/receipt-workspace.tsx`, `app/review-guide.tsx`, `app/source-review-queue.tsx`, `app/export-preview.tsx`, `app/clarification-sheet.tsx`, `app/recovery-banner.tsx`, `app/globals.css`: guided review interface and read-only download preview.
- `lib/local-extraction.ts`: bounded, network-free English text rules.
- `lib/dates.ts`: shared English date patterns and adjacent weekday consistency checks.
- `lib/times.ts`: clock syntax, conservative cutoff detection, explicit offsets and supported UTC conversion range.
- `lib/clarification.ts`: bounded optional question drafts, current-source/context checks and selected-only Markdown export.
- `lib/workspace-recovery.ts`: memory snapshots, replacement policy, re-matched evidence and fresh-review recovery.
- `lib/review-session.ts`, `app/review-save-status.tsx`: memory-only change comparison, visible download status, unsaved recovery-copy handling and browser-leaving warning policy.
- `lib/review-guide.ts`: navigation derived from current review and export eligibility, with clarification kept pending.
- `lib/source-review.ts`: source decisions, manual repair, progress and stale-link checks.
- `lib/receipt.ts`, `lib/export.ts`, `lib/review-file.ts`: evidence, date/review rules, approved exports and explicit local review save/open.
- `lib/samples.ts`: synthetic notices and saved walkthroughs.
- `lib/demo-scenario.ts`: short synthetic launch/recording fixture, always freshly scanned.
- `scripts/rehearse-demo.ts`, `devpost/demo/`: reproducible domain-workflow checks, labeled reference artifacts and a real-recording shot checklist.
- `scripts/build-static.mjs`: self-contained HTML packaging and license preservation.
- `release/action-receipt.html`: runnable distribution.
- `tests/`, `devpost/`: checks, planning, workflow evidence and app map.

The repository retains standard unused Sites/Vinext starter integration and its notices. The active build uses the static entry above. Earlier `devpost/live-*.json` files preserve failed experiments from an abandoned API design; they are historical evidence, not current setup requirements. The API implementation, key template and live-test script were removed when the learner required no new spending. The app cannot use API credits even if a key exists elsewhere.

## Hackathon process

The official Skill Pack was installed and used in Codex. See `devpost/workflow.md`, `skill-pack-evidence.json`, `scope.md`, `prd.md`, `spec.md` and `checklist.md`. The budget-driven revision is documented in `devpost/zero-cost-plan.md`. Reinstall the pack with:

```sh
npx skills add challengepost/learn-ai-basics --all -y
```

The current rules require a working project built with the Skill Pack; no runtime model API requirement is stated. This is our reading of https://learn-ai-basics.devpost.com/rules, not an organizer eligibility ruling. See the [four-criterion readiness audit](devpost/competitive-readiness.md) and [recording checklist](devpost/demo/recording-guide.md). The authenticated Devpost draft contains the saved AI-assisted project fields, cover and entrant-directed Additional info answers. The browser demonstration is published on Vimeo; final binding terms and submission remain incomplete. Actual learner review and learning wrap-up are not certified complete. No completed submission is claimed.

## License

MIT. Dependencies, starter scaffolding and Skill Pack use are disclosed in `THIRD_PARTY_NOTICES.md`. Bundled runtime licenses are embedded in the standalone HTML.
