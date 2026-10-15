---
doc: spec
status: approved
---
# Action Receipt Technical Spec

## How This Works, In Plain Language
The browser sends a notice to one server endpoint. An AI service proposes actions and quotes. Ordinary code checks the returned structure, finds the quoted text in the notice, and checks dates. The user checks meaning, fixes uncertainty and approves items. The browser creates download files. The app keeps no notice database.

## The Core Journey Through the System
Implements `prd.md > The Core Journey`: browser input to `/api/extract`, structured model response to validation, linked passages to review cards, reviewed state to local exports. Sample walkthroughs load explicitly labeled saved data through the same validator. They never substitute for a failed live call.

## Stack
- React 19 and TypeScript: interactive browser workspace. https://react.dev/ and https://www.typescriptlang.org/docs/
- Vinext/Vite on Cloudflare Workers through the supplied Sites starter: preserves the approved React/TypeScript/Worker architecture with supported hosting. https://github.com/cloudflare/vinext and https://developers.cloudflare.com/workers/
- One server-side OpenAI Responses API call with structured JSON output, once a secure key is configured. https://platform.openai.com/docs/api-reference/responses
- Node built-in test runner for meaningful validation/export checks; no GitHub Actions or background jobs.

## Where It Runs and How Someone Tries It
Node 22.13+ for development. Install with `npx pnpm@11.25.0 install --frozen-lockfile`; run `npm run dev` and open the URL printed by the server. On this managed workspace, use the supported Sites preview only if browser control is available. Run `npm test` and `npm run typecheck`. Hosted review uses the URL returned by Sites. Live extraction needs server-side `OPENAI_API_KEY` and a documented `OPENAI_MODEL`; sample walkthroughs need no key. Local keys belong in ignored `.dev.vars` or `.env.local`, never chat or source. Public GitHub and a public sub-three-minute YouTube/Vimeo recording remain required; hosted deployment is additional.

## Look and Feel
Implement `prd.md > Look and Feel` with warm paper backgrounds, white document surfaces, dark ink, forest green primary controls, amber issue labels, readable system sans text and a restrained serif display headline. Clear focus rings, semantic labels and reduced motion. Responsive two-column workspace.

## Components

### Workspace
`app/page.tsx` and `app/receipt-workspace.tsx` implement `prd.md > Notice Entry`, `Evidence Review`, `Corrections and Approval` and all normal/error/empty states. Memory only. The current source revision invalidates old responses. A compact manual action form accepts a title, exact source passage and optional condition. User-added items are labeled visibly, begin unapproved with unresolved dates, and share all approval/export rules.

### Extraction Endpoint
`app/api/extract/route.ts` implements `prd.md > Notice Entry` and `Dates and Conditions`. Limit input bytes and text length, require same-origin browser POST, impose a timeout, use a strict schema, no model tools or link fetching, no raw body logging, and return readable failure codes. Without a key, return a service-unavailable response, not sample data. Parse bounded provider error codes/types without reflecting raw error bodies: quota, temporary rate, authentication and model-access failures stay distinct. `app/api/status/route.ts` reports capability without exposing credentials.

### Validation and Review Rules
`lib/receipt.ts` implements `prd.md > Evidence Review` and `Dates and Conditions`. Treat model fields as untrusted; cap counts and lengths; locate exact quotations locally; preserve issue codes and conditions. A complete explicit date is required for calendar eligibility; date confirmation is distinct from approval. Code confirms quotation presence only, not the truth or completeness of extraction.

### Exports
`lib/export.ts` implements `prd.md > Export`. Export only approved items. Escape iCalendar content lines, fold UTF-8 lines, use stable per-action UIDs, represent date-only entries as all-day markers and timed deadlines as zero-duration instants with explicit offsets. Never invent an event length. Omit unresolved calendar items visibly.

### Samples
`lib/samples.ts` holds three synthetic notices and explicitly saved walkthrough results: multiple deadlines, ambiguity, and conflicting dates/conditional instructions. Always label this mode and its generated exports.

## Data Model
An immutable source string and revision; extraction mode/model; candidate actions with title, condition, action evidence, date evidence, literal deadline, proposed ISO date, time and offset, issues; reviewed actions with edited values, date confirmation, user-change provenance, action origin (extracted/user), approval and omission. Receipt mode distinguishes saved samples, live proposals and manual review. Everything lives in browser memory; no database. A new extraction resets approvals. Provider processing is covered by provider terms, not a claim of zero retention.

## File Structure
| Path | Purpose |
| --- | --- |
| `app/page.tsx`, `app/receipt-workspace.tsx`, `app/globals.css` | Main interface |
| `app/api/extract/route.ts`, `app/api/status/route.ts` | Server routes |
| `lib/receipt.ts`, `lib/export.ts`, `lib/samples.ts` | Validation, downloads and synthetic data |
| `tests/receipt.test.ts`, `tests/api.test.ts` | Contract and behavioral checks |
| `devpost/` | Skill-generated plans, checklist, workflow evidence and app map |
| `.openai/hosting.json`, `build/`, `scripts/` | Supplied Sites deployment integration |

## External Services and Dependencies
AI endpoint: POST `https://api.openai.com/v1/responses` with bearer key, configured model (default `gpt-5-mini`), system extraction instructions, untrusted notice text and strict JSON schema. Validate returned JSON before use. Provider limits/cost depend on the account; no paid plan purchase is authorized. Host secrets through Sites. Keep paid inference on the owner-private review site, require platform identity, and add a four-request/minute per-user, per-isolate throttle. This throttle is best effort, not a global spend cap. Do not enable a public paid endpoint without durable usage controls. Hosting/source synchronization uses Sites helpers. Public GitHub export may require the user to create a new empty repository because the connected GitHub tools do not expose repository creation.

## Important Failure Modes
- No key or provider failure: honest error, retain text, offer separately labeled walkthrough.
- Unusable output or nonexistent quote: reject/flag; never approve unsupported data.
- Ambiguous or conflicting time: checklist can retain ambiguity; calendar stays blocked.
- Source edited during request: discard old response using revision/request identity.

## What Was Simplified and Why
One notice and no persistent storage keep the evidence trail inspectable. Native file downloads avoid calendar account access. Explicit time offsets avoid silently selecting a time zone. Three saved examples allow interface review while model configuration is pending.

## Decisions and Open Issues
The learner approved the displayed scope and React/TypeScript/Worker proposal, and delegated routine implementation. No personal technical uncertainty was identified; do not invent one. The genuine implementation risk to investigate is whether quotes and date roles survive live model extraction. Local API credentials are configured securely; real requests returned credit_balance_exhausted / insufficient_quota. Successful runtime extraction verification, secure hosted AI configuration, actual learner review and public submission materials remain open. The public repository exists.

Date resolution retains original flags as historical evidence. A complete user-confirmed date can become calendar-eligible while its original ambiguity remains in the downloaded receipt. Action quotations always remain mandatory. Test stale responses, approval invalidation, separate event/deadline dates, and source-grounding independently from model-quality evaluation.

Manual action repair remains inside the evidence-review loop. Exact passages can be up to 1,200 characters; their full text and detected date conflicts remain in the receipt. Manual dates are never auto-assigned. Exported mode and per-action origin distinguish human additions from model proposals.
