import { locateEvidence, type ReviewedAction, type SourceReviewItem } from "./receipt.ts";
import type { ReceiptMeta } from "./export.ts";

export type WorkspaceSnapshot = {
  source: string; title: string; actions: ReviewedAction[]; notes: string[]; attention: SourceReviewItem[];
  mode: ReceiptMeta["mode"] | null; sampleId: string | null; restored: boolean; receiptId: string; createdAt: Date;
};
export type ReplacementKind = "source_edit" | "scan" | "replace";
export type RecoveryCopy = { label: string; workspace: WorkspaceSnapshot };

export function shouldCheckpoint(workspace: WorkspaceSnapshot, kind: ReplacementKind): boolean {
  if (!workspace.source.trim() && !workspace.actions.length && !workspace.attention.length) return false;
  // Preserve the pre-edit review through continuous typing and the first scan
  // of its replacement text. Bulk replacements also protect unscanned notices.
  return kind === "replace" || workspace.mode !== null || !!workspace.actions.length || !!workspace.attention.length;
}
export function copyWorkspace(workspace: WorkspaceSnapshot): WorkspaceSnapshot { return structuredClone(workspace); }
export function recoverWorkspace(current: WorkspaceSnapshot, previous: WorkspaceSnapshot) {
  const workspace = copyWorkspace(previous);
  workspace.actions = workspace.actions.map(action => {
    const evidence = action.evidence.map(e => locateEvidence(workspace.source, e.quote));
    const dateEvidence = action.dateEvidence.map(e => locateEvidence(workspace.source, e.quote));
    return { ...action, evidence, dateEvidence, evidenceValid: evidence.length > 0 && evidence.every(e => e.starts.length > 0), approved: false, dateConfirmed: false };
  });
  workspace.attention = workspace.attention.map(item => ({ ...item, evidence: locateEvidence(workspace.source, item.evidence.quote),
    ...(item.decision ? { decision: { ...item.decision, confirmed: false, actionSnapshot: null } } : {}),
  }));
  // Keep just the outgoing workspace, so restoring the wrong copy is reversible.
  // Neither snapshot is a review file or an approval history.
  return { workspace, previous: copyWorkspace(current) };
}
