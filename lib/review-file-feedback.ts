export type ReviewFileFeedback =
  | { kind: "error"; operation: "open" | "save"; message: string }
  | { kind: "download"; contentStamp: string }
  | { kind: "opened" | "recovered"; message: string };

// This records a browser request, not a successful filesystem save. Comparing
// receipt content keeps an earlier request from claiming to cover later edits.
export function planReviewFileFeedback(feedback: ReviewFileFeedback, currentStamp: string) {
  if (feedback.kind === "error") return {
    title: feedback.operation === "open" ? "Review file not opened" : "Review-file download not requested",
    message: feedback.message, action: feedback.operation === "open" ? "open" : "save", stale: false,
  } as const;
  if (feedback.kind === "download") {
    const stale = feedback.contentStamp !== currentStamp;
    return {
      title: stale ? "Earlier download request does not include these changes" : "Review-file download requested",
      message: stale ? "Your review changed after that request. Download another review file to keep the current version, then confirm it saved." : "Confirm the file saved before leaving. A browser download request does not verify that a file reached your device.",
      action: stale ? "save" : null, stale,
    } as const;
  }
  return { title: feedback.kind === "opened" ? "Review file opened for fresh checking" : "Workspace recovered for fresh checking", message: feedback.message, action: null, stale: false } as const;
}
