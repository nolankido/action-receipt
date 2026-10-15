"use client";

import { ArrowRight, Download, FolderOpen, Info, TriangleAlert, X } from "lucide-react";
import { planReviewFileFeedback, type ReviewFileFeedback as Feedback } from "../lib/review-file-feedback.ts";

export default function ReviewFileFeedback({ feedback, contentStamp, canSave, disabled, onOpen, onSave, onReview, onDismiss }: {
  feedback: Feedback | null; contentStamp: string; canSave: boolean; disabled: boolean;
  onOpen: () => void; onSave: () => void; onReview: () => void; onDismiss: () => void;
}) {
  if (!feedback) return null;
  const plan = planReviewFileFeedback(feedback, contentStamp);
  const error = feedback.kind === "error";
  return <section className={`review-file-feedback ${error ? "has-error" : plan.stale ? "is-stale" : ""}`} aria-labelledby="file-feedback-heading">
    <div className="file-feedback-copy" role={error ? "alert" : "status"}>
      {error ? <TriangleAlert size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
      <div><h3 id="file-feedback-heading">{plan.title}</h3><p>{plan.message}</p>
        {error && feedback.operation === "open" && <p className="file-feedback-hint">Choose the .json file created by Download review file, not a checklist or calendar. Your current workspace is still here.</p>}
        {feedback.kind === "download" && <p className="file-feedback-hint">Review files include the full notice and committed edits. They exclude the recovery copy and unfinished form entries. Opening requires fresh approvals and date checks.</p>}
      </div>
    </div>
    <div className="file-feedback-actions">
      {plan.action === "open" && <button className="file-feedback-retry" disabled={disabled} onClick={onOpen}><FolderOpen size={14} />Choose another review file</button>}
      {plan.action === "save" && <button className="file-feedback-retry" disabled={!canSave} onClick={onSave}><Download size={14} />{plan.stale ? "Download current review" : "Try download again"}</button>}
      <button className="text-button" onClick={onReview}>Continue reviewing <ArrowRight size={14} /></button>
      <button className="icon-button" onClick={onDismiss} aria-label="Dismiss file feedback"><X size={15} /></button>
    </div>
  </section>;
}
