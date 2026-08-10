"use client";

import { useState, useTransition } from "react";
import { Button } from "@venture-sandbox/ui";
import { createComparison } from "./actions";

export function PickVentureForm({
  ventureId,
  otherVentures,
}: {
  ventureId: string;
  otherVentures: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState(otherVentures[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  if (otherVentures.length === 0) {
    return (
      <p className="text-sm text-vs-fg-muted">
        You need at least one other venture to compare against — create one from your dashboard first.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-vs-sm border border-vs-border bg-vs-bg px-3 py-2 text-sm text-vs-fg"
      >
        {otherVentures.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <Button
        disabled={isPending || !selected}
        onClick={() => startTransition(() => createComparison(ventureId, selected))}
      >
        {isPending ? "Comparing..." : "Compare"}
      </Button>
    </div>
  );
}
