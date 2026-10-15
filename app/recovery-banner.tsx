"use client";

import { RotateCcw, X } from "lucide-react";
import type { RecoveryCopy } from "../lib/workspace-recovery.ts";

export default function RecoveryBanner({ copy, onRestore, onDiscard }: { copy: RecoveryCopy; onRestore: () => void; onDiscard: () => void }) {
  return <section className="recovery-banner" aria-labelledby="recovery-heading">
    <div className="recovery-copy"><RotateCcw size={19} /><div><h3 id="recovery-heading">A recovery copy is available.</h3><p><strong>{copy.workspace.title || "Untitled notice"}</strong> · {copy.label}</p><p>Restore the notice and committed review edits. Approvals, date confirmations and source decisions need fresh checks. Restoring keeps the outgoing workspace as the next recovery copy.</p></div></div>
    <div className="recovery-buttons"><button className="recovery-restore" onClick={onRestore}><RotateCcw size={14} /> Restore previous workspace</button><button className="text-button" onClick={onDiscard}><X size={14} /> Discard recovery copy</button></div>
    <p className="recovery-boundary">One temporary copy in this tab. Replacements can overwrite it; refresh or closing the tab clears it. Downloads exclude the recovery copy. Unfinished form entries are not recovered.</p>
  </section>;
}
