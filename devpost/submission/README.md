# Prepared entry assets

These files reduce submission work. They do not constitute a submitted entry.

## Technical video created

A **2:00 captioned technical walkthrough** has been created and provided separately as `action-receipt-technical-walkthrough.mp4`. It presents real production-domain outputs captured from the notice, repair, decision, approval/date, export and reopen functions. Its input data is in `../demo/technical-video-domain-data.json`; captions and a scene/hash manifest are included here. Every scene identifies scripted synthetic choices and states that the browser interface is not shown.

This video is not the finished hackathon demonstration. Browser policy blocked opening the local HTML file and expressly prohibited workarounds. No browser recording, screenshot-based imitation of the interface, human review or participant session is claimed. A proper recording of the actual browser interface and a public YouTube/Vimeo link remain open. Do not submit the technical walkthrough as if those requirements had been completed.

Reproduction in a local environment with Node 22.13+, Python/Pillow, DejaVu fonts at `/usr/share/fonts/truetype/dejavu`, and FFmpeg:

```sh
npm run rehearse:demo
node --experimental-strip-types scripts/capture-technical-walkthrough.mjs
python scripts/render-technical-walkthrough.py
```

The encoder produces H.264, 1600 by 900, 24 fps, 120 seconds, with visible captions and no audio. Full decode and image-layout checks passed. The video file is provided separately; the small ZIP contains its provenance and captions.

- `project-description.md`: AI-assisted factual draft and Skill Pack-use material prepared under the entrant's explicit delegation. It is not learner-written copy and contains no invented personal reflection.
- `entry-data.json`: name, tagline, technology tags, public links, platform and unfilled fields. `null` means genuinely missing. These are not verified authenticated form fields.
- `action-receipt-cover.png`: original 1200 by 800 project illustration for the gallery. It is not a screenshot. The matching SVG preserves editable source.
- `planned-captions.srt`: 2:35 planned captions. They must be aligned to the actual screen recording before use; no video has been produced. A captioned silent demo can show the required functioning software without a face or voice recording.
- `package-manifest.json`: SHA-256 hashes for the files in the portable submission-preparation archive. This binds the assets and runnable app, not a submission or a human review.

The generated archive is `release/action-receipt-submission.zip`. It includes the finished offline app, license/notices, factual draft, cover, planned captions, generated planning documents, judge instructions and explicitly labeled automated reference checks. Extract it and open `START-HERE.html` for the entry state and links.

## What is actually blocked

GitHub email-only authorization succeeded with the user's explicit approval. Devpost then opened a sign-up form and reported that the username is taken. The account-setup handoff remains unresolved. No authenticated project draft, current additional fields, survey, eligibility declaration or submission status has been inspected or completed. A public YouTube/Vimeo video of the actual browser app is still missing. The generic form sequence was checked against the [official Devpost help](https://help.devpost.com/article/126-know-your-submission-steps); the current hackathon form takes precedence for its exact fields. No personal survey response or binding declaration should be guessed.

No supported browser recorder or direct YouTube/Vimeo upload connector was found. Metered browser automation and credit-based video editing were not used because the entrant prohibited new spending. No new accounts, API requests, scheduled jobs or GitHub Actions were added. The prepared caption file is not footage and does not satisfy the video requirement by itself.

## Authorship and workflow

The installed Learn `6-ship` skill asks learners to write their public copy and reflections themselves. After that limitation was explained, the entrant requested maximal delegation and minimal personal work. The factual draft here follows that later user instruction and explicitly records AI assistance. This does not establish organizer acceptance of that deviation, erase the skill's guidance, or complete the learner's actual review/learning checkpoints. Personal experiential answers remain blank. No completed Learn workflow or contest entry is claimed.

## Minimal continuation

1. Authenticate to Devpost through the secure browser sign-in request. Then the agent can inspect the actual form, reuse the prepared facts and identify only genuinely personal unanswered fields.
2. Supply actual screen footage and a public YouTube/Vimeo URL. Planned captions and the existing `devpost/demo/recording-guide.md` remove the need to invent a script or record a face/voice.
3. Answer any personal reflection/eligibility prompts truthfully and handle any required acceptance of terms. Save drafts before the final submission step; record the actual confirmation when complete.

The technical work, public repository and prepared assets already exist. Student trials are recommended evidence, not an official entry gate.
