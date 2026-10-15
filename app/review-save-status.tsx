"use client";

import { Save, ShieldCheck, TriangleAlert } from "lucide-react";

export default function ReviewSaveStatus({ current, previous, downloadRequested, canSave, onSave }: {
  current: boolean; previous: boolean; downloadRequested: boolean; canSave: boolean; onSave: () => void;
}) {
  const pending = current || previous;
  return <section className={`review-save-status ${pending ? "has-changes" : ""}`} aria-labelledby="review-save-heading">
    <div className="review-save-copy">{pending ? <TriangleAlert size={18} /> : <ShieldCheck size={18} />}<div>
      <h3 id="review-save-heading">{current ? "Unsaved review changes" : previous ? "Recovery copy has unsaved work" : downloadRequested ? "Review-file download requested" : "No new review changes"}</h3>
      <p>{previous ? "The separate recovery copy is not in current downloads. Restore and save it, or discard it deliberately." : downloadRequested ? "Confirm the file saved before leaving. Opening it requires fresh review. Further changes will need another download." : "Work stays in this tab. Download a review file to keep its source and committed edits after closing. Unfinished form entries are excluded."}</p>
      {pending && <p className="review-save-limit">The browser may warn before leaving. Warnings cannot prevent every refresh or tab closure; there is no automatic save. Unfinished form entries are excluded.</p>}
    </div></div>
    <button disabled={!canSave} onClick={onSave}><Save size={15} /> Download review file</button>
  </section>;
}
