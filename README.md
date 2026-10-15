# Action Receipt

Review one notice with its source evidence, clarify dates, and export only actions you approve. Built with AI coding assistance and the official Devpost Learn Skill Pack. The finished app uses local English text rules and ordinary browser code, with no runtime AI model.

## Use without installation or payment

Download `release/action-receipt.html` from this public repository and open it in a current desktop browser. The file contains its JavaScript, styles, icons and dependency license notices. It runs from a local file without a server, network connection, account, API key, credits or model download. No paid hosting is required.

The optional hosted review site is https://action-receipt.huzzahoptimistically.chatgpt.site. It retains the owner's existing private audience. The downloadable app in this public repository is the judge-access route and does not depend on that site.

## What the local rules do

- Recognize a bounded set of English action words such as register, pay, submit, upload, bring and email.
- Preserve exact supporting passages and visible conditions, including trailing waivers.
- Show a source-linked review list for unlinked dates, unsupported obligations, cancellations and skipped passages. The manual form can reuse a highlighted quote. The list is bounded at 80 entries and reports overflow; it is not an exhaustive source review.
- Propose complete dates only from the actual action clause with a recognized temporal link. Dates/times inside conditions and separate clauses are not borrowed as deadlines. Conflicting clocks/offsets need manual clarification. Relative dates, missing years, ambiguous numeric formats, several dates and uncertain roles require review.
- Require separate action approval and date confirmation. Timed cutoffs also require a complete time and explicit UTC offset.
- Save a local review file and reopen it later with source, edits, omissions and context intact. Opening resets every action approval and date confirmation; imported interpretations stay visibly unverified.
- Export approved checklists and eligible calendar entries, retaining source quotations, warnings, notice-level notes, flagged source context, mode and user corrections. Source-review flags stay context; they do not create extra tasks or calendar events.

These are text patterns, not semantic AI. They can miss unfamiliar wording, implicit instructions, cross-sentence context or cancellations. Read the complete source. Use **Add an action from the source** for omissions. A quotation match confirms presence, not interpretation or completeness. Twenty actions per receipt; 30 to 15,000 input characters.

Three synthetic walkthroughs have saved example results and are labeled accordingly. **Find actions locally** runs the actual rule engine on the current text, including edited or completely new notices. It never looks up sample results. Fresh rule proposals, saved examples and user additions remain distinct in exports. Rescanning explicitly clears the current review; edits also clear approvals.

## Data handling

Notices and review decisions stay in browser memory. Refreshing clears them. Use **Save review file** to download your work explicitly, then **Open review file** to resume. These JSON files contain the full notice and added actions, including unapproved and omitted items; unfinished manual-form entries are not saved. Opening a valid file replaces the current workspace and requires fresh approvals. No automatic save or cloud history exists. Files are limited to 1 MB; unsupported versions, invalid structures and unmatched quotations are rejected without replacing current work. Cutoff protection is recomputed from source independently of saved flags.

There is no notice database, analytics, account system or automatic calendar integration. The offline build blocks network connections with a content security policy. Checklist/calendar exports include source quotations, notice notes and flagged passages, including context that is not an approved task; they may contain personal information from a notice. The export panel discloses this content.

## Build and check

For source development, use Node.js 22.13+ and the repository's pnpm version. Downloading the already-built HTML above requires neither.

```sh
npx pnpm@11.25.0 install --frozen-lockfile
npm run dev
npm test
npm run typecheck
node --experimental-strip-types scripts/smoke-local.ts
npm run build
```

The build creates `dist/index.html`, `dist/action-receipt.html`, and the identical committed `release/action-receipt.html`. It embeds assets and license notices, rejects external script/style references, and adds `connect-src 'none'`. Source development uses Vite; the published output is static. No GitHub Actions or scheduled jobs are required or added.

Current verification: 57 automated tests, TypeScript and the static build pass. Three fresh synthetic notice checks pass in `devpost/local-smoke.json`. Browser interaction and learner review remain pending because supported browser control is unavailable here. These checks are not a user study or proof of complete language understanding.

## Project structure

- `standalone/`, `vite.static.config.ts`: static React entry and configuration.
- `app/receipt-workspace.tsx`, `app/globals.css`: review interface.
- `lib/local-extraction.ts`: bounded, network-free English text rules.
- `lib/receipt.ts`, `lib/export.ts`, `lib/review-file.ts`: evidence, date/review rules, approved exports and explicit local review save/open.
- `lib/samples.ts`: synthetic notices and saved walkthroughs.
- `scripts/build-static.mjs`: self-contained HTML packaging and license preservation.
- `release/action-receipt.html`: runnable distribution.
- `tests/`, `devpost/`: checks, planning, workflow evidence and app map.

The repository retains standard unused Sites/Vinext starter integration and its notices. The active build uses the static entry above. Earlier `devpost/live-*.json` files preserve failed experiments from an abandoned API design; they are historical evidence, not current setup requirements. The API implementation, key template and live-test script were removed when the learner required no new spending. The app cannot use API credits even if a key exists elsewhere.

## Hackathon process

The official Skill Pack was installed and used in Codex. See `devpost/workflow.md`, `skill-pack-evidence.json`, `scope.md`, `prd.md`, `spec.md` and `checklist.md`. The budget-driven revision is documented in `devpost/zero-cost-plan.md`. Reinstall the pack with:

```sh
npx skills add challengepost/learn-ai-basics --all -y
```

The current rules require a working project built with the Skill Pack; no runtime model API requirement is stated. This is our reading of https://learn-ai-basics.devpost.com/rules, not an organizer eligibility ruling. The public repository, a public demonstration under three minutes, actual learner review, learner-written answers and the exit survey remain part of the submission process. No completed submission is claimed.

## License

MIT. Dependencies, starter scaffolding and Skill Pack use are disclosed in `THIRD_PARTY_NOTICES.md`. Bundled runtime licenses are embedded in the standalone HTML.
