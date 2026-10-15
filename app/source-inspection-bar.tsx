import { ArrowLeft, Quote, X } from "lucide-react";
import type { SourceOrigin } from "../lib/source-inspection.ts";

export default function SourceInspectionBar({ count, origin, onReturn, onClear }: { count: number; origin: SourceOrigin | null; onReturn: () => void; onClear: () => void }) {
  return <div className="source-inspection" role="group" aria-label="Source inspection">
    <div className="inspection-context"><Quote size={15} aria-hidden="true" /><div><p>{count} exact match{count === 1 ? "" : "es"} highlighted</p>{origin && <p className="inspection-origin" title={origin.label}>{origin.label}</p>}</div></div>
    <div className="inspection-tools">{origin && <button className="text-button" onClick={onReturn}><ArrowLeft size={14} aria-hidden="true" />Back to {origin.kind === "action" ? "action" : "flagged passage"}</button>}<button className="icon-button" onClick={onClear} aria-label="Clear highlighting and return to review"><X size={15} aria-hidden="true" /></button></div>
  </div>;
}
