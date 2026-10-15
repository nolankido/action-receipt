export type DownloadOutput = { format: "checklist" | "calendar" | "questions"; text: string; count: number };
export type DownloadRequest = { status: "requested"; output: DownloadOutput } | { status: "error"; message: string };

// Synchronous browser-request boundary only. Returning cannot prove that the
// operating system saved the file, and this helper never changes review trust.
export function requestDownload(output: DownloadOutput, send: (output: DownloadOutput) => void): DownloadRequest {
  if (!output.text || !Number.isSafeInteger(output.count) || output.count < 1) return { status: "error", message: "No eligible content is selected. Check the review or question selections before downloading." };
  const snapshot = { ...output };
  try { send({ ...snapshot }); return { status: "requested", output: snapshot }; }
  catch (error) { return { status: "error", message: error instanceof Error ? error.message : "The browser could not request this download." }; }
}

export function planDownloadFeedback(request: DownloadRequest, current: DownloadOutput) {
  if (request.status === "error") return { error: true, stale: false, title: "Download needs attention", message: `${request.message} Your review and question drafts are still here. Check the content, then try Download again.` };
  const stale = request.output.format !== current.format || request.output.text !== current.text || request.output.count !== current.count;
  if (stale) return { error: false, stale: true, title: "Earlier request covers a different preview", message: "The format or content changed after that request. Check this preview and download again if you want the current version." };
  const noun = current.format === "calendar" ? current.count === 1 ? "calendar entry" : "calendar entries" : current.format === "questions" ? current.count === 1 ? "question" : "questions" : current.count === 1 ? "checklist task" : "checklist tasks";
  return { error: false, stale: false, title: "Download requested", message: `Your browser was asked to download ${current.count} ${noun}. Confirm the file saved before closing. This app cannot verify the save.` };
}
