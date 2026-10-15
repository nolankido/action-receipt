# Prepared entry assets

These files reduce submission work. They do not constitute a submitted entry.

Start with [READY-TO-SUBMIT.md](READY-TO-SUBMIT.md) for the short ordered completion path and prepared form values. The current source checkout provides `npm run check:submission`: it verifies rehearsal fingerprints, the app/version, every packaged member and the entry-state snapshot. It exits 2 when assets are consistent but the entry is still incomplete. `-- --assets-only` checks the preparation assets without requiring a completed entry. These are local checks, not browser or organizer verification.

## Current draft and browser status

The existing Devpost account `kidon` is authenticated. Draft `1239349-action-receipt` has saved project fields and a cover, with four of five steps complete. The public Vimeo URL is saved in the draft, and the finalization page shows no missing-field warnings. Additional info is complete, including four resource fields answered under the entrant's direction. Those answers stay in Devpost and are not reproduced here. The project path `/software/action-receipt` identifies the draft; public publication has not been verified.

Supported browser checks on the owner-authenticated production app verified two successive scans with exactly one source-review heading and one Create action control, and a working consent-action repair. This verifies the sibling-key fix; it is not a learner trial or participant study. The [public Vimeo demonstration](https://vimeo.com/1236353555) measures **158.01 seconds**: 14 genuine screenshots in 13 edited scenes, not continuous screen recording. Offline computer narration is disclosed throughout. The H.264 movie is 1600 by 1200 at 24 fps with AAC mono audio; its SHA-256 is `dee2c61468cbd8c166cf71258c63b0effa28644ff5d57b439bca11acd133491d`. Its 33 measured caption cues end at 157.055 seconds. [Browser-demo provenance](browser-demo-manifest.json) and [captions](browser-demo-captions.srt) are included here; Vimeo Public and embeddable settings plus active playback were verified in the owner-authenticated browser. An independent signed-out check is not claimed. The watch URL is saved in Devpost. The binding final terms checkbox and actual submission remain pending.

The exact Markdown preview contains four task lines with conditions, quotations and decision context retained. The calendar preview contains two `VEVENT` entries with `DTSTART` values `20321105` and `20321109T030000Z`; the email and consent actions do not create calendar entries. Browser download-request events were observed, but the reported files were absent after five seconds. A successful disk save is not claimed.

## Technical video created

A **2:42 narrated technical walkthrough** has been created and provided separately as `action-receipt-technical-walkthrough.mp4`. It presents real production-domain outputs captured from the notice, repair, decision, approval/date, export and reopen functions. Its input data is in `../demo/technical-video-domain-data.json`; the narration script, full spoken captions and a scene/hash manifest are included here. The voice is computer-generated offline using FFmpeg libflite, not the entrant's voice. No voice cloning, paid service or API request was used. Every scene identifies scripted synthetic choices and states that the browser interface is not shown.

The captured domain outputs predate the later source-input, keyboard-access and review-session refinements. The capture and movie retain their original hashes; no footage of the new interface is implied.

This technical video is not the current browser demonstration. An earlier browser-policy block on local HTML was respected; the completed production-browser capture is separate. The actual browser demonstration is published separately at https://vimeo.com/1236353555. No learner review or participant session is claimed.

Reproduction in a local environment with Node 22.13+, Python/Pillow, DejaVu fonts at `/usr/share/fonts/truetype/dejavu`, and FFmpeg with the libflite and subtitles filters:

```sh
npm run rehearse:demo
node --experimental-strip-types scripts/capture-technical-walkthrough.mjs
python scripts/render-technical-walkthrough.py
```

The encoder produces H.264, 1600 by 900, 24 fps, 162 seconds, with AAC mono narration and visible spoken captions. Each caption uses the measured boundary of its synthesis clip, with 34 cues in the accompanying SRT. Full decode and image-layout checks passed. The video file is provided separately; the small ZIP contains its provenance, narration text and captions.

- `project-description.md`: AI-assisted factual draft and Skill Pack-use material prepared under the entrant's explicit delegation. It is not learner-written copy and contains no invented personal reflection.
- `entry-data.json`: project facts, verified draft progress, focused production-browser checks, the published demo and unfinished binding-terms/submission state. Private answer values are not stored in this public file; their `null` values do not imply that the saved Additional info fields are unanswered.
- `action-receipt-cover.png`: original 1200 by 800 project illustration for the gallery. It is not a screenshot. The matching SVG preserves editable source.
- `planned-captions.srt`: retained original 2:35 planning text, separate from the completed browser-demo captions.
- `browser-demo-captions.srt` and `browser-demo-manifest.json`: 33 measured caption cues and compact provenance for the completed 158.01-second edited actual-interface demonstration. The manifest includes source-capture hashes and explicit evidence limits, not the large movie itself.
- `package-manifest.json`: SHA-256 hashes for the files in the portable submission-preparation archive. This binds the assets and runnable app, not a submission or a human review.

The generated archive is `release/action-receipt-submission.zip`. It includes the finished offline app, license/notices, factual draft, cover, planned captions, generated planning documents, judge instructions and explicitly labeled automated reference checks. Extract it and open `START-HERE.html` for the entry state and links.

## What is actually blocked

The earlier account-setup handoff is resolved. The authenticated draft and its actual fields have been inspected and saved, and Additional info is complete under the entrant's direction. The public watch URL is https://vimeo.com/1236353555. It is saved in the Devpost draft. The finalization page has no missing-field warnings, but its binding terms checkbox is unchecked and actual submission remains pending. No submission confirmation has been observed. The current hackathon form controls its exact fields. No personal survey response or binding declaration should be guessed.

The actual edited browser demonstration has uploaded successfully to Vimeo with Public visibility and embeddable sharing. Owner-browser playback was verified; independent signed-out access remains unverified. No metered browser automation, paid editing, API requests, scheduled jobs or GitHub Actions are needed for the preparation work. The actual public watch URL is recorded separately from the local movie and captions.

## Authorship and workflow

The installed Learn `6-ship` skill explicitly requires learner-written public copy and reflections, even on request. After that limitation was explained, the entrant requested maximal delegation and minimal personal work. The factual draft here follows that later user instruction and explicitly records AI assistance. This does not establish organizer acceptance of that deviation or complete the learner's actual review/learning checkpoints. Private Additional info answers remain in Devpost. No completed Learn workflow or contest entry is claimed.

## Minimal continuation

1. Review the existing draft and its saved https://vimeo.com/1236353555 video link; four of five steps are complete.
2. The entrant reviews the binding Official Rules and Devpost Terms of Service, then completes the remaining terms checkbox.
3. Preview the completed entry and finish the actual submission. Record the real confirmation URL/status; do not infer submission from saved draft progress.

The technical work, public repository and prepared assets already exist. Student trials are recommended evidence, not an official entry gate.
