"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, Select, Spinner } from "@venture-sandbox/ui";
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
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-vs-fg">You need one more real venture before you can compare.</p>
          <p className="mt-1 text-sm leading-6 text-vs-fg-muted">
            Comparison only uses ventures you explicitly create. Sim Venture will not manufacture a second idea or seed a demo venture into your workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-vs-sm bg-vs-primary px-3 py-2 text-sm font-semibold text-vs-primary-fg"
          >
            Create another venture
          </Link>
          <Link
            href="/explore"
            className="rounded-vs-sm border border-vs-border bg-vs-bg px-3 py-2 text-sm font-semibold text-vs-fg"
          >
            Explore live sources first
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Venture to compare"
          className="min-w-0 flex-1"
        >
          {otherVentures.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
        <Button
          disabled={isPending || !selected}
          onClick={() => startTransition(() => createComparison(ventureId, selected))}
          className="w-full sm:w-auto"
        >
          {isPending && <Spinner className="mr-2" />}
          {isPending ? "Comparing..." : "Compare ventures"}
        </Button>
      </div>
      <p className="text-xs leading-5 text-vs-fg-muted">
        The comparison uses recorded evidence and scenario outputs from each venture. It does not invent a winner, success probability, traction or investor interest.
      </p>
    </div>
  );
}
