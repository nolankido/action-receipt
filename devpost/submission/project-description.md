# Action Receipt

*AI-assisted factual draft prepared at the entrant's request. Not a claim of learner-written copy or personal learning. The current authenticated entry form has not yet been inspected.*

## Tagline

Turn one notice into reviewed actions, with the original words attached.

## Project story

### The problem and audience

A student notice can mix registration, payment, required documents and conditional instructions in a few paragraphs. A short summary can hide the distinctions that matter: which action has which deadline, whether an instruction applies, and which dates are still unclear.

Action Receipt explores a narrow solution for students reviewing school, club and administrative notices. Its usefulness with students has not yet been established through participant testing.

### What it does

Paste one notice and get proposed actions beside the original text. Open an exact supporting passage, correct wording, add a missed instruction from its quotation, and record why a flagged passage is an obligation, a clarification request or not an action.

Action approval and calendar-date confirmation are separate. An approved task with an unresolved date can stay in the checklist. It cannot enter the calendar until its date, and any required cutoff time and UTC offset, are complete and confirmed. Edits clear the affected approval. Original warnings and corrections remain in the exported receipt.

The invented practice notice separates registration and payment deadlines, exposes a missed consent-form instruction and preserves a conditional "next Friday" without guessing its date. A completed review yields four checklist tasks and only two calendar entries. Preview shows the exact Markdown and iCalendar content before download. Nothing is automatically added to a calendar or sent to another person.

The design choice is to keep source inspection, omissions and uncertainty inside the same small review loop. Exact quotations and separate task/date checks make a correction inspectable later. Offline files keep that workflow usable without an account or service budget. The tradeoff is limited language coverage and deliberate human review; this is not a claim that task lists or source citations are new inventions.

### How it was built

The official Devpost Learn Skill Pack was installed and used with Codex. Its generated `scope.md`, `prd.md` and `spec.md` are in the public repository, alongside workflow and installation evidence. The interface uses React and TypeScript; Vite packages it as one self-contained HTML file. Standard starter code and dependencies are disclosed in the repository notices.

The finished app uses bounded English text rules, not a runtime AI model. It runs offline without an account, API key, paid credits or model download. Source matching checks quotation presence; it does not certify interpretation or completeness. Users must read the full notice and repair omissions.

### Engineering findings and validation

The implementation separates quotation matching from meaning, action approval from date confirmation, and imported data from current-session trust. Regression work covered abbreviated dates, contradictory weekdays, malformed clocks, conditional scope, cutoff conversion, review-file recovery and download failure states. Automated verification includes 186 regression tests, 14 fresh synthetic notice checks and a reproducible source-to-export rehearsal. These are technical checks, not human usability findings. Browser interaction and actual participant testing remain unverified.

### Next step

Observe students reviewing unfamiliar notices, fix the points where they need help, and assess whether the source-and-uncertainty workflow earns a place in their routine. Expand language coverage only in response to that evidence.

## Skill Pack use: factual field material

Installed `challengepost/learn-ai-basics` in a new project and used its actual skills with Codex to define the scope, product requirements, technical specification and build checklist. The generated documents, source fingerprints and workflow record are public under `devpost/`. Implementation was delegated to the coding agent. Actual learner hands-on review and personal learning reflection are not claimed as complete. This factual draft was prepared with AI assistance under the entrant's later request to delegate submission preparation; it is not learner-authored submission copy.

## Built-with tags

TypeScript, React, Vite, Codex, Devpost Learn Skill Pack, HTML, CSS, iCalendar.

## Links

- Public repository and judge access: https://github.com/nolankido/action-receipt
- Runnable file: https://github.com/nolankido/action-receipt/blob/main/release/action-receipt.html
- Judge instructions: https://github.com/nolankido/action-receipt/blob/main/devpost/judge-guide.md
- License: MIT
- Video: not recorded or uploaded. No placeholder video URL should be submitted.

## Not answered by this draft

Personal learning or satisfaction questions, exit-survey responses, residence/eligibility declarations and acceptance of terms require truthful entrant input. The draft does not certify compliance with the Learn pack's learner-authorship guidance or completion of its experiential checkpoints. The organizer determines entry eligibility.
