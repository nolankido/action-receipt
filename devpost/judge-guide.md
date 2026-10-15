# Run and inspect Action Receipt

Technical testing instructions. Intended platform: a current desktop browser.

## Open the finished program

1. Open the public [standalone app file](https://github.com/nolankido/action-receipt/blob/main/release/action-receipt.html).
2. Use GitHub's **Download raw file** control and save it as `action-receipt.html`. Do not save the GitHub source-view page. A [direct download](https://raw.githubusercontent.com/nolankido/action-receipt/main/release/action-receipt.html) is also available.
3. Open the downloaded HTML file in your browser. No build, installation, account, API key, credits, model download or server is needed. It contains its own scripts, styles, icons and runtime license notices.
4. You can disconnect from the network after downloading. The app itself has no runtime network operations; its content security policy blocks network connections.

The existing hosted review page is owner-private. Use this public offline distribution for judging, rather than relying on access to the hosted page. If browser or workplace policy blocks downloaded HTML, use the source-development instructions in the README on a permitted local machine.

## Inspect one complete workflow

The initial notice is explicitly synthetic and is freshly scanned by the ordinary local rules. Nothing starts approved. The app does not retrieve saved results for this notice.

1. Read the original notice, then use **Review this passage**. Create a separate consent-form action using the exact flagged sentence and explain the decision. Its date starts unresolved.
2. Record that the separate membership fee is not an obligation; explain the explicit negation. This source decision never creates or approves a task.
3. Review every active action and its **View source** passage. Keep the transport-email condition. Check actions deliberately; approval permits checklist export even when a date is unresolved.
4. Open **Review details**, then **Optional calendar details**. Confirm only the registration date and payment date/time/UTC offset, after checking their source. Keep “next Friday” and the undated consent form unresolved. Date confirmation and action approval are separate controls.
5. **Preview downloads** should show four checklist tasks and two calendar entries after that review. Inspect the exact file content and the excluded-item reasons. Download Markdown and `.ics` and open them yourself.

Expected calendar content: registration is an all-day marker on November 5, 2032; the payment cutoff is November 9 at 03:00 UTC (November 8 at 17:00 UTC-10:00). The two unresolved actions appear only in the checklist. There are no inferred reminders or event durations. Import into a calendar is optional and never automatic.

To exercise fresh input, choose **Use your own notice**, paste different text and select **Find actions locally**. Local rules can miss instructions; inspect the full source and add omitted actions from exact quotations. Extra saved walkthroughs and a harder fresh-rule notice are in **More practice**. They are labeled separately.

## Inspect technical evidence

- [Generated scope](scope.md), [PRD](prd.md), [spec](spec.md) and [Skill Pack provenance](skill-pack-evidence.json).
- [Automated rehearsal report](demo/rehearsal.json): production domain functions, scripted decisions, input/source hashes and expected artifacts. This is not a recording or a human trial.
- [Regression and fresh scan checks](../README.md#build-and-check), with source and reproducible commands.
- [Current competition assessment](competitive-readiness.md), including evidence limits and unfinished entry materials.

Session contents live in browser memory. Refreshing clears them. To retain work, explicitly save a review file; reopening requires fresh approvals and date confirmation. Downloaded files include source context and recorded explanations, including some context that is not an approved task.
