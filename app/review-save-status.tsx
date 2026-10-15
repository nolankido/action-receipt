"use client";

import { ChevronDown, FolderOpen, LoaderCircle, Save, ShieldCheck, TriangleAlert } from "lucide-react";

export default function ReviewSaveStatus({ current, previous, downloadRequested, canSave, onSave, onOpen, opening, disabled }: {
  current: boolean; previous: boolean; downloadRequested: boolean; canSave: boolean; onSave: () => void;
  onOpen: () => void; opening: boolean; disabled: boolean;
}) {
  const pending = current || previous;
  return <section className={`review-save-status ${pending ? "has-changes" : ""}`} aria-labelledby="review-save-heading">
    <div className="review-save-copy">{pending ? <TriangleAlert size={18} /> : <ShieldCheck size={18} />}<div>
      <h3 id="review-save-heading">{current ? "Unsaved review changes" : previous ? "Recovery copy has unsaved work" : downloadRequested ? "Review-file download requested" : "No new review changes"}</h3>
      <p>{previous ? "The recovery copy is separate. Restore it to download its work." : downloadRequested ? "Confirm the file saved before leaving. Further changes need another download." : "Work stays in this tab. Download a file to keep it. No automatic save."}</p>
      <details className="save-details"><summary>About review files <ChevronDown size={12} /></summary><p>Files keep the full notice, added actions and committed edits, including unapproved items. They exclude the recovery copy and unfinished form entries. Opening replaces this workspace, resets approvals and date confirmations, and requires source decisions to be checked again.</p><p>The browser may warn before leaving changed work, but cannot prevent every refresh or closure. This app does not save automatically. Restore and save a recovery copy separately, or discard it deliberately.</p></details>
    </div></div>
    <div className="review-save-buttons"><button id="review-file-open" className="open-review-button" disabled={disabled} onClick={onOpen}>{opening ? <LoaderCircle size={15} className="spin" /> : <FolderOpen size={15} />}{opening ? "Opening review…" : "Open review file"}</button><button id="review-file-download" disabled={!canSave} onClick={onSave}><Save size={15} /> Download review file</button></div>
  </section>;
}
