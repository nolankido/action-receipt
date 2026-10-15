# Action Receipt

A small notice-review application: paste a campus notice, inspect proposed actions beside exact supporting passages, clarify dates, and export approved items.

## Current status

The review interface, evidence/date validation and file exports are implemented. Three clearly labeled synthetic walkthroughs and source-backed manual review work without an API key. The live extraction endpoint has been exercised against the real service, which returned HTTP 429 with `credit_balance_exhausted` / `insufficient_quota`. No successful live extraction is claimed. The API key is stored securely in an ignored local server file; hosted paid processing remains disabled. Thirty-four automated contract/API/export tests pass; mock provider responses are not live model-quality evidence. Browser interaction and actual learner review remain pending.

## Run locally

Requires Node.js 22.13 or later and Git. Use one package manager; this repository uses pnpm.

```sh
npx pnpm@11.25.0 install --frozen-lockfile
npm run dev
```

Open the local URL printed by the server. The synthetic walkthrough is available immediately. For live analysis, put the server-side variable names from `.env.example` into your ignored `.dev.vars`, configure a real API key through your own secure credential workflow, set `ACTION_RECEIPT_AI_ENABLED=1` and `ACTION_RECEIPT_ALLOW_LOCAL_AI=1`, and restart development. The local exception applies only to loopback hosts. Do not put real keys in browser code, screenshots or commits.

For hosted review, use Sites to configure secret environment values and deploy. The paid inference deployment is owner-private and requires platform identity. Do not make paid inference publicly available without durable usage limits. The included four-request/minute per-user throttle is per isolate and is not a global spend cap. The OpenAI API is a separate service from a ChatGPT subscription; no paid account purchase has been made by this project.

## Check and build

```sh
npm test
npm run typecheck
npm run build
```

`npm test` uses Node's built-in runner. Cases cover unsupported evidence, distinct deadlines, missing context, conflicts, stale responses, edit-driven approval invalidation, calendar eligibility, provider errors, request bounds, escaping, byte-correct iCalendar folding and correction provenance. They do not replace a live extraction assessment.

## Review workflow

1. Try a synthetic notice. Its sample label remains visible and appears in exported files.
2. Select **View source** to highlight all exact occurrences of a quotation.
3. If an instruction was missed, use **Add an action from the source** with an exact supporting passage. This also supports manual review without sending text to the AI service. Added items start unapproved and retain user provenance in both exports.
4. Open **Review details** to inspect source evidence, edit wording/conditions, and clarify date/time information. A missed cutoff can be added explicitly.
5. Confirm complete dates separately from approving actions. A time in the source requires a confirmed time and UTC offset.
6. Check **I checked this action**. Edits revoke approval.
7. Download a Markdown checklist or `.ics` calendar file. Unresolved approved items remain checklist-only. Imports do not happen automatically.

The application does not guarantee correct interpretation or complete extraction. A model can quote a real passage while misunderstanding it. Read the complete notice, including qualifications and cancellations.

## Data handling

The app has no notice database, stored history, inbox access or autonomous actions. Source text and review decisions live in browser memory; refreshing clears them. Live processing sends the notice to OpenAI through the server using `store: false`; provider retention and processing are governed by provider policies. Application code does not log notice bodies. Exported files contain source quotations and may contain personal data from your notice.

For actual model checks after secure key configuration, run `node --env-file=.dev.vars --experimental-strip-types scripts/smoke-live.ts`. It uses synthetic notices, records only safe provider status/code/type diagnostics, preserves failures in `devpost/live-smoke.json`, and leaves human assessment explicitly pending.

The observed credit issue is recorded in `devpost/live-service-diagnostic.json`; original failed runs remain intact. Enable live AI only after account credits are available and secure hosted configuration is complete. There is no silent fallback from a failed AI request to the synthetic results.

## Project structure

- `app/receipt-workspace.tsx`: browser interaction, source highlighting, review and downloads.
- `app/api/`: extraction and capability endpoints.
- `lib/receipt.ts`: schema, quotation matching, dates and review rules.
- `lib/export.ts`: checklist and iCalendar serialization.
- `lib/extraction-service.ts`: bounded requests and structured AI extraction.
- `lib/samples.ts`: newly authored synthetic notices and saved walkthrough results.
- `tests/`: behavioral and API-contract verification.
- `devpost/`: Skill Pack planning documents, evidence, build state and app map.
- `build/`, `scripts/`, `vendor/`: standard Sites starter deployment integration and notices.

## Required Skill Pack workflow

The official Devpost Learn Skill Pack was installed and used in Codex. See `devpost/workflow.md`, `devpost/skill-pack-evidence.json`, and the generated `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md` and `devpost/checklist.md`. Installed skills and personal learner context are ignored. Reinstall the official pack with:

```sh
npx skills add challengepost/learn-ai-basics --all -y
```

`devpost/submission-checklist.md` records outstanding mechanical requirements. The actual learner review, human-written answers, public video and submission confirmation remain open. No user research or completed hackathon submission is claimed.

## License

MIT. Standard scaffolding, libraries and Skill Pack use are disclosed in `THIRD_PARTY_NOTICES.md`.
