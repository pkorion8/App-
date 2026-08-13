"use client";

import { useRef, useTransition } from "react";
import { Badge, Button } from "@venture-sandbox/ui";
import { rewindToCheckpoint, saveCheckpoint } from "./actions";

interface Checkpoint { id: string; virtual_day: number; label: string | null; created_at: string; }

export function CheckpointPanel({ ventureId, runId, checkpoints, currentDay, realityMode, rewindCount }: { ventureId: string; runId: string; checkpoints: Checkpoint[]; currentDay: number; realityMode: boolean; rewindCount: number; }) {
  const [isPending, startTransition] = useTransition();
  const labelRef = useRef<HTMLInputElement>(null);
  const rewindsRemaining = Math.max(0, 3 - rewindCount);
  const rewindDisabled = realityMode || rewindsRemaining === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Timeline rewinds</p>
          <h3 className="mt-1 text-lg font-semibold text-vs-fg">Save a decision point without erasing history</h3>
          <p className="mt-2 text-xs leading-5 text-vs-fg-muted">A rewind creates a separate timeline from a saved checkpoint. The original run remains available in the timeline library for comparison.</p>
        </div>
        {realityMode ? <Badge status="warning">Reality Mode · 0 rewinds</Badge> : <Badge status={rewindsRemaining > 0 ? "primary" : "neutral"}>{rewindsRemaining} of 3 rewinds left</Badge>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); const label = labelRef.current?.value ?? ""; startTransition(() => { saveCheckpoint(ventureId, runId, label); }); if (labelRef.current) labelRef.current.value = ""; }} className="flex gap-2">
        <input ref={labelRef} type="text" placeholder={`Decision point at day ${currentDay}`} className="min-w-0 flex-1 rounded-vs-sm border border-vs-border bg-transparent px-3 py-2 text-sm text-vs-fg placeholder:text-vs-fg-muted" />
        <Button type="submit" variant="secondary" disabled={isPending}>Save point</Button>
      </form>
      {rewindDisabled && checkpoints.length > 0 && <p className="rounded-vs-sm border border-vs-border bg-vs-bg-subtle p-3 text-xs text-vs-fg-muted">{realityMode ? "Reality Mode keeps checkpoints as historical markers, but alternate timelines are disabled." : "This timeline has used its three rewind opportunities. Existing branches stay available in the timeline library."}</p>}
      {checkpoints.length ? (
        <ul className="space-y-2">{checkpoints.map((cp) => <li key={cp.id} className="rounded-vs-md border border-vs-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium text-vs-fg">Day {cp.virtual_day} · {cp.label || "Untitled decision point"}</p><p className="mt-1 text-[11px] text-vs-fg-muted">Saved {new Date(cp.created_at).toLocaleDateString()}</p></div><button disabled={isPending || rewindDisabled} onClick={() => startTransition(() => { rewindToCheckpoint(ventureId, cp.id); })} className="rounded-full border border-vs-primary/30 px-3 py-1.5 text-xs font-medium text-vs-primary hover:bg-vs-primary/5 disabled:cursor-not-allowed disabled:opacity-40">Create alternate timeline</button></div></li>)}</ul>
      ) : <p className="rounded-vs-sm bg-vs-bg-subtle p-3 text-xs text-vs-fg-muted">No saved decision points yet.</p>}
    </div>
  );
}
