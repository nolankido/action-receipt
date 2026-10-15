import { copyWorkspace, shouldCheckpoint, type RecoveryCopy, type ReplacementKind, type WorkspaceSnapshot } from "./workspace-recovery.ts";

export type ReviewContent = Pick<WorkspaceSnapshot, "source" | "title" | "actions" | "notes" | "attention" | "mode" | "sampleId" | "restored">;

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

// In-memory comparison only. IDs/timestamps for the receipt and UI-only state
// are excluded. Review checks count as changes even though imports reset them.
export function reviewContentStamp(workspace: ReviewContent): string {
  const { source, title, actions, notes, attention, mode, sampleId, restored } = workspace;
  return JSON.stringify(canonical({ source, title, actions, notes, attention, mode, sampleId, restored }));
}
export function reviewSessionState(workspace: ReviewContent, baseline: string, recovery: Pick<RecoveryCopy, "unsaved"> | null) {
  const nonempty = Boolean(workspace.source.trim() || workspace.title.trim() || workspace.actions.length || workspace.attention.length);
  const current = nonempty && reviewContentStamp(workspace) !== baseline;
  const previous = Boolean(recovery?.unsaved);
  return { current, previous, warnBeforeLeaving: current || previous };
}

export function checkpointReview(workspace: WorkspaceSnapshot, baseline: string, previous: RecoveryCopy | null, kind: ReplacementKind, label: string): RecoveryCopy | null {
  if (!shouldCheckpoint(workspace, kind)) return previous;
  const unsaved = reviewSessionState(workspace, baseline, null).current;
  // Do not replace unsaved work with a clean practice or downloaded review.
  if (previous?.unsaved && !unsaved) return previous;
  return { label, workspace: copyWorkspace(workspace), unsaved };
}
