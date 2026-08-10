"use client";

import { useTransition } from "react";
import { Button } from "@venture-sandbox/ui";
import { advanceSimDay, submitSimDecision } from "./actions";

interface DecisionOption {
  id: string;
  label: string;
  immediateEffectSummary: string;
}

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
    return <p className="text-sm text-vs-fg-muted">This run has finished.</p>;
  }

  if (awaitingDecision) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-vs-fg">A decision is needed to continue:</p>
        {decisionOptions.map((opt) => (
          <button
            key={opt.id}
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                submitSimDecision(ventureId, runId, opt.id);
              })
            }
            className="block w-full rounded-vs-sm border border-vs-border p-3 text-left text-sm hover:border-vs-primary disabled:opacity-50"
          >
            <span className="font-medium text-vs-fg">{opt.label}</span>
            <span className="mt-0.5 block text-xs text-vs-fg-muted">{opt.immediateEffectSummary}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          advanceSimDay(ventureId, runId);
        })
      }
    >
      {isPending ? "Running..." : "Run next day"}
    </Button>
  );
}
