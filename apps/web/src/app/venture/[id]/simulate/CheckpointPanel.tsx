"use client";

import { useRef, useTransition } from "react";
import { Button } from "@venture-sandbox/ui";
import { rewindToCheckpoint, saveCheckpoint } from "./actions";

interface Checkpoint {
  id: string;
  virtual_day: number;
  label: string | null;
  created_at: string;
}

export function CheckpointPanel({
  ventureId,
  runId,
  checkpoints,
  currentDay,
}: {
  ventureId: string;
  runId: string;
  checkpoints: Checkpoint[];
  currentDay: number;
}) {
  const [isPending, startTransition] = useTransition();
  const labelRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-vs-fg-muted">
          Checkpoints
        </p>
        <p className="mb-2 text-xs text-vs-fg-muted">
          Save the current state, then later try a different path from it — the original run
          keeps going untouched, and the new attempt starts as its own run seeded from this
          point.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const label = labelRef.current?.value ?? "";
            startTransition(() => {
              saveCheckpoint(ventureId, runId, label);
            });
            if (labelRef.current) labelRef.current.value = "";
          }}
          className="flex gap-2"
        >
          <input
            ref={labelRef}
            type="text"
            placeholder={`Checkpoint at day ${currentDay}`}
            className="flex-1 rounded-vs-sm border border-vs-border bg-transparent px-3 py-1.5 text-sm text-vs-fg placeholder:text-vs-fg-muted"
          />
          <Button type="submit" variant="secondary" disabled={isPending}>
            Save checkpoint
          </Button>
        </form>
      </div>

      {checkpoints.length > 0 && (
        <ul className="space-y-1.5">
          {checkpoints.map((cp) => (
            <li
              key={cp.id}
              className="flex items-center justify-between rounded-vs-sm border border-vs-border p-2 text-sm"
            >
              <span className="text-vs-fg">
                Day {cp.virtual_day} — {cp.label || "untitled"}
              </span>
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    rewindToCheckpoint(ventureId, cp.id);
                  })
                }
                className="text-xs font-medium text-vs-primary hover:underline disabled:opacity-50"
              >
                Try a different path from here
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
