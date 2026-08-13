"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const simpleJourney = [
  ["Is this problem real?", "research"],
  ["Make the idea better", "shape"],
  ["Test the idea", "simulate"],
  ["Plan what to build", "build"],
  ["See what happened", "monitor"],
] as const;

const proJourney = [
  ["Understand", "research"],
  ["Shape", "shape"],
  ["Simulate", "simulate"],
  ["Build", "build"],
  ["Learn", "monitor"],
] as const;

const intelligence = [
  ["Evidence", "evidence"],
  ["Technology", "technology"],
  ["Feed", "feed"],
  ["Compare", "compare"],
  ["Investor World", "investor"],
  ["Scorecard", "scorecard"],
  ["System", "system"],
] as const;

export function VentureModeNav({ ventureId }: { ventureId: string }) {
  const [mode, setMode] = useState<"simple" | "pro">("simple");

  useEffect(() => {
    const saved = window.localStorage.getItem("venture-ui-mode");
    if (saved === "pro") setMode("pro");
  }, []);

  function choose(next: "simple" | "pro") {
    setMode(next);
    window.localStorage.setItem("venture-ui-mode", next);
  }

  const journey = mode === "simple" ? simpleJourney : proJourney;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-vs-fg-muted">
          {mode === "simple" ? "Simple mode — plain language and guided steps" : "Pro mode — full venture intelligence and advanced tools"}
        </p>
        <div className="inline-flex rounded-full border border-vs-border bg-vs-bg-subtle p-1" aria-label="Experience mode">
          <button type="button" onClick={() => choose("simple")} className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === "simple" ? "bg-vs-primary text-vs-primary-fg" : "text-vs-fg-muted"}`}>Simple</button>
          <button type="button" onClick={() => choose("pro")} className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === "pro" ? "bg-vs-primary text-vs-primary-fg" : "text-vs-fg-muted"}`}>Pro</button>
        </div>
      </div>

      <nav aria-label="Venture journey" className="flex gap-1 overflow-x-auto">
        {journey.map(([label, route], index) => (
          <Link key={route} href={`/venture/${ventureId}/${route}`} className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-vs-fg-muted hover:bg-vs-bg-subtle hover:text-vs-fg">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-vs-bg-subtle text-[11px]">{index + 1}</span>{label}
          </Link>
        ))}
        <Link href={`/venture/${ventureId}/monetization`} className="shrink-0 rounded-full border border-vs-primary/30 px-3 py-1.5 text-sm font-medium text-vs-primary">
          {mode === "simple" ? "How could it make money?" : "Monetization"}
        </Link>
      </nav>

      {mode === "pro" ? (
        <nav aria-label="Venture intelligence" className="mt-2 flex gap-1 overflow-x-auto border-t border-vs-border/70 pt-2">
          <span className="shrink-0 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-vs-fg-muted">Advanced</span>
          {intelligence.map(([label, route]) => <Link key={route} href={`/venture/${ventureId}/${route}`} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-vs-fg-muted hover:bg-vs-bg-subtle hover:text-vs-fg">{label}</Link>)}
        </nav>
      ) : (
        <div className="mt-2 border-t border-vs-border/70 pt-2 text-xs text-vs-fg-muted">
          Need the detailed evidence, technology, investor or scorecard tools? Switch to <button type="button" onClick={() => choose("pro")} className="font-semibold text-vs-primary">Pro mode</button>.
        </div>
      )}
    </div>
  );
}
