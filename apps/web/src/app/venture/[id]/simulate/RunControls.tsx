"use client";

import { useTransition } from "react";
import { Button } from "@venture-sandbox/ui";
import { advanceSimDay, advanceToNextCheckpoint, submitSimDecision } from "./actions";

interface DecisionOption {
  id: string;
  label: string;
  immediateEffectSummary: string;
}

const SPEEDS = [
  { label: "1×", days: 1, hint: "1 virtual day" },
  { label: "5×", days: 5, hint: "up to 5 days" },
  { label: "10×", days: 10, hint: "up to 10 days" },
  { label: "20×", days: 20, hint: "up to 20 days" },
] as const;

export function RunControls({
  ventureId,
  runId,
  awaitingDecision,
  decisionOptions,
  isComplete,
}: {
  ventureId: string;
  runId: string;
  awaitingDecision: boolean;
  decisionOptions: DecisionOption[];
  isComplete: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (isComplete) {
    return <p className="text-sm text-vs-fg-muted">This timeline has finished. Start another run or rewind from a saved checkpoint to explore a different path.</p>;
  }

  if (awaitingDecision) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-primary">Decision checkpoint</p>
          <p className="mt-1 text-sm font-medium text-vs-fg">The simulation is paused until you choose a path.</p>
          <p className="mt-1 text-xs text-vs-fg-muted">Speed controls stop automatically at decision checkpoints, so consequential choices are never skipped.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {decisionOptions.map((opt) => (
            <button
              key={opt.id}
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  submitSimDecision(ventureId, runId, opt.id);
                })
              }
              className="rounded-vs-md border border-vs-border p-4 text-left text-sm transition hover:border-vs-primary hover:bg-vs-primary/5 disabled:opacity-50"
            >
              <span className="font-semibold text-vs-fg">{opt.label}</span>
              <span className="mt-1 block text-xs leading-5 text-vs-fg-muted">{opt.immediateEffectSummary}</span>
            </button>
          ))}
        </div>
        {isPending && <p className="text-xs text-vs-fg-muted">Applying decision and recalculating the timeline…</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Simulation speed</p>
          <p className="mt-1 text-xs text-vs-fg-muted">Advance faster through quiet periods. Every mode stops at the next required decision.</p>
        </div>
        <span className="rounded-full border border-vs-border px-2.5 py-1 text-[11px] font-medium text-vs-fg-muted">Paused between actions</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SPEEDS.map((speed) => (
          <button
            key={speed.label}
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                advanceSimDay(ventureId, runId, speed.days);
              })
            }
            className="rounded-vs-md border border-vs-border px-3 py-3 text-left transition hover:border-vs-primary hover:bg-vs-primary/5 disabled:opacity-50"
          >
            <span className="block text-lg font-semibold text-vs-fg">{speed.label}</span>
            <span className="block text-[11px] text-vs-fg-muted">{speed.hint}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              advanceToNextCheckpoint(ventureId, runId);
            })
          }
        >
          Advance to next decision
        </Button>
        {isPending && <span className="self-center text-xs text-vs-fg-muted">Processing timeline…</span>}
      </div>
    </div>
  );
}
