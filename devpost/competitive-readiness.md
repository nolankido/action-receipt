# Competitive readiness audit

Checked October 15, 2026. Technical assessment, not entrant submission prose or an organizer eligibility decision.

**Assessment: a credible working prototype, but an incomplete entry.** More extraction features are unlikely to close the largest gaps. A clear real demonstration, actual learner use and a specific audience case matter more now. A winning probability or invented judge score would be misleading.

## Rules and entry status

The [official rules](https://learn-ai-basics.devpost.com/rules) control this assessment. The overview currently omits Potential Impact; the rules list four equal criteria. Design is the first tie-breaker. Judges can evaluate only the submitted media and text.

| Requirement | Evidence or remaining work |
| --- | --- |
| New working software created during the contest | New application; standard starter and dependencies disclosed in `THIRD_PARTY_NOTICES.md`. Focused owner-authenticated production-browser checks verify repeated scanning and consent repair after the sibling-key fix. |
| Actual Learn Skill Pack use and generated scope, PRD and spec in the repository | `devpost/skill-pack-evidence.json`, `workflow.md`, `scope.md`, `prd.md`, `spec.md`. Agent: Codex. |
| Public source, open-source license and runnable instructions | Public GitHub repository, MIT license, committed offline HTML, [judge guide](judge-guide.md). |
| Public YouTube/Vimeo demonstration below three minutes | A 158.01-second edited sequence of actual browser screenshots with disclosed computer narration is complete locally. Public Vimeo upload and owner-browser playback are verified at https://vimeo.com/1236353555; independent signed-out access is unverified. [Provenance](submission/browser-demo-manifest.json) records the capture method and limits. |
| English description and required entry fields | Authenticated draft `1239349-action-receipt` has saved project fields, cover and entrant-directed Additional info; four of five steps are complete. The public watch URL is saved and the finalization page has no missing-field warnings; binding final terms and actual submission remain pending. |
| Free judge access through judging | Public offline file is the intended route. Preserve repository access through October 30. Owner-private hosted review is not the judge route. |
| Entrant eligibility and truthful declarations | Entrant must check personal eligibility and current form. Not certified by this audit. |

Deadline: October 26, 2026, 5 p.m. EDT (21:00 UTC, 11 a.m. Hawaiʻi). The rules do not state a runtime AI/API requirement. That is a reading of the text, not an organizer ruling. A student trial is a quality recommendation, not an official entry requirement.

## Criteria: evidence and distance remaining

Each criterion carries 25%. Ratings below describe evidence coverage, not predicted scores.

| Criterion | Current assessment | Improvement completed in this pass | Evidence still needed |
| --- | --- | --- | --- |
| Design | Coherent source/action review; usability remains unmeasured | Paper/forest typography and hierarchy, source-return navigation, stable action views, explicit file/download feedback, optional calendar controls and source-backed repair | Human desktop/offline review, keyboard checks and actual export opening. Fix any observed confusion. |
| Potential Impact | Specific student-notice hypothesis, no observed audience results | Make the relevant failure cases reproducible and supply exact success criteria for the existing trial kit | Observe willing students using a different notice without coaching. Report successes, failures and assistance honestly. Do not claim time savings or adoption from automated checks. |
| Innovation/Idea | Incremental workflow distinction in a crowded category | Focus the demonstration on source-backed repair, unresolved dates and separate approval/calendar gates | Explain the tradeoff in the entrant's own words. Test whether this combination is useful enough to justify another tool. No uniqueness claim is supported. |
| Presentation | Public edited actual-interface demonstration uploaded with owner-browser playback verified | A 158.01-second demonstration using actual browser captures, measured captions, disclosed computer narration and source-backed workflow | Review the saved watch URL and final entry, complete binding final terms and perform the actual submission. Independent signed-out access remains unverified. |

## Existing tools and the defensible distinction

Primary product documentation reviewed October 15, 2026. These are documented workflows, not a hands-on benchmark or an exhaustive feature inventory.

| Product | Documented workflow | Implication for Action Receipt |
| --- | --- | --- |
| [Google Tasks](https://workspace.google.com/intl/faq/products/tasks/) | Creates a task from an email with a link to the original; dated tasks appear in Calendar | Source access and calendar tasks already exist. They are not sufficient novelty claims. |
| [Notion AI Meeting Notes](https://www.notion.com/help/ai-meeting-notes) | Transcription and summaries with citations back to transcript snippets | Evidence-linked AI output already exists. Do not describe quotations as an original invention. |
| [Goblin Tools Magic ToDo](https://goblin.tools/ToDo) | Breaks a task into steps, with adjustable breakdown detail | Checklist generation and guided next steps already exist. |

The proposed distinction is the combination within one pasted student notice: exact passages, visible rule limitations, deliberate repair of omissions, explicit uncertainty, separate action/date checks and portable offline exports. This is a design hypothesis. Documentation silence does not establish that other tools lack a feature. The bounded English rules sacrifice general language understanding; the app must disclose that limitation.

## What the reproducible evidence proves

`npm run rehearse:demo` executes production domain functions on the same invented notice used at launch. It checks source positions, separate deadlines, a source-backed consent repair, the waived fee, a conditional relative date, export gates, UTC conversion, calendar formatting, edit invalidation and fresh review after reopening a file. The report includes source-file and artifact hashes.

Expected path: **3 proposals, 2 source flags, 0 initial approved items; 1 manual repair; 4 approved checklist tasks; only 2 confirmed calendar entries.** The consent form has no date, and “next Friday” remains unresolved. The payment cutoff becomes November 9 at 03:00 UTC. Zero pending identified flags does not certify that extraction is complete.

Artifacts in `devpost/demo/` are conspicuously labeled automated synthetic fixtures. Scripted approvals do not count as human review. The rehearsal does not exercise browser controls, downloads, a real calendar import, accessibility, students or the video. Existing automated tests and fresh smoke cases add regression evidence, not audience validation.

## Remaining work, in priority order

1. Entrant opens the latest offline file, completes the short review and checks actual downloaded files. Record any confusing step or failure. Complete the actual Learn final review and learning wrap-up; do not substitute agent checks.
2. Recommended: run a small formative trial using `usability/facilitator-guide.md` and the blank observation template. Three to five willing adult students is a practical starting point, not a representative study or a contest gate. Use different notices from the demo. Fix observed blockers before recording.
3. Use the published 158.01-second demonstration at https://vimeo.com/1236353555. Public and embeddable settings plus owner-browser playback were verified; independent signed-out access is not claimed. Its separate measured captions and provenance disclose the screenshot-sequence editing and computer narration. The original 2:35 recording plan remains for reference.
4. Continue the existing authenticated draft. Its project fields, cover and entrant-directed Additional info are saved. Its public video link is saved, and no missing-field warning is shown. The entrant reviews binding final terms and completes the actual submission. Record the real confirmation URL.

The installed Learn `6-ship` workflow requires entrant authorship of submission copy. After this limitation was explained, the entrant requested maximal delegation. AI-assisted factual copy is now prepared under that later instruction and disclosed as such; the skill's learner-authorship and experiential checkpoints are not certified complete. No entry, participant findings, learner reflection or completed video has been fabricated. The organizer determines eligibility.
